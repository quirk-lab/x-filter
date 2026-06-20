import {
  findGroupInTreeAny,
  findRuleInTreeAny,
  removeConditionFromTreeAny,
  removeDuplicateConditionAny,
  updateGroupInTreeAny,
  updateRuleInTreeAny,
} from '../tree-mutations';
import type { Filter, FilterIC } from '../types';

// Helper: extract item ids from a conditions array (skips combinator strings)
function itemIds(conditions: unknown[]): string[] {
  return conditions.filter((c) => typeof c !== 'string').map((c) => (c as { id: string }).id);
}

describe('updateGroupInTreeAny', () => {
  it('updates a standard group by id', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [{ id: 'g1', combinator: 'or', conditions: [] }],
    };
    const result = updateGroupInTreeAny(filter, 'g1', (g) => ({ ...g, not: true }));
    expect(result.conditions[0]).toMatchObject({ id: 'g1', not: true });
  });

  it('updates an IC group by id', () => {
    const filter: FilterIC = {
      id: 'root',
      conditions: [{ id: 'g1', conditions: [] }],
    };
    const result = updateGroupInTreeAny(filter, 'g1', (g) => ({ ...g, not: true }));
    expect(result.conditions[0]).toMatchObject({ id: 'g1', not: true });
  });

  it('updates root group itself', () => {
    const filter: Filter = { id: 'root', combinator: 'and', conditions: [] };
    const result = updateGroupInTreeAny(filter, 'root', (g) => ({ ...g, not: true }));
    expect(result).toMatchObject({ id: 'root', not: true });
  });

  it('returns unchanged when target not found', () => {
    const filter: Filter = { id: 'root', combinator: 'and', conditions: [] };
    const result = updateGroupInTreeAny(filter, 'nope', (g) => ({ ...g, not: true }));
    expect(result).toBe(filter);
  });

  it('skips combinator strings in IC conditions', () => {
    const filter: FilterIC = {
      id: 'root',
      conditions: [
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
        'and',
        { id: 'g1', conditions: [] },
      ],
    };
    const result = updateGroupInTreeAny(filter, 'g1', (g) => ({ ...g, not: true }));
    expect(result.conditions[1]).toBe('and');
    expect(result.conditions[2]).toMatchObject({ id: 'g1', not: true });
  });
});

describe('updateRuleInTreeAny', () => {
  it('updates a rule in standard mode', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [{ id: 'r1', field: 'a', operator: 'eq', value: 1 }],
    };
    const result = updateRuleInTreeAny(filter, 'r1', (r) => ({ ...r, value: 99 }));
    expect(result.conditions[0]).toMatchObject({ id: 'r1', value: 99 });
  });

  it('updates a rule in IC mode (skips combinator strings)', () => {
    const filter: FilterIC = {
      id: 'root',
      conditions: [
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
        'and',
        { id: 'r2', field: 'b', operator: 'eq', value: 2 },
      ],
    };
    const result = updateRuleInTreeAny(filter, 'r2', (r) => ({ ...r, value: 99 }));
    expect(result.conditions[1]).toBe('and');
    expect(result.conditions[2]).toMatchObject({ id: 'r2', value: 99 });
  });

  it('updates rule inside nested IC group', () => {
    const filter: FilterIC = {
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
    const result = updateRuleInTreeAny(filter, 'r2', (r) => ({ ...r, value: 99 }));
    const g1 = result.conditions[0] as FilterIC;
    expect(g1.conditions[1]).toBe('or');
    expect(g1.conditions[2]).toMatchObject({ id: 'r2', value: 99 });
  });

  it('returns unchanged when ruleId not found', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [{ id: 'r1', field: 'a', operator: 'eq', value: 1 }],
    };
    const result = updateRuleInTreeAny(filter, 'nope', (r) => r);
    expect(result).toBe(filter);
  });
});

