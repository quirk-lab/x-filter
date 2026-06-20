import { toElasticQuery } from '../elasticsearch/index';
import type { FilterAny } from '../types';

describe('toElasticQuery', () => {
  it('empty filter compiles to match_all', () => {
    const filter: FilterAny = { id: 'root', combinator: 'and', children: [] };
    expect(toElasticQuery(filter)).toEqual({ match_all: {} });
  });

  it('equals uses term', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'status', operator: 'equals', value: 'open' }],
    };
    expect(toElasticQuery(filter)).toEqual({ term: { status: 'open' } });
  });

  it('notEquals wraps term in bool.must_not', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'status', operator: 'notEquals', value: 'open' }],
    };
    expect(toElasticQuery(filter)).toEqual({ bool: { must_not: [{ term: { status: 'open' } }] } });
  });

  it('contains / endsWith use wildcard, startsWith uses prefix', () => {
    const contains: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'name', operator: 'contains', value: 'oh' }],
    };
    expect(toElasticQuery(contains)).toEqual({ wildcard: { name: '*oh*' } });

    const startsWith: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'name', operator: 'startsWith', value: 'Jo' }],
    };
    expect(toElasticQuery(startsWith)).toEqual({ prefix: { name: 'Jo' } });

    const endsWith: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'name', operator: 'endsWith', value: 'hn' }],
    };
    expect(toElasticQuery(endsWith)).toEqual({ wildcard: { name: '*hn' } });
  });

  it('escapes wildcard metacharacters in contains', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'name', operator: 'contains', value: 'a*b?' }],
    };
    expect(toElasticQuery(filter)).toEqual({ wildcard: { name: '*a\\*b\\?*' } });
  });

  it('notContains negates the wildcard', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'name', operator: 'notContains', value: 'oh' }],
    };
    expect(toElasticQuery(filter)).toEqual({
      bool: { must_not: [{ wildcard: { name: '*oh*' } }] },
    });
  });

  it('range operators map to range queries', () => {
    const cases: Array<[string, string]> = [
      ['gt', 'gt'],
      ['gte', 'gte'],
      ['lt', 'lt'],
      ['lte', 'lte'],
      ['after', 'gt'],
      ['before', 'lt'],
    ];
    for (const [operator, esKey] of cases) {
      const filter: FilterAny = {
        id: 'root',
        combinator: 'and',
        children: [{ id: 'r1', field: 'age', operator, value: 18 }],
      };
      expect(toElasticQuery(filter)).toEqual({ range: { age: { [esKey]: 18 } } });
    }
  });

  it('between maps to a range with gte + lte', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'age', operator: 'between', value: [18, 65] }],
    };
    expect(toElasticQuery(filter)).toEqual({ range: { age: { gte: 18, lte: 65 } } });
  });

  it('in uses terms, notIn negates terms', () => {
    const inFilter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'status', operator: 'in', value: ['a', 'b'] }],
    };
    expect(toElasticQuery(inFilter)).toEqual({ terms: { status: ['a', 'b'] } });

    const notInFilter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'status', operator: 'notIn', value: ['a', 'b'] }],
    };
    expect(toElasticQuery(notInFilter)).toEqual({
      bool: { must_not: [{ terms: { status: ['a', 'b'] } }] },
    });
  });

  it('isEmpty / isNotEmpty use exists', () => {
    const empty: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'name', operator: 'isEmpty', value: null }],
    };
    expect(toElasticQuery(empty)).toEqual({ bool: { must_not: [{ exists: { field: 'name' } }] } });

    const notEmpty: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'name', operator: 'isNotEmpty', value: null }],
    };
    expect(toElasticQuery(notEmpty)).toEqual({ exists: { field: 'name' } });
  });

  it('AND uses bool.must', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [
        { id: 'r1', field: 'status', operator: 'equals', value: 'open' },
        { id: 'r2', field: 'age', operator: 'gt', value: 18 },
      ],
    };
    expect(toElasticQuery(filter)).toEqual({
      bool: { must: [{ term: { status: 'open' } }, { range: { age: { gt: 18 } } }] },
    });
  });

  it('OR uses bool.should with minimum_should_match', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'or',
      children: [
        { id: 'r1', field: 'status', operator: 'equals', value: 'open' },
        { id: 'r2', field: 'age', operator: 'gt', value: 18 },
      ],
    };
    expect(toElasticQuery(filter)).toEqual({
      bool: {
        should: [{ term: { status: 'open' } }, { range: { age: { gt: 18 } } }],
        minimum_should_match: 1,
      },
    });
  });

  it('single-child group returns the child directly', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'status', operator: 'equals', value: 'open' }],
    };
    expect(toElasticQuery(filter)).toEqual({ term: { status: 'open' } });
  });

  it('NOT on a rule wraps with bool.must_not', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'status', operator: 'equals', value: 'open', not: true }],
    };
    expect(toElasticQuery(filter)).toEqual({ bool: { must_not: [{ term: { status: 'open' } }] } });
  });

  it('NOT on a group wraps the bool expression with must_not', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      not: true,
      children: [
        { id: 'r1', field: 'status', operator: 'equals', value: 'open' },
        { id: 'r2', field: 'age', operator: 'gt', value: 18 },
      ],
    };
    expect(toElasticQuery(filter)).toEqual({
      bool: {
        must_not: [
          { bool: { must: [{ term: { status: 'open' } }, { range: { age: { gt: 18 } } }] } },
        ],
      },
    });
  });

  it('nested groups produce a nested bool tree', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [
        { id: 'r1', field: 'status', operator: 'equals', value: 'open' },
        {
          id: 'g1',
          combinator: 'or',
          children: [
            { id: 'r2', field: 'age', operator: 'lt', value: 18 },
            { id: 'r3', field: 'age', operator: 'gt', value: 65 },
          ],
        },
      ],
    };
    expect(toElasticQuery(filter)).toEqual({
      bool: {
        must: [
          { term: { status: 'open' } },
          {
            bool: {
              should: [{ range: { age: { lt: 18 } } }, { range: { age: { gt: 65 } } }],
              minimum_should_match: 1,
            },
          },
        ],
      },
    });
  });

  it('converts IC filters before compiling', () => {
    const filter: FilterAny = {
      id: 'root',
      children: [
        { id: 'r1', field: 'status', operator: 'equals', value: 'open' },
        'and',
        { id: 'r2', field: 'age', operator: 'gt', value: 18 },
      ],
    };
    expect(toElasticQuery(filter)).toEqual({
      bool: { must: [{ term: { status: 'open' } }, { range: { age: { gt: 18 } } }] },
    });
  });

  it('applies fieldMap to indexed field names', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'userName', operator: 'equals', value: 'Ada' }],
    };
    expect(toElasticQuery(filter, { fieldMap: { userName: 'user.name.keyword' } })).toEqual({
      term: { 'user.name.keyword': 'Ada' },
    });
  });

  it('throws on unsupported operators', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'score', operator: 'customOp', value: 1 }],
    };
    expect(() => toElasticQuery(filter)).toThrow('Unsupported Elasticsearch operator: customOp');
  });
});
