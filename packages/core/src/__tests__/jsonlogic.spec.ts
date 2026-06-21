import { toJsonLogic } from '../jsonlogic/index';
import type { FilterAny } from '../types';

describe('toJsonLogic', () => {
  it('empty filter compiles to true (match all)', () => {
    const filter: FilterAny = { id: 'root', combinator: 'and', children: [] };
    expect(toJsonLogic(filter)).toBe(true);
  });

  it('single equals rule', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'name', operator: 'equals', value: 'John' }],
    };
    expect(toJsonLogic(filter)).toEqual({ '==': [{ var: 'name' }, 'John'] });
  });

  it('comparison operators map to JsonLogic operators', () => {
    const cases: Array<[string, unknown, string]> = [
      ['notEquals', 'x', '!='],
      ['gt', 1, '>'],
      ['gte', 1, '>='],
      ['lt', 1, '<'],
      ['lte', 1, '<='],
      ['before', '2020-01-01', '<'],
      ['after', '2020-01-01', '>'],
    ];
    for (const [operator, value, jl] of cases) {
      const filter: FilterAny = {
        id: 'root',
        combinator: 'and',
        children: [{ id: 'r1', field: 'f', operator, value }],
      };
      expect(toJsonLogic(filter)).toEqual({ [jl]: [{ var: 'f' }, value] });
    }
  });

  it('contains / notContains use in', () => {
    const contains: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'name', operator: 'contains', value: 'oh' }],
    };
    expect(toJsonLogic(contains)).toEqual({ in: ['oh', { var: 'name' }] });

    const notContains: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'name', operator: 'notContains', value: 'oh' }],
    };
    expect(toJsonLogic(notContains)).toEqual({ '!': { in: ['oh', { var: 'name' }] } });
  });

  it('startsWith / endsWith', () => {
    const sw: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'name', operator: 'startsWith', value: 'Jo' }],
    };
    expect(toJsonLogic(sw)).toEqual({ startsWith: [{ var: 'name' }, 'Jo'] });

    const ew: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'name', operator: 'endsWith', value: 'hn' }],
    };
    expect(toJsonLogic(ew)).toEqual({ endsWith: [{ var: 'name' }, 'hn'] });
  });

  it('between uses chained <= [min, var, max]', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'age', operator: 'between', value: [18, 65] }],
    };
    expect(toJsonLogic(filter)).toEqual({ '<=': [18, { var: 'age' }, 65] });
  });

  it('in / notIn carry the array', () => {
    const inFilter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'status', operator: 'in', value: ['a', 'b'] }],
    };
    expect(toJsonLogic(inFilter)).toEqual({ in: [{ var: 'status' }, ['a', 'b']] });

    const notInFilter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'status', operator: 'notIn', value: ['a', 'b'] }],
    };
    expect(toJsonLogic(notInFilter)).toEqual({ '!': { in: [{ var: 'status' }, ['a', 'b']] } });
  });

  it('isEmpty / isNotEmpty compare against null', () => {
    const empty: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'name', operator: 'isEmpty', value: null }],
    };
    expect(toJsonLogic(empty)).toEqual({ '==': [{ var: 'name' }, null] });

    const notEmpty: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'name', operator: 'isNotEmpty', value: null }],
    };
    expect(toJsonLogic(notEmpty)).toEqual({ '!=': [{ var: 'name' }, null] });
  });

  it('AND / OR groups wrap children', () => {
    const and: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [
        { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
        { id: 'r2', field: 'age', operator: 'gt', value: 18 },
      ],
    };
    expect(toJsonLogic(and)).toEqual({
      and: [{ '==': [{ var: 'name' }, 'John'] }, { '>': [{ var: 'age' }, 18] }],
    });

    const or: FilterAny = { ...and, combinator: 'or' };
    expect(toJsonLogic(or)).toEqual({
      or: [{ '==': [{ var: 'name' }, 'John'] }, { '>': [{ var: 'age' }, 18] }],
    });
  });

  it('single-child group returns the child without a combinator wrapper', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'name', operator: 'equals', value: 'John' }],
    };
    expect(toJsonLogic(filter)).toEqual({ '==': [{ var: 'name' }, 'John'] });
  });

  it('NOT on a rule wraps with !', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'name', operator: 'equals', value: 'John', not: true }],
    };
    expect(toJsonLogic(filter)).toEqual({ '!': { '==': [{ var: 'name' }, 'John'] } });
  });

  it('NOT on a group wraps the whole boolean expression with !', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      not: true,
      children: [
        { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
        { id: 'r2', field: 'age', operator: 'gt', value: 18 },
      ],
    };
    expect(toJsonLogic(filter)).toEqual({
      '!': { and: [{ '==': [{ var: 'name' }, 'John'] }, { '>': [{ var: 'age' }, 18] }] },
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
    expect(toJsonLogic(filter)).toEqual({
      and: [
        { '==': [{ var: 'name' }, 'John'] },
        { or: [{ '<': [{ var: 'age' }, 18] }, { '>': [{ var: 'age' }, 65] }] },
      ],
    });
  });

  it('skips empty nested groups', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [
        { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
        { id: 'g1', combinator: 'and', children: [] },
      ],
    };
    expect(toJsonLogic(filter)).toEqual({ '==': [{ var: 'name' }, 'John'] });
  });

  it('converts IC filters before compiling', () => {
    const filter: FilterAny = {
      id: 'root',
      children: [
        { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
        'or',
        { id: 'r2', field: 'age', operator: 'gt', value: 18 },
      ],
    };
    expect(toJsonLogic(filter)).toEqual({
      or: [{ '==': [{ var: 'name' }, 'John'] }, { '>': [{ var: 'age' }, 18] }],
    });
  });

  it('applies fieldMap to variable paths', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'userName', operator: 'equals', value: 'Ada' }],
    };
    expect(toJsonLogic(filter, { fieldMap: { userName: 'user.name' } })).toEqual({
      '==': [{ var: 'user.name' }, 'Ada'],
    });
  });

  it('throws on unsupported operators', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'score', operator: 'customOp', value: 1 }],
    };
    expect(() => toJsonLogic(filter)).toThrow('Unsupported JsonLogic operator: customOp');
  });
});
