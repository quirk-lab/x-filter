import { cloneGroupIC, cloneRuleIC } from '../ic';
import type { Combinator, FilterGroupIC, FilterIC, FilterRule } from '../types';

let counter = 0;
const idGenerator = () => `gen-${counter++}`;
beforeEach(() => {
  counter = 0;
});

describe('cloneRuleIC', () => {
  it('inserts [combinator, clone] after the source, reusing the adjacent combinator', () => {
    const filter: FilterIC = {
      id: 'root',
      children: [
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
        'or',
        { id: 'r2', field: 'b', operator: 'eq', value: 2 },
      ],
    };

    const result = cloneRuleIC(filter, 'r1', 'and', { idGenerator });

    expect(result.children).toHaveLength(5);
    expect(result.children[0]).toMatchObject({ id: 'r1' });
    expect(result.children[1]).toBe('or'); // reused the existing combinator
    expect(result.children[2]).toMatchObject({ id: 'gen-0', field: 'a', value: 1 });
    expect(result.children[3]).toBe('or');
    expect(result.children[4]).toMatchObject({ id: 'r2' });
  });

  it('uses the default combinator for a single-rule group', () => {
    const filter: FilterIC = {
      id: 'root',
      children: [{ id: 'r1', field: 'a', operator: 'eq', value: 1 }],
    };

    const result = cloneRuleIC(filter, 'r1', 'and', { idGenerator });

    expect(result.children).toHaveLength(3);
    expect(result.children[1]).toBe('and');
    expect((result.children[2] as FilterRule).id).toBe('gen-0');
  });

  it('does not mutate the original and throws when missing', () => {
    const filter: FilterIC = {
      id: 'root',
      children: [{ id: 'r1', field: 'a', operator: 'eq', value: 1 }],
    };
    const before = JSON.stringify(filter);
    cloneRuleIC(filter, 'r1', 'and', { idGenerator });
    expect(JSON.stringify(filter)).toBe(before);

    expect(() => cloneRuleIC(filter, 'missing')).toThrow('Rule not found: missing');
  });
});

describe('cloneGroupIC', () => {
  it('deep-clones a nested IC group with fresh ids and a separating combinator', () => {
    const filter: FilterIC = {
      id: 'root',
      children: [
        {
          id: 'g1',
          children: [
            { id: 'r1', field: 'a', operator: 'eq', value: 1 },
            'or',
            { id: 'r2', field: 'b', operator: 'eq', value: 2 },
          ],
        } as FilterGroupIC,
      ],
    };

    const result = cloneGroupIC(filter, 'g1', 'and', { idGenerator });

    expect(result.children).toHaveLength(3);
    expect(result.children[1]).toBe('and');
    const clone = result.children[2] as FilterGroupIC;
    expect(clone.id).not.toBe('g1');
    // inner combinator preserved, inner rules get fresh ids
    expect(clone.children[1]).toBe('or');
    expect((clone.children[0] as FilterRule).id).not.toBe('r1');
    expect((clone.children[2] as FilterRule).id).not.toBe('r2');
  });

  it('throws when cloning the root or a missing group', () => {
    const filter: FilterIC = { id: 'root', children: [] };
    expect(() => cloneGroupIC(filter, 'root')).toThrow('Cannot clone root group');
    expect(() => cloneGroupIC(filter, 'missing')).toThrow('Group not found: missing');
  });
});

// Type-only guard: combinator default param is a Combinator
const _combinatorType: Combinator = 'and';
void _combinatorType;
