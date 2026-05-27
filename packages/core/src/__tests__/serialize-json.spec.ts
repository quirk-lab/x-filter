import { fromJSON, toJSON } from '../serialize-json';
import type { FilterAny } from '../types';

describe('toJSON', () => {
  it('empty filter (conditions: [], combinator: and) returns {}', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      conditions: [],
    };
    expect(toJSON(filter)).toEqual({});
  });

  it('simple filter with one rule returns correct structure (has combinator, conditions with field/operator/value)', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      conditions: [{ id: 'r1', field: 'name', operator: 'equals', value: 'John' }],
    };
    const json = toJSON(filter);
    expect(json).toHaveProperty('combinator', 'and');
    expect(json).toHaveProperty('conditions');
    const conditions = json.conditions as unknown[];
    expect(Array.isArray(conditions)).toBe(true);
    expect(conditions).toHaveLength(1);
    expect(conditions[0]).toEqual({ field: 'name', operator: 'equals', value: 'John' });
  });

  it('filter with not:true includes not flag', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      not: true,
      conditions: [{ id: 'r1', field: 'name', operator: 'equals', value: 'John' }],
    };
    const json = toJSON(filter);
    expect(json).toHaveProperty('not', true);
  });

  it('strips IDs (output should NOT have id fields)', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      conditions: [
        { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
        {
          id: 'g1',
          combinator: 'or',
          conditions: [{ id: 'r2', field: 'age', operator: 'gt', value: 18 }],
        },
      ],
    };
    const json = toJSON(filter);
    expect(json).not.toHaveProperty('id');
    const conditions = json.conditions as Record<string, unknown>[];
    expect(conditions[0]).not.toHaveProperty('id');
    expect(conditions[1]).not.toHaveProperty('id');
    expect((conditions[1] as Record<string, unknown>).conditions).toBeDefined();
    const nestedConditions = (conditions[1] as Record<string, unknown>).conditions as Record<
      string,
      unknown
    >[];
    expect(nestedConditions[0]).not.toHaveProperty('id');
  });

  it('nested filter has nested conditions', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      conditions: [
        { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
        {
          id: 'g1',
          combinator: 'or',
          conditions: [{ id: 'r2', field: 'age', operator: 'gt', value: 18 }],
        },
      ],
    };
    const json = toJSON(filter);
    const conditions = json.conditions as Record<string, unknown>[];
    expect(conditions).toHaveLength(2);
    const nested = conditions[1] as Record<string, unknown>;
    expect(nested).toHaveProperty('combinator', 'or');
    expect(nested).toHaveProperty('conditions');
    const nestedConditions = nested.conditions as unknown[];
    expect(Array.isArray(nestedConditions)).toBe(true);
    expect(nestedConditions[0]).toEqual({ field: 'age', operator: 'gt', value: 18 });
  });

  it('IC mode toJSON includes ic:true flag', () => {
    const filter: FilterAny = {
      id: 'root',
      conditions: [
        { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
        'and',
        { id: 'r2', field: 'age', operator: 'gt', value: 18 },
      ],
    };
    const json = toJSON(filter);
    expect(json).toHaveProperty('ic', true);
    expect(json).toHaveProperty('conditions');
  });

  it('IC mode empty filter with not flag', () => {
    const filter: FilterAny = {
      id: 'root',
      not: true,
      conditions: [],
    };
    const json = toJSON(filter);
    expect(json).toHaveProperty('ic', true);
    expect(json).toHaveProperty('not', true);
  });

  it('IC mode toJSON with nested IC group', () => {
    const filter: FilterAny = {
      id: 'root',
      conditions: [
        {
          id: 'g1',
          conditions: [
            { id: 'r1', field: 'a', operator: 'eq', value: 1 },
            'or',
            { id: 'r2', field: 'b', operator: 'eq', value: 2 },
          ],
        },
      ],
    };
    const json = toJSON(filter);
    expect(json).toHaveProperty('ic', true);
    const conditions = json.conditions as unknown[];
    expect(conditions).toHaveLength(1);
    const nested = conditions[0] as Record<string, unknown>;
    expect(nested).toHaveProperty('ic', true);
    expect(nested).toHaveProperty('conditions');
  });

  it('toJSON rule with not flag', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      conditions: [{ id: 'r1', field: 'name', operator: 'equals', value: 'John', not: true }],
    };
    const json = toJSON(filter);
    const conditions = json.conditions as Record<string, unknown>[];
    expect(conditions[0]).toHaveProperty('not', true);
  });

  it('toJSON filter with combinator or and no conditions is not empty', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'or',
      conditions: [],
    };
    const json = toJSON(filter);
    expect(json).toHaveProperty('combinator', 'or');
  });
});

