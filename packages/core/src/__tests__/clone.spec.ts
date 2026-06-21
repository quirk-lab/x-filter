import { cloneGroup, cloneRule } from '../mutations';
import { walk } from '../traverse';
import type { Filter, FilterGroup, FilterRule } from '../types';

let counter = 0;
const idGenerator = () => `gen-${counter++}`;
beforeEach(() => {
  counter = 0;
});

function collectIds(filter: Filter): string[] {
  const ids: string[] = [];
  walk(filter, (node) => ids.push(node.id));
  return ids;
}

describe('cloneRule', () => {
  const filter: Filter = {
    id: 'root',
    combinator: 'and',
    children: [
      { id: 'r1', field: 'status', operator: 'equals', value: 'active' },
      { id: 'r2', field: 'tags', operator: 'in', value: ['a', 'b'] },
    ],
  };

  it('inserts a clone directly after the source rule with a new id', () => {
    const result = cloneRule(filter, 'r1', { idGenerator });

    expect(result.children.map((c) => (c as FilterRule).id)).toEqual(['r1', 'gen-0', 'r2']);
    const clone = result.children[1] as FilterRule;
    expect(clone).toMatchObject({ field: 'status', operator: 'equals', value: 'active' });
    expect(clone.id).not.toBe('r1');
  });

  it('does not mutate the original filter', () => {
    const before = JSON.stringify(filter);
    cloneRule(filter, 'r1', { idGenerator });
    expect(JSON.stringify(filter)).toBe(before);
    expect(filter.children).toHaveLength(2);
  });

  it('deep-copies array/object values (no shared reference)', () => {
    const result = cloneRule(filter, 'r2', { idGenerator });
    const clone = result.children[2] as FilterRule;
    expect(clone.value).toEqual(['a', 'b']);
    expect(clone.value).not.toBe((filter.children[1] as FilterRule).value);
  });

  it('preserves the not flag', () => {
    const negated: Filter = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'status', operator: 'equals', value: 'x', not: true }],
    };
    const result = cloneRule(negated, 'r1', { idGenerator });
    expect((result.children[1] as FilterRule).not).toBe(true);
  });

  it('clones a rule nested inside a subgroup, inserting in that subgroup', () => {
    const nested: Filter = {
      id: 'root',
      combinator: 'and',
      children: [
        {
          id: 'g1',
          combinator: 'or',
          children: [{ id: 'r1', field: 'a', operator: 'eq', value: 1 }],
        },
      ],
    };
    const result = cloneRule(nested, 'r1', { idGenerator });
    const group = result.children[0] as FilterGroup;
    expect(group.children.map((c) => (c as FilterRule).id)).toEqual(['r1', 'gen-0']);
  });

  it('throws when the rule does not exist', () => {
    expect(() => cloneRule(filter, 'missing')).toThrow('Rule not found: missing');
  });

  it('throws when the id points to a group', () => {
    const withGroup: Filter = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'g1', combinator: 'and', children: [] }],
    };
    expect(() => cloneRule(withGroup, 'g1')).toThrow('Rule not found: g1');
  });
});

describe('cloneGroup', () => {
  const filter: Filter = {
    id: 'root',
    combinator: 'and',
    children: [
      {
        id: 'g1',
        combinator: 'or',
        children: [
          { id: 'r1', field: 'a', operator: 'eq', value: 1 },
          {
            id: 'g2',
            combinator: 'and',
            children: [{ id: 'r2', field: 'b', operator: 'eq', value: 2 }],
          },
        ],
      },
    ],
  };

  it('inserts a deep clone after the source group', () => {
    const result = cloneGroup(filter, 'g1', { idGenerator });
    expect(result.children).toHaveLength(2);
    const clone = result.children[1] as FilterGroup;
    expect(clone.combinator).toBe('or');
    expect(clone.children).toHaveLength(2);
  });

  it('regenerates ids for every descendant, all unique and disjoint from the source', () => {
    const result = cloneGroup(filter, 'g1', { idGenerator });
    const clone = result.children[1] as FilterGroup;

    const cloneIds = collectIds(clone as Filter);
    expect(new Set(cloneIds).size).toBe(cloneIds.length);

    const originalIds = new Set(['g1', 'r1', 'g2', 'r2']);
    for (const id of cloneIds) {
      expect(originalIds.has(id)).toBe(false);
    }
  });

  it('does not mutate the original filter', () => {
    const before = JSON.stringify(filter);
    cloneGroup(filter, 'g1', { idGenerator });
    expect(JSON.stringify(filter)).toBe(before);
  });

  it('throws when cloning the root group', () => {
    expect(() => cloneGroup(filter, 'root')).toThrow('Cannot clone root group');
  });

  it('throws when the group does not exist', () => {
    expect(() => cloneGroup(filter, 'missing')).toThrow('Group not found: missing');
  });
});
