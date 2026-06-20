import { isFilterGroupIC } from '../ic';
import { fromJSON, toJSON } from '../serialize-json';
import type { FilterAny } from '../types';
import { isFilterGroup } from '../types';

describe('toJSON', () => {
  it('empty filter (children: [], combinator: and) returns {}', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [],
    };
    expect(toJSON(filter)).toEqual({});
  });

  it('simple filter with one rule returns correct structure', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'name', operator: 'equals', value: 'John' }],
    };
    const json = toJSON(filter);
    expect(json).toHaveProperty('combinator', 'and');
    expect(json).toHaveProperty('children');
    const jsonChildren = json.children as unknown[];
    expect(Array.isArray(jsonChildren)).toBe(true);
    expect(jsonChildren).toHaveLength(1);
    expect(jsonChildren[0]).toEqual({ field: 'name', operator: 'equals', value: 'John' });
  });

  it('filter with not:true includes not flag', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      not: true,
      children: [{ id: 'r1', field: 'name', operator: 'equals', value: 'John' }],
    };
    const json = toJSON(filter);
    expect(json).toHaveProperty('not', true);
  });

  it('strips IDs (output should NOT have id fields)', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [
        { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
        {
          id: 'g1',
          combinator: 'or',
          children: [{ id: 'r2', field: 'age', operator: 'gt', value: 18 }],
        },
      ],
    };
    const json = toJSON(filter);
    expect(json).not.toHaveProperty('id');
    const jsonChildren = json.children as Record<string, unknown>[];
    expect(jsonChildren[0]).not.toHaveProperty('id');
    expect(jsonChildren[1]).not.toHaveProperty('id');
    expect(jsonChildren[1]).toHaveProperty('children');
    const nestedChildren = jsonChildren[1].children as Record<string, unknown>[];
    expect(nestedChildren[0]).not.toHaveProperty('id');
  });

  it('nested filter has nested children', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [
        { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
        {
          id: 'g1',
          combinator: 'or',
          children: [{ id: 'r2', field: 'age', operator: 'gt', value: 18 }],
        },
      ],
    };
    const json = toJSON(filter);
    const jsonChildren = json.children as Record<string, unknown>[];
    expect(jsonChildren).toHaveLength(2);
    const nested = jsonChildren[1] as Record<string, unknown>;
    expect(nested).toHaveProperty('combinator', 'or');
    expect(nested).toHaveProperty('children');
    const nestedChildren = nested.children as unknown[];
    expect(Array.isArray(nestedChildren)).toBe(true);
    expect(nestedChildren[0]).toEqual({ field: 'age', operator: 'gt', value: 18 });
  });

  it('IC mode toJSON includes ic:true flag', () => {
    const filter: FilterAny = {
      id: 'root',
      children: [
        { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
        'and',
        { id: 'r2', field: 'age', operator: 'gt', value: 18 },
      ],
    };
    const json = toJSON(filter);
    expect(json).toHaveProperty('ic', true);
    expect(json).toHaveProperty('children');
  });

  it('IC mode empty filter with not flag', () => {
    const filter: FilterAny = {
      id: 'root',
      not: true,
      children: [],
    };
    const json = toJSON(filter);
    expect(json).toHaveProperty('ic', true);
    expect(json).toHaveProperty('not', true);
  });

  it('IC mode toJSON with nested IC group', () => {
    const filter: FilterAny = {
      id: 'root',
      children: [
        {
          id: 'g1',
          children: [
            { id: 'r1', field: 'a', operator: 'eq', value: 1 },
            'or',
            { id: 'r2', field: 'b', operator: 'eq', value: 2 },
          ],
        },
      ],
    };
    const json = toJSON(filter);
    expect(json).toHaveProperty('ic', true);
    const jsonChildren = json.children as unknown[];
    expect(jsonChildren).toHaveLength(1);
    const nested = jsonChildren[0] as Record<string, unknown>;
    expect(nested).toHaveProperty('ic', true);
    expect(nested).toHaveProperty('children');
  });

  it('toJSON rule with not flag', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'name', operator: 'equals', value: 'John', not: true }],
    };
    const json = toJSON(filter);
    const jsonChildren = json.children as Record<string, unknown>[];
    expect(jsonChildren[0]).toHaveProperty('not', true);
  });

  it('toJSON filter with combinator or and no children is not empty', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'or',
      children: [],
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
    expect('children' in filter && filter.children).toEqual([]);
  });

  it('simple filter returns filter with generated ids', () => {
    const json = {
      combinator: 'and',
      children: [{ field: 'name', operator: 'equals', value: 'John' }],
    };
    const filter = fromJSON(json);
    expect(filter).toHaveProperty('id');
    expect('children' in filter).toBe(true);
    if ('children' in filter) {
      const children = filter.children as unknown[];
      expect(children).toHaveLength(1);
      expect(children[0]).toHaveProperty('id');
      expect(children[0]).toMatchObject({ field: 'name', operator: 'equals', value: 'John' });
    }
  });

  it('nested filter reconstructs nested structure', () => {
    const json = {
      combinator: 'and',
      children: [
        { field: 'name', operator: 'equals', value: 'John' },
        {
          combinator: 'or',
          children: [{ field: 'age', operator: 'gt', value: 18 }],
        },
      ],
    };
    const filter = fromJSON(json);
    if ('children' in filter) {
      const children = filter.children as unknown[];
      expect(children).toHaveLength(2);
      const nested = children[1];
      if (isFilterGroup(nested)) {
        expect(nested.combinator).toBe('or');
        expect(nested.children).toHaveLength(1);
        expect(nested.children[0]).toMatchObject({ field: 'age', operator: 'gt', value: 18 });
      }
    }
  });

  it('restores not flags', () => {
    const json = {
      combinator: 'and',
      not: true,
      children: [{ field: 'name', operator: 'equals', value: 'John', not: true }],
    };
    const filter = fromJSON(json);
    expect(filter).toHaveProperty('not', true);
    if ('children' in filter) {
      const children = filter.children as unknown[];
      expect(children[0]).toHaveProperty('not', true);
    }
  });

  it('IC mode fromJSON restores IC structure', () => {
    const json = {
      ic: true,
      children: [
        { field: 'name', operator: 'equals', value: 'John' },
        'and',
        { field: 'age', operator: 'gt', value: 18 },
      ],
    };
    const filter = fromJSON(json);
    expect(filter).not.toHaveProperty('combinator');
    expect(filter).toHaveProperty('children');
    if ('children' in filter) {
      const children = filter.children as unknown[];
      expect(children).toContain('and');
      expect(children[0]).toMatchObject({ field: 'name', operator: 'equals', value: 'John' });
      expect(children[2]).toMatchObject({ field: 'age', operator: 'gt', value: 18 });
    }
  });

  it('IC mode fromJSON with nested IC groups', () => {
    const json = {
      ic: true,
      children: [
        {
          ic: true,
          children: [
            { field: 'a', operator: 'eq', value: 1 },
            'or',
            { field: 'b', operator: 'eq', value: 2 },
          ],
        },
      ],
    };
    const filter = fromJSON(json);
    if ('children' in filter) {
      const children = filter.children as unknown[];
      expect(children).toHaveLength(1);
      const nested = children[0];
      if (nested && typeof nested === 'object' && 'children' in nested) {
        const nestedChildren = nested.children as unknown[];
        expect(nestedChildren).toHaveLength(3);
        expect(nestedChildren[1]).toBe('or');
      }
    }
  });

  it('IC mode fromJSON with not flag', () => {
    const json = {
      ic: true,
      not: true,
      children: [],
    };
    const filter = fromJSON(json);
    expect(filter).toHaveProperty('not', true);
  });

  it('fromJSON handles missing children gracefully', () => {
    const json = { combinator: 'or' };
    const filter = fromJSON(json);
    expect(filter).toHaveProperty('id');
    if ('children' in filter) {
      const children = filter.children as unknown[];
      expect(children).toEqual([]);
    }
  });

  it('fromJSON accepts legacy conditions wire key', () => {
    const json = {
      combinator: 'and',
      conditions: [{ field: 'name', operator: 'equals', value: 'John' }],
    };
    const filter = fromJSON(json);
    expect('children' in filter).toBe(true);
    if ('children' in filter) {
      const children = filter.children as unknown[];
      expect(children).toHaveLength(1);
      expect(children[0]).toMatchObject({ field: 'name', operator: 'equals', value: 'John' });
    }
  });
});

describe('round-trip', () => {
  it('fromJSON(toJSON(filter)) produces structurally equivalent filter', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [
        { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
        {
          id: 'g1',
          combinator: 'or',
          children: [
            { id: 'r2', field: 'age', operator: 'gt', value: 18 },
            { id: 'r3', field: 'status', operator: 'equals', value: 'active' },
          ],
        },
      ],
    };
    const roundTripped = fromJSON(toJSON(filter));
    const extractStructure = (f: unknown): unknown => {
      if (isFilterGroup(f) || isFilterGroupIC(f)) {
        return {
          combinator: 'combinator' in f ? f.combinator : undefined,
          children: f.children.map((c) => {
            if (c && typeof c === 'object' && 'field' in c) {
              return { field: c.field, operator: c.operator, value: c.value };
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
      children: [{ id: 'r1', field: 'name', operator: 'equals', value: 'John' }],
    };
    const a = toJSON(filter);
    const b = toJSON(filter);
    expect(a).toEqual(b);
  });
});