describe('fromJSON', () => {
  it('{} returns empty filter with generated id', () => {
    const filter = fromJSON({});
    expect(filter).toHaveProperty('id');
    expect(typeof filter.id).toBe('string');
    expect(filter.id.length).toBeGreaterThan(0);
    expect('combinator' in filter && filter.combinator).toBe('and');
    expect('conditions' in filter && filter.conditions).toEqual([]);
  });

  it('simple filter returns filter with generated ids', () => {
    const json = {
      combinator: 'and',
      conditions: [{ field: 'name', operator: 'equals', value: 'John' }],
    };
    const filter = fromJSON(json);
    expect(filter).toHaveProperty('id');
    expect('conditions' in filter).toBe(true);
    const conditions = (filter as { conditions: unknown[] }).conditions;
    expect(conditions).toHaveLength(1);
    expect(conditions[0]).toHaveProperty('id');
    expect(conditions[0]).toMatchObject({ field: 'name', operator: 'equals', value: 'John' });
  });

  it('nested filter reconstructs nested structure', () => {
    const json = {
      combinator: 'and',
      conditions: [
        { field: 'name', operator: 'equals', value: 'John' },
        {
          combinator: 'or',
          conditions: [{ field: 'age', operator: 'gt', value: 18 }],
        },
      ],
    };
    const filter = fromJSON(json);
    const conditions = (filter as { conditions: unknown[] }).conditions;
    expect(conditions).toHaveLength(2);
    const nested = conditions[1] as { combinator: string; conditions: unknown[] };
    expect(nested.combinator).toBe('or');
    expect(nested.conditions).toHaveLength(1);
    expect(nested.conditions[0]).toMatchObject({ field: 'age', operator: 'gt', value: 18 });
  });

  it('restores not flags', () => {
    const json = {
      combinator: 'and',
      not: true,
      conditions: [{ field: 'name', operator: 'equals', value: 'John', not: true }],
    };
    const filter = fromJSON(json);
    expect(filter).toHaveProperty('not', true);
    const conditions = (filter as { conditions: unknown[] }).conditions;
    expect(conditions[0]).toHaveProperty('not', true);
  });

  it('IC mode fromJSON restores IC structure', () => {
    const json = {
      ic: true,
      conditions: [
        { field: 'name', operator: 'equals', value: 'John' },
        'and',
        { field: 'age', operator: 'gt', value: 18 },
      ],
    };
    const filter = fromJSON(json);
    expect(filter).not.toHaveProperty('combinator');
    expect(filter).toHaveProperty('conditions');
    const conditions = (filter as { conditions: unknown[] }).conditions;
    expect(conditions).toContain('and');
    expect(conditions[0]).toMatchObject({ field: 'name', operator: 'equals', value: 'John' });
    expect(conditions[2]).toMatchObject({ field: 'age', operator: 'gt', value: 18 });
  });

  it('IC mode fromJSON with nested IC groups', () => {
    const json = {
      ic: true,
      conditions: [
        {
          ic: true,
          conditions: [
            { field: 'a', operator: 'eq', value: 1 },
            'or',
            { field: 'b', operator: 'eq', value: 2 },
          ],
        },
      ],
    };
    const filter = fromJSON(json);
    const conditions = (filter as { conditions: unknown[] }).conditions;
    expect(conditions).toHaveLength(1);
    const nested = conditions[0] as { conditions: unknown[] };
    expect(nested.conditions).toHaveLength(3);
    expect(nested.conditions[1]).toBe('or');
  });

  it('IC mode fromJSON with not flag', () => {
    const json = {
      ic: true,
      not: true,
      conditions: [],
    };
    const filter = fromJSON(json);
    expect(filter).toHaveProperty('not', true);
  });

  it('fromJSON handles missing conditions gracefully', () => {
    const json = { combinator: 'or' };
    const filter = fromJSON(json);
    expect(filter).toHaveProperty('id');
    const conditions = (filter as { conditions: unknown[] }).conditions;
    expect(conditions).toEqual([]);
  });
});

describe('round-trip', () => {
  it('fromJSON(toJSON(filter)) produces structurally equivalent filter (same fields, operators, values)', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      conditions: [
        { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
        {
          id: 'g1',
          combinator: 'or',
          conditions: [
            { id: 'r2', field: 'age', operator: 'gt', value: 18 },
            { id: 'r3', field: 'status', operator: 'equals', value: 'active' },
          ],
        },
      ],
    };
    const roundTripped = fromJSON(toJSON(filter));
    const extractStructure = (f: unknown): unknown => {
      if (f && typeof f === 'object' && 'conditions' in f) {
        const g = f as { combinator?: string; conditions: unknown[] };
        return {
          combinator: g.combinator,
          conditions: g.conditions.map((c) => {
            if (c && typeof c === 'object' && 'field' in c) {
              const r = c as Record<string, unknown>;
              return { field: r.field, operator: r.operator, value: r.value };
            }
            return extractStructure(c);
          }),
        };
      }
      return f;
    };
    expect(extractStructure(roundTripped)).toEqual(extractStructure(filter));
  });

  it('toJSON deterministic: same input produces same output', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      conditions: [{ id: 'r1', field: 'name', operator: 'equals', value: 'John' }],
    };
    const a = toJSON(filter);
    const b = toJSON(filter);
    expect(a).toEqual(b);
  });
});
