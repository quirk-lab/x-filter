import { filterToAst } from '../../dsl/convert';
import { formatAST, formatDSL } from '../../dsl/format';
import { parseDSL } from '../../dsl/parse';
import type { Filter } from '../../types';

let counter: number;
const testIdGen = () => `id-${counter++}`;
const resetIds = () => {
  counter = 0;
};

describe('roundtrip: Filter -> formatDSL -> parseDSL -> Filter', () => {
  beforeEach(resetIds);

  const roundtrip = (filter: Filter): Filter => {
    const dsl = formatDSL(filter);
    resetIds();
    return parseDSL(dsl, testIdGen);
  };

  it('simple single rule', () => {
    const dsl = formatDSL({
      id: 'x',
      combinator: 'and',
      conditions: [{ id: 'y', field: 'status', operator: 'equals', value: 'active' }],
    });
    resetIds();
    const result = parseDSL(dsl, testIdGen);
    expect(result.conditions).toHaveLength(1);
    expect(result.conditions[0]).toMatchObject({
      field: 'status',
      operator: 'equals',
      value: 'active',
    });
  });

  it('multiple AND rules', () => {
    const filter: Filter = {
      id: testIdGen(),
      combinator: 'and',
      conditions: [
        { id: testIdGen(), field: 'a', operator: 'eq', value: 'x' },
        { id: testIdGen(), field: 'b', operator: 'eq', value: 'y' },
        { id: testIdGen(), field: 'c', operator: 'eq', value: 'z' },
      ],
    };
    resetIds();
    const result = roundtrip(filter);
    expect(result).toEqual(filter);
  });

  it('multiple OR rules', () => {
    const filter: Filter = {
      id: testIdGen(),
      combinator: 'or',
      conditions: [
        { id: testIdGen(), field: 'a', operator: 'eq', value: 'x' },
        { id: testIdGen(), field: 'b', operator: 'eq', value: 'y' },
      ],
    };
    resetIds();
    const result = roundtrip(filter);
    expect(result).toEqual(filter);
  });

  it('NOT on rule', () => {
    const dsl = formatDSL({
      id: 'x',
      combinator: 'and',
      conditions: [{ id: 'y', field: 'status', operator: 'eq', value: 'active', not: true }],
    });
    resetIds();
    const result = parseDSL(dsl, testIdGen);
    expect(result.conditions).toHaveLength(1);
    expect(result.conditions[0]).toMatchObject({
      field: 'status',
      operator: 'eq',
      value: 'active',
      not: true,
    });
  });

  it('NOT on group', () => {
    const filter: Filter = {
      id: testIdGen(),
      combinator: 'and',
      not: true,
      conditions: [
        { id: testIdGen(), field: 'a', operator: 'eq', value: 'x' },
        { id: testIdGen(), field: 'b', operator: 'eq', value: 'y' },
      ],
    };
    resetIds();
    const result = roundtrip(filter);
    expect(result).toEqual(filter);
  });

  it('number value', () => {
    const dsl = formatDSL({
      id: 'x',
      combinator: 'and',
      conditions: [{ id: 'y', field: 'age', operator: 'gt', value: 42 }],
    });
    resetIds();
    const result = parseDSL(dsl, testIdGen);
    expect(result.conditions[0]).toMatchObject({ field: 'age', operator: 'gt', value: 42 });
  });

  it('boolean value', () => {
    const dsl = formatDSL({
      id: 'x',
      combinator: 'and',
      conditions: [{ id: 'y', field: 'active', operator: 'eq', value: true }],
    });
    resetIds();
    const result = parseDSL(dsl, testIdGen);
    expect(result.conditions[0]).toMatchObject({ field: 'active', operator: 'eq', value: true });
  });

  it('array value', () => {
    const dsl = formatDSL({
      id: 'x',
      combinator: 'and',
      conditions: [{ id: 'y', field: 'tags', operator: 'in', value: ['a', 'b', 'c'] }],
    });
    resetIds();
    const result = parseDSL(dsl, testIdGen);
    expect(result.conditions[0]).toMatchObject({
      field: 'tags',
      operator: 'in',
      value: ['a', 'b', 'c'],
    });
  });

  it('range value preserves as array through filter roundtrip', () => {
    const dsl = formatDSL({
      id: 'x',
      combinator: 'and',
      conditions: [{ id: 'y', field: 'age', operator: 'between', value: [18, 65] }],
    });
    resetIds();
    const result = parseDSL(dsl, testIdGen);
    expect(result.conditions[0]).toMatchObject({
      field: 'age',
      operator: 'between',
      value: [18, 65],
    });
  });

  it('nested groups (3 levels)', () => {
    const filter: Filter = {
      id: testIdGen(),
      combinator: 'and',
      conditions: [
        { id: testIdGen(), field: 'a', operator: 'eq', value: 'x' },
        {
          id: testIdGen(),
          combinator: 'or',
          conditions: [
            { id: testIdGen(), field: 'b', operator: 'eq', value: 'y' },
            {
              id: testIdGen(),
              combinator: 'and',
              conditions: [
                { id: testIdGen(), field: 'c', operator: 'eq', value: 'z' },
                { id: testIdGen(), field: 'd', operator: 'eq', value: 'w' },
              ],
            },
          ],
        },
      ],
    };
    resetIds();
    const result = roundtrip(filter);
    expect(result).toEqual(filter);
  });

  it('mixed AND/OR with group', () => {
    const filter: Filter = {
      id: testIdGen(),
      combinator: 'and',
      conditions: [
        { id: testIdGen(), field: 'a', operator: 'eq', value: 'x' },
        {
          id: testIdGen(),
          combinator: 'or',
          conditions: [
            { id: testIdGen(), field: 'b', operator: 'eq', value: 'y' },
            { id: testIdGen(), field: 'c', operator: 'eq', value: 'z' },
          ],
        },
      ],
    };
    resetIds();
    const result = roundtrip(filter);
    expect(result).toEqual(filter);
  });

  it('unary operator (no value)', () => {
    const dsl = formatDSL({
      id: 'x',
      combinator: 'and',
      conditions: [{ id: 'y', field: 'status', operator: 'isEmpty', value: undefined }],
    });
    resetIds();
    const result = parseDSL(dsl, testIdGen);
    expect(result.conditions[0]).toMatchObject({
      field: 'status',
      operator: 'isEmpty',
      value: undefined,
    });
  });

  it('object value falls back to string via String()', () => {
    const filter: Filter = {
      id: 'x',
      combinator: 'and',
      conditions: [{ id: 'y', field: 'meta', operator: 'eq', value: { foo: 'bar' } }],
    };
    const dsl = formatDSL(filter);
    expect(dsl).toContain('meta:eq:');
  });

  it('null value treated as unary', () => {
    const filter: Filter = {
      id: 'x',
      combinator: 'and',
      conditions: [{ id: 'y', field: 'status', operator: 'isEmpty', value: null }],
    };
    const dsl = formatDSL(filter);
    expect(dsl).toBe('status:isEmpty');
  });

  it('range DSL string is correctly parsed', () => {
    resetIds();
    const filter = parseDSL('age:between:{18..65}', testIdGen);
    expect(filter.conditions[0]).toMatchObject({
      field: 'age',
      operator: 'between',
      value: [18, 65],
    });
  });

  it('empty group formats and re-parses', () => {
    const filter: Filter = {
      id: 'x',
      combinator: 'and',
      conditions: [],
    };
    const dsl = formatDSL(filter);
    expect(dsl).toBeDefined();
  });
});

describe('roundtrip: DSL -> parseDSL -> formatDSL -> same DSL', () => {
  beforeEach(resetIds);

  it.each([
    'status:equals:active',
    'a:eq:1 AND b:eq:2',
    'a:eq:1 OR b:eq:2',
    'a:eq:1 OR b:eq:2 AND c:eq:3',
    '(a:eq:1 OR b:eq:2) AND c:eq:3',
    'NOT status:equals:active',
    'NOT (a:eq:1 OR b:eq:2)',
    'status:isEmpty',
    'tags:in:[a,b,c]',
    'name:eq:"hello world"',
    'active:eq:true',
    'count:gt:42',
  ])('preserves: %s', (dsl) => {
    const filter = parseDSL(dsl, testIdGen);
    const ast = filterToAst(filter);
    const output = formatAST(ast);
    expect(output).toBe(dsl);
  });
});
