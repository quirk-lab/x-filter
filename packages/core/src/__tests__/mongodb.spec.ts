import { toMongoQuery } from '../mongodb/index';
import type { FilterAny } from '../types';

describe('toMongoQuery', () => {
  it('empty filter compiles to {} (match all)', () => {
    const filter: FilterAny = { id: 'root', combinator: 'and', children: [] };
    expect(toMongoQuery(filter)).toEqual({});
  });

  it('equals / notEquals', () => {
    const eq: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'name', operator: 'equals', value: 'John' }],
    };
    expect(toMongoQuery(eq)).toEqual({ name: { $eq: 'John' } });

    const ne: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'name', operator: 'notEquals', value: 'John' }],
    };
    expect(toMongoQuery(ne)).toEqual({ name: { $ne: 'John' } });
  });

  it('comparison operators map to $gt/$gte/$lt/$lte', () => {
    const cases: Array<[string, string]> = [
      ['gt', '$gt'],
      ['gte', '$gte'],
      ['lt', '$lt'],
      ['lte', '$lte'],
      ['after', '$gt'],
      ['before', '$lt'],
    ];
    for (const [operator, mongoOp] of cases) {
      const filter: FilterAny = {
        id: 'root',
        combinator: 'and',
        children: [{ id: 'r1', field: 'age', operator, value: 18 }],
      };
      expect(toMongoQuery(filter)).toEqual({ age: { [mongoOp]: 18 } });
    }
  });

  it('contains / startsWith / endsWith use $regex with escaped input', () => {
    const contains: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'name', operator: 'contains', value: 'a.b' }],
    };
    expect(toMongoQuery(contains)).toEqual({ name: { $regex: 'a\\.b' } });

    const startsWith: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'name', operator: 'startsWith', value: 'Jo' }],
    };
    expect(toMongoQuery(startsWith)).toEqual({ name: { $regex: '^Jo' } });

    const endsWith: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'name', operator: 'endsWith', value: 'hn' }],
    };
    expect(toMongoQuery(endsWith)).toEqual({ name: { $regex: 'hn$' } });
  });

  it('notContains negates the regex', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'name', operator: 'notContains', value: 'oh' }],
    };
    expect(toMongoQuery(filter)).toEqual({ name: { $not: { $regex: 'oh' } } });
  });

  it('between uses $gte + $lte on the same field', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'age', operator: 'between', value: [18, 65] }],
    };
    expect(toMongoQuery(filter)).toEqual({ age: { $gte: 18, $lte: 65 } });
  });

  it('in / notIn', () => {
    const inFilter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'status', operator: 'in', value: ['a', 'b'] }],
    };
    expect(toMongoQuery(inFilter)).toEqual({ status: { $in: ['a', 'b'] } });

    const notInFilter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'status', operator: 'notIn', value: ['a', 'b'] }],
    };
    expect(toMongoQuery(notInFilter)).toEqual({ status: { $nin: ['a', 'b'] } });
  });

  it('isEmpty / isNotEmpty compare against null', () => {
    const empty: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'name', operator: 'isEmpty', value: null }],
    };
    expect(toMongoQuery(empty)).toEqual({ name: { $eq: null } });

    const notEmpty: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'name', operator: 'isNotEmpty', value: null }],
    };
    expect(toMongoQuery(notEmpty)).toEqual({ name: { $ne: null } });
  });

  it('AND / OR groups', () => {
    const and: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [
        { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
        { id: 'r2', field: 'age', operator: 'gt', value: 18 },
      ],
    };
    expect(toMongoQuery(and)).toEqual({
      $and: [{ name: { $eq: 'John' } }, { age: { $gt: 18 } }],
    });

    const or: FilterAny = { ...and, combinator: 'or' };
    expect(toMongoQuery(or)).toEqual({
      $or: [{ name: { $eq: 'John' } }, { age: { $gt: 18 } }],
    });
  });

  it('single-child group returns the child directly', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'name', operator: 'equals', value: 'John' }],
    };
    expect(toMongoQuery(filter)).toEqual({ name: { $eq: 'John' } });
  });

  it('NOT on a rule wraps with $nor', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'name', operator: 'equals', value: 'John', not: true }],
    };
    expect(toMongoQuery(filter)).toEqual({ $nor: [{ name: { $eq: 'John' } }] });
  });

  it('NOT on a group wraps the boolean expression with $nor', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'or',
      not: true,
      children: [
        { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
        { id: 'r2', field: 'age', operator: 'gt', value: 18 },
      ],
    };
    expect(toMongoQuery(filter)).toEqual({
      $nor: [{ $or: [{ name: { $eq: 'John' } }, { age: { $gt: 18 } }] }],
    });
  });

  it('nested groups produce a nested boolean tree', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [
        { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
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
    expect(toMongoQuery(filter)).toEqual({
      $and: [{ name: { $eq: 'John' } }, { $or: [{ age: { $lt: 18 } }, { age: { $gt: 65 } }] }],
    });
  });

  it('converts IC filters before compiling', () => {
    const filter: FilterAny = {
      id: 'root',
      children: [
        { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
        'and',
        { id: 'r2', field: 'age', operator: 'gt', value: 18 },
      ],
    };
    expect(toMongoQuery(filter)).toEqual({
      $and: [{ name: { $eq: 'John' } }, { age: { $gt: 18 } }],
    });
  });

  it('applies fieldMap to document paths', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'userName', operator: 'equals', value: 'Ada' }],
    };
    expect(toMongoQuery(filter, { fieldMap: { userName: 'user.name' } })).toEqual({
      'user.name': { $eq: 'Ada' },
    });
  });

  it('throws on unsupported operators', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'score', operator: 'customOp', value: 1 }],
    };
    expect(() => toMongoQuery(filter)).toThrow('Unsupported MongoDB operator: customOp');
  });
});