describe('removeConditionFromTreeAny', () => {
  it('removes a rule from standard mode', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
        { id: 'r2', field: 'b', operator: 'eq', value: 2 },
      ],
    };
    const result = removeConditionFromTreeAny(filter, 'r1');
    expect(itemIds(result.conditions)).toEqual(['r2']);
  });

  it('removes a rule from IC mode (without touching combinator logic — caller handles that)', () => {
    // NOTE: removeConditionFromTreeAny only removes the item node.
    // IC combinator removal is handled by the IC-specific removeRuleIC wrapper.
    const filter: FilterIC = {
      id: 'root',
      conditions: [
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
        'and',
        { id: 'r2', field: 'b', operator: 'eq', value: 2 },
      ],
    };
    const result = removeConditionFromTreeAny(filter, 'r1');
    // The primitive just removes the item; combinator cleanup is IC-specific
    expect(result.conditions).toHaveLength(2);
    expect(result.conditions[0]).toBe('and');
    expect(result.conditions[1]).toMatchObject({ id: 'r2' });
  });

  it('removes a group from standard mode', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [
        { id: 'g1', combinator: 'or', conditions: [] },
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
      ],
    };
    const result = removeConditionFromTreeAny(filter, 'g1');
    expect(itemIds(result.conditions)).toEqual(['r1']);
  });

  it('returns unchanged when id not found', () => {
    const filter: Filter = { id: 'root', combinator: 'and', conditions: [] };
    const result = removeConditionFromTreeAny(filter, 'nope');
    expect(result).toBe(filter);
  });
});

describe('findRuleInTreeAny', () => {
  it('finds a rule in standard mode', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [{ id: 'r1', field: 'a', operator: 'eq', value: 1 }],
    };
    const found = findRuleInTreeAny(filter, 'r1');
    expect(found).toMatchObject({ id: 'r1' });
  });

  it('finds a rule in IC mode (skips combinators)', () => {
    const filter: FilterIC = {
      id: 'root',
      conditions: [
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
        'and',
        { id: 'r2', field: 'b', operator: 'eq', value: 2 },
      ],
    };
    const found = findRuleInTreeAny(filter, 'r2');
    expect(found).toMatchObject({ id: 'r2' });
  });

  it('returns undefined when not found', () => {
    const filter: Filter = { id: 'root', combinator: 'and', conditions: [] };
    const found = findRuleInTreeAny(filter, 'nope');
    expect(found).toBeUndefined();
  });
});

describe('findGroupInTreeAny', () => {
  it('finds a group in standard mode', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [{ id: 'g1', combinator: 'or', conditions: [] }],
    };
    const found = findGroupInTreeAny(filter, 'g1');
    expect(found).toMatchObject({ id: 'g1' });
  });

  it('finds root group', () => {
    const filter: Filter = { id: 'root', combinator: 'and', conditions: [] };
    const found = findGroupInTreeAny(filter, 'root');
    expect(found).toBe(filter);
  });

  it('finds a group in IC mode', () => {
    const filter: FilterIC = {
      id: 'root',
      conditions: [
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
        'and',
        { id: 'g1', conditions: [] },
      ],
    };
    const found = findGroupInTreeAny(filter, 'g1');
    expect(found).toMatchObject({ id: 'g1' });
  });
});

describe('removeDuplicateConditionAny', () => {
  it('removes duplicate rule keeping the one in keepInGroupId (standard)', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [
        {
          id: 'g1',
          combinator: 'or',
          conditions: [{ id: 'r1', field: 'a', operator: 'eq', value: 1 }],
        },
        {
          id: 'g2',
          combinator: 'and',
          conditions: [{ id: 'r1', field: 'a', operator: 'eq', value: 1 }],
        },
      ],
    };
    const result = removeDuplicateConditionAny(filter, 'r1', 'g2');
    const g1 = result.conditions[0] as Filter;
    const g2 = result.conditions[1] as Filter;
    expect(g1.conditions).toHaveLength(0);
    expect(g2.conditions).toHaveLength(1);
  });

  it('removes duplicate rule in IC mode keeping the one in keepInGroupId', () => {
    const filter: FilterIC = {
      id: 'root',
      conditions: [
        {
          id: 'g1',
          conditions: [{ id: 'r1', field: 'a', operator: 'eq', value: 1 }],
        },
        'and',
        {
          id: 'g2',
          conditions: [{ id: 'r1', field: 'a', operator: 'eq', value: 1 }],
        },
      ],
    };
    const result = removeDuplicateConditionAny(filter, 'r1', 'g2');
    const g1 = result.conditions[0] as FilterIC;
    const g2 = result.conditions[2] as FilterIC;
    expect(g1.conditions).toHaveLength(0);
    expect(g2.conditions).toHaveLength(1);
    expect(result.conditions[1]).toBe('and');
  });
});
