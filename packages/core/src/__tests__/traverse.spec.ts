import { findById, findParent, flattenRules, getPath, traverse } from '../traverse';
import type { Filter } from '../types';

const filter: Filter = {
  id: 'root',
  combinator: 'and',
  conditions: [
    { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
    {
      id: 'g1',
      combinator: 'or',
      conditions: [
        { id: 'r2', field: 'age', operator: 'gt', value: 18 },
        {
          id: 'g2',
          combinator: 'and',
          conditions: [{ id: 'r3', field: 'status', operator: 'equals', value: 'active' }],
        },
      ],
    },
  ],
};

describe('findById', () => {
  it('finds rule at root level (r1)', () => {
    const found = findById(filter, 'r1');
    expect(found).toBeDefined();
    expect(found?.id).toBe('r1');
    expect((found as { field: string }).field).toBe('name');
  });

  it('finds rule in nested group (r2)', () => {
    const found = findById(filter, 'r2');
    expect(found).toBeDefined();
    expect(found?.id).toBe('r2');
    expect((found as { field: string }).field).toBe('age');
  });

  it('finds deeply nested rule (r3)', () => {
    const found = findById(filter, 'r3');
    expect(found).toBeDefined();
    expect(found?.id).toBe('r3');
    expect((found as { field: string }).field).toBe('status');
  });

  it('finds group by id (g1)', () => {
    const found = findById(filter, 'g1');
    expect(found).toBeDefined();
    expect(found?.id).toBe('g1');
    expect((found as { combinator: string }).combinator).toBe('or');
  });

  it('finds root group', () => {
    const found = findById(filter, 'root');
    expect(found).toBeDefined();
    expect(found?.id).toBe('root');
    expect((found as { combinator: string }).combinator).toBe('and');
  });

  it('returns undefined for non-existent id', () => {
    const found = findById(filter, 'nonexistent');
    expect(found).toBeUndefined();
  });
});

describe('findParent', () => {
  it('parent of root-level rule (r1) is root', () => {
    const parent = findParent(filter, 'r1');
    expect(parent).toBeDefined();
    expect(parent?.id).toBe('root');
  });

  it('parent of nested rule (r2) is g1', () => {
    const parent = findParent(filter, 'r2');
    expect(parent).toBeDefined();
    expect(parent?.id).toBe('g1');
  });

  it('parent of nested group (g2) is g1', () => {
    const parent = findParent(filter, 'g2');
    expect(parent).toBeDefined();
    expect(parent?.id).toBe('g1');
  });

  it('parent of root returns undefined', () => {
    const parent = findParent(filter, 'root');
    expect(parent).toBeUndefined();
  });

  it('returns undefined for non-existent id', () => {
    const parent = findParent(filter, 'nonexistent');
    expect(parent).toBeUndefined();
  });
});

describe('getPath', () => {
  it("path to root is ['root']", () => {
    const path = getPath(filter, 'root');
    expect(path).toEqual(['root']);
  });

  it("path to r1 is ['root', 'r1']", () => {
    const path = getPath(filter, 'r1');
    expect(path).toEqual(['root', 'r1']);
  });

  it("path to r3 (deep) is ['root', 'g1', 'g2', 'r3']", () => {
    const path = getPath(filter, 'r3');
    expect(path).toEqual(['root', 'g1', 'g2', 'r3']);
  });

  it('path to non-existent returns []', () => {
    const path = getPath(filter, 'nonexistent');
    expect(path).toEqual([]);
  });
});

describe('traverse', () => {
  it('visits all nodes depth-first', () => {
    const visited: string[] = [];
    traverse(filter, (node) => {
      visited.push(node.id);
    });
    expect(visited).toEqual(['root', 'r1', 'g1', 'r2', 'g2', 'r3']);
  });

  it('callback receives correct depth values', () => {
    const depths: { id: string; depth: number }[] = [];
    traverse(filter, (node, depth) => {
      depths.push({ id: node.id, depth });
    });
    expect(depths).toEqual([
      { id: 'root', depth: 0 },
      { id: 'r1', depth: 1 },
      { id: 'g1', depth: 1 },
      { id: 'r2', depth: 2 },
      { id: 'g2', depth: 2 },
      { id: 'r3', depth: 3 },
    ]);
  });

  it('visits rules and groups', () => {
    const rules: string[] = [];
    const groups: string[] = [];
    traverse(filter, (node) => {
      if ('field' in node && 'operator' in node) {
        rules.push(node.id);
      } else if ('conditions' in node) {
        groups.push(node.id);
      }
    });
    expect(rules).toEqual(['r1', 'r2', 'r3']);
    expect(groups).toEqual(['root', 'g1', 'g2']);
  });
});

describe('flattenRules', () => {
  it('returns all rules [r1, r2, r3]', () => {
    const rules = flattenRules(filter);
    expect(rules).toHaveLength(3);
    expect(rules.map((r) => r.id)).toEqual(['r1', 'r2', 'r3']);
    expect(rules[0].field).toBe('name');
    expect(rules[1].field).toBe('age');
    expect(rules[2].field).toBe('status');
  });

  it('empty filter returns []', () => {
    const emptyFilter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [],
    };
    const rules = flattenRules(emptyFilter);
    expect(rules).toEqual([]);
  });

  it('works with nested groups', () => {
    const rules = flattenRules(filter);
    expect(rules).toHaveLength(3);
    expect(rules[0].id).toBe('r1');
    expect(rules[1].id).toBe('r2');
    expect(rules[2].id).toBe('r3');
  });
});
