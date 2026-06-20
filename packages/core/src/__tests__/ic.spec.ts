import {
  addGroupIC,
  addRuleIC,
  convertFromIC,
  convertToIC,
  isFilterGroupIC,
  moveRuleIC,
  removeGroupIC,
  removeRuleIC,
  updateGroupIC,
  updateRuleIC,
} from '../ic';
import type { Filter, FilterIC, FilterRule } from '../types';

describe('isFilterGroupIC', () => {
  it('returns true for IC group (object with id, conditions, no combinator)', () => {
    const icGroup: FilterIC = {
      id: 'root',
      children: [],
    };
    expect(isFilterGroupIC(icGroup)).toBe(true);
  });

  it('returns false for standard group (has combinator)', () => {
    const standardGroup: Filter = {
      id: 'root',
      combinator: 'and',
      children: [],
    };
    expect(isFilterGroupIC(standardGroup)).toBe(false);
  });

  it('returns false for FilterRule', () => {
    const rule: FilterRule = {
      id: 'r1',
      field: 'name',
      operator: 'equals',
      value: 'John',
    };
    expect(isFilterGroupIC(rule)).toBe(false);
  });

  it('returns false for null/undefined/string', () => {
    expect(isFilterGroupIC(null)).toBe(false);
    expect(isFilterGroupIC(undefined)).toBe(false);
    expect(isFilterGroupIC('and')).toBe(false);
  });
});

describe('convertToIC', () => {
  it('empty filter converts to IC with empty conditions', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      children: [],
    };
    const ic = convertToIC(filter);
    expect(ic.id).toBe('root');
    expect(ic.children).toEqual([]);
    expect('combinator' in ic).toBe(false);
  });

  it('single rule: no combinator inserted', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'name', operator: 'equals', value: 'John' }],
    };
    const ic = convertToIC(filter);
    expect(ic.children).toEqual([{ id: 'r1', field: 'name', operator: 'equals', value: 'John' }]);
  });

  it('multiple rules: combinator interleaved', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      children: [
        { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
        { id: 'r2', field: 'age', operator: 'gt', value: 18 },
      ],
    };
    const ic = convertToIC(filter);
    expect(ic.children).toEqual([
      { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
      'and',
      { id: 'r2', field: 'age', operator: 'gt', value: 18 },
    ]);
  });

  it('preserves not flag', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      not: true,
      children: [],
    };
    const ic = convertToIC(filter);
    expect(ic.not).toBe(true);
  });

  it('nested groups converted recursively', () => {
    const filter: Filter = {
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
    const ic = convertToIC(filter);
    expect(ic.children).toEqual([
      { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
      'and',
      {
        id: 'g1',
        children: [{ id: 'r2', field: 'age', operator: 'gt', value: 18 }],
      },
    ]);
  });
});

describe('convertFromIC', () => {
  it("empty IC converts to standard with combinator 'and'", () => {
    const ic: FilterIC = {
      id: 'root',
      children: [],
    };
    const filter = convertFromIC(ic);
    expect(filter.id).toBe('root');
    expect(filter.combinator).toBe('and');
    expect(filter.children).toEqual([]);
  });

  it("single rule: combinator defaults to 'and'", () => {
    const ic: FilterIC = {
      id: 'root',
      children: [{ id: 'r1', field: 'name', operator: 'equals', value: 'John' }],
    };
    const filter = convertFromIC(ic);
    expect(filter.combinator).toBe('and');
    expect(filter.children).toEqual([
      { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
    ]);
  });

  it('all same combinators: simple conversion', () => {
    const ic: FilterIC = {
      id: 'root',
      children: [
        { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
        'and',
        { id: 'r2', field: 'age', operator: 'gt', value: 18 },
      ],
    };
    const filter = convertFromIC(ic);
    expect(filter.combinator).toBe('and');
    expect(filter.children).toHaveLength(2);
    expect((filter.children[0] as FilterRule).id).toBe('r1');
    expect((filter.children[1] as FilterRule).id).toBe('r2');
  });

  it('mixed combinators: groups by AND precedence', () => {
    const ic: FilterIC = {
      id: 'root',
      children: [
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
        'and',
        { id: 'r2', field: 'b', operator: 'eq', value: 2 },
        'or',
        { id: 'r3', field: 'c', operator: 'eq', value: 3 },
      ],
    };
    const filter = convertFromIC(ic);
    expect(filter.combinator).toBe('or');
    expect(filter.children).toHaveLength(2);
    const firstSeg = filter.children[0] as Filter;
    const secondRule = filter.children[1] as FilterRule;
    expect(firstSeg.combinator).toBe('and');
    expect(firstSeg.children).toHaveLength(2);
    expect((firstSeg.children[0] as FilterRule).id).toBe('r1');
    expect((firstSeg.children[1] as FilterRule).id).toBe('r2');
    expect(secondRule.id).toBe('r3');
  });

  it('preserves not flag', () => {
    const ic: FilterIC = {
      id: 'root',
      not: true,
      children: [],
    };
    const filter = convertFromIC(ic);
    expect(filter.not).toBe(true);
  });
});

describe('addRuleIC', () => {
  const icFilter: FilterIC = {
    id: 'root',
    children: [
      { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
      'and',
      { id: 'r2', field: 'age', operator: 'gt', value: 18 },
    ],
  };

  it('adds first rule without combinator', () => {
    const empty: FilterIC = { id: 'root', children: [] };
    const result = addRuleIC(empty, 'root', {
      id: 'r1',
      field: 'name',
      operator: 'equals',
      value: 'John',
    });
    expect(result.children).toEqual([
      { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
    ]);
  });

  it("adds second rule with default combinator ('and')", () => {
    const single: FilterIC = {
      id: 'root',
      children: [{ id: 'r1', field: 'name', operator: 'equals', value: 'John' }],
    };
    const result = addRuleIC(single, 'root', {
      id: 'r2',
      field: 'age',
      operator: 'gt',
      value: 18,
    });
    expect(result.children).toEqual([
      { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
      'and',
      { id: 'r2', field: 'age', operator: 'gt', value: 18 },
    ]);
  });

  it("adds rule with custom combinator ('or')", () => {
    const single: FilterIC = {
      id: 'root',
      children: [{ id: 'r1', field: 'name', operator: 'equals', value: 'John' }],
    };
    const result = addRuleIC(
      single,
      'root',
      { id: 'r2', field: 'age', operator: 'gt', value: 18 },
      'or'
    );
    expect(result.children).toEqual([
      { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
      'or',
      { id: 'r2', field: 'age', operator: 'gt', value: 18 },
    ]);
  });

  it('throws when groupId not found', () => {
    expect(() =>
      addRuleIC(icFilter, 'nonexistent', {
        id: 'r3',
        field: 'status',
        operator: 'equals',
        value: 'active',
      })
    ).toThrow('Group not found: nonexistent');
  });
});

describe('removeRuleIC', () => {
  it('removes first rule (and following combinator)', () => {
    const ic: FilterIC = {
      id: 'root',
      children: [
        { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
        'and',
        { id: 'r2', field: 'age', operator: 'gt', value: 18 },
      ],
    };
    const result = removeRuleIC(ic, 'r1');
    expect(result.children).toEqual([{ id: 'r2', field: 'age', operator: 'gt', value: 18 }]);
  });

  it('removes last rule (and preceding combinator)', () => {
    const ic: FilterIC = {
      id: 'root',
      children: [
        { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
        'and',
        { id: 'r2', field: 'age', operator: 'gt', value: 18 },
      ],
    };
    const result = removeRuleIC(ic, 'r2');
    expect(result.children).toEqual([
      { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
    ]);
  });

  it('removes only rule (no combinator to remove)', () => {
    const ic: FilterIC = {
      id: 'root',
      children: [{ id: 'r1', field: 'name', operator: 'equals', value: 'John' }],
    };
    const result = removeRuleIC(ic, 'r1');
    expect(result.children).toEqual([]);
  });

  it('returns unchanged when ruleId not found', () => {
    const ic: FilterIC = {
      id: 'root',
      children: [{ id: 'r1', field: 'name', operator: 'equals', value: 'John' }],
    };
    const result = removeRuleIC(ic, 'nonexistent');
    expect(result).toBe(ic);
    expect(result.children).toEqual(ic.children);
  });

  it('removes rule from nested IC group', () => {
    const ic: FilterIC = {
      id: 'root',
      children: [
        {
          id: 'g1',
          children: [
            { id: 'r1', field: 'a', operator: 'eq', value: 1 },
            'and',
            { id: 'r2', field: 'b', operator: 'eq', value: 2 },
          ],
        },
      ],
    };
    const result = removeRuleIC(ic, 'r1');
    const g1 = result.children[0] as FilterIC;
    expect(g1.children).toEqual([{ id: 'r2', field: 'b', operator: 'eq', value: 2 }]);
  });
});

describe('addRuleIC (nested groups)', () => {
  it('adds rule to nested IC group', () => {
    const ic: FilterIC = {
      id: 'root',
      children: [
        {
          id: 'g1',
          children: [{ id: 'r1', field: 'a', operator: 'eq', value: 1 }],
        },
      ],
    };
    const result = addRuleIC(ic, 'g1', {
      id: 'r2',
      field: 'b',
      operator: 'eq',
      value: 2,
    });
    const g1 = result.children[0] as FilterIC;
    expect(g1.children).toHaveLength(3);
    expect(g1.children[1]).toBe('and');
    expect(g1.children[2]).toMatchObject({ id: 'r2' });
  });

  it('adds rule with not flag', () => {
    const ic: FilterIC = { id: 'root', children: [] };
    const result = addRuleIC(ic, 'root', {
      id: 'r1',
      field: 'a',
      operator: 'eq',
      value: 1,
      not: true,
    });
    expect(result.children[0]).toMatchObject({ id: 'r1', not: true });
  });

  it('adds rule with custom idGenerator', () => {
    const ic: FilterIC = { id: 'root', children: [] };
    const result = addRuleIC(ic, 'root', { field: 'a', operator: 'eq', value: 1 }, 'and', {
      idGenerator: () => 'custom-id',
    });
    expect(result.children[0]).toMatchObject({ id: 'custom-id' });
  });
});

describe('convertFromIC (nested IC groups)', () => {
  it('converts nested IC groups recursively', () => {
    const ic: FilterIC = {
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
    const filter = convertFromIC(ic);
    expect(filter.combinator).toBe('and');
    expect(filter.children).toHaveLength(1);
    const g1 = filter.children[0] as Filter;
    expect(g1.combinator).toBe('or');
    expect(g1.children).toHaveLength(2);
  });
});

// Helper: extract item ids from IC conditions (skips combinator strings)
function icItemIds(children: unknown[]): string[] {
  return children.filter((c) => typeof c !== 'string').map((c) => (c as { id: string }).id);
}

describe('updateRuleIC', () => {
  it('updates a rule field in IC mode', () => {
    const ic: FilterIC = {
      id: 'root',
      children: [
        { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
        'and',
        { id: 'r2', field: 'age', operator: 'gt', value: 18 },
      ],
    };
    const result = updateRuleIC(ic, 'r2', { value: 21 });
    expect(result.children[1]).toBe('and');
    expect(result.children[2]).toMatchObject({ id: 'r2', value: 21 });
  });

  it('updates a rule inside nested IC group', () => {
    const ic: FilterIC = {
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
    const result = updateRuleIC(ic, 'r1', { value: 99 });
    const g1 = result.children[0] as FilterIC;
    expect(g1.children[0]).toMatchObject({ id: 'r1', value: 99 });
    expect(g1.children[1]).toBe('or');
  });

  it('preserves not flag when updating', () => {
    const ic: FilterIC = {
      id: 'root',
      children: [{ id: 'r1', field: 'a', operator: 'eq', value: 1, not: true }],
    };
    const result = updateRuleIC(ic, 'r1', { value: 99 });
    expect(result.children[0]).toMatchObject({ id: 'r1', value: 99, not: true });
  });

  it('returns unchanged when ruleId not found', () => {
    const ic: FilterIC = {
      id: 'root',
      children: [{ id: 'r1', field: 'a', operator: 'eq', value: 1 }],
    };
    const result = updateRuleIC(ic, 'nope', { value: 99 });
    expect(result).toBe(ic);
  });
});

describe('updateGroupIC', () => {
  it('toggles not on an IC group', () => {
    const ic: FilterIC = {
      id: 'root',
      children: [
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
        'and',
        { id: 'g1', children: [] },
      ],
    };
    const result = updateGroupIC(ic, 'g1', { not: true });
    expect(result.children[2]).toMatchObject({ id: 'g1', not: true });
    expect(result.children[1]).toBe('and');
  });

  it('toggles not on root IC group', () => {
    const ic: FilterIC = { id: 'root', children: [] };
    const result = updateGroupIC(ic, 'root', { not: true });
    expect(result).toMatchObject({ id: 'root', not: true });
  });

  it('toggles not from true to false', () => {
    const ic: FilterIC = {
      id: 'root',
      children: [{ id: 'g1', children: [], not: true }],
    };
    const result = updateGroupIC(ic, 'g1', { not: false });
    expect(result.children[0]).toMatchObject({ id: 'g1', not: false });
  });

  it('returns unchanged when groupId not found', () => {
    const ic: FilterIC = { id: 'root', children: [] };
    const result = updateGroupIC(ic, 'nope', { not: true });
    expect(result).toBe(ic);
  });
});

describe('addGroupIC', () => {
  it('adds first group without combinator', () => {
    const ic: FilterIC = { id: 'root', children: [] };
    const result = addGroupIC(ic, 'root', { id: 'g1' });
    expect(result.children).toHaveLength(1);
    expect(result.children[0]).toMatchObject({ id: 'g1', children: [] });
    expect(result.children[0]).not.toHaveProperty('combinator');
  });

  it('adds second group with default combinator', () => {
    const ic: FilterIC = {
      id: 'root',
      children: [{ id: 'g1', children: [] }],
    };
    const result = addGroupIC(ic, 'root', { id: 'g2' });
    expect(result.children).toHaveLength(3);
    expect(result.children[0]).toMatchObject({ id: 'g1' });
    expect(result.children[1]).toBe('and');
    expect(result.children[2]).toMatchObject({ id: 'g2' });
  });

  it('adds second group with custom combinator', () => {
    const ic: FilterIC = {
      id: 'root',
      children: [{ id: 'g1', children: [] }],
    };
    const result = addGroupIC(ic, 'root', { id: 'g2' }, 'or');
    expect(result.children[1]).toBe('or');
  });

  it('adds group with not flag', () => {
    const ic: FilterIC = { id: 'root', children: [] };
    const result = addGroupIC(ic, 'root', { id: 'g1', not: true });
    expect(result.children[0]).toMatchObject({ id: 'g1', not: true });
  });

  it('adds group with initial conditions', () => {
    const ic: FilterIC = { id: 'root', children: [] };
    const result = addGroupIC(ic, 'root', {
      id: 'g1',
      children: [{ id: 'r1', field: 'a', operator: 'eq', value: 1 }],
    });
    const g1 = result.children[0] as FilterIC;
    expect(g1.children).toHaveLength(1);
  });

  it('throws when parentGroupId not found', () => {
    const ic: FilterIC = { id: 'root', children: [] };
    expect(() => addGroupIC(ic, 'nope', { id: 'g1' })).toThrow('Parent group not found: nope');
  });

  it('uses custom idGenerator', () => {
    const ic: FilterIC = { id: 'root', children: [] };
    const result = addGroupIC(ic, 'root', {}, 'and', { idGenerator: () => 'custom-gid' });
    expect(result.children[0]).toMatchObject({ id: 'custom-gid' });
  });
});

describe('removeGroupIC', () => {
  it('removes first group (and following combinator)', () => {
    const ic: FilterIC = {
      id: 'root',
      children: [{ id: 'g1', children: [] }, 'and', { id: 'g2', children: [] }],
    };
    const result = removeGroupIC(ic, 'g1');
    expect(result.children).toHaveLength(1);
    expect(result.children[0]).toMatchObject({ id: 'g2' });
  });

  it('removes last group (and preceding combinator)', () => {
    const ic: FilterIC = {
      id: 'root',
      children: [{ id: 'g1', children: [] }, 'and', { id: 'g2', children: [] }],
    };
    const result = removeGroupIC(ic, 'g2');
    expect(result.children).toHaveLength(1);
    expect(result.children[0]).toMatchObject({ id: 'g1' });
  });

  it('removes only group (no combinator to remove)', () => {
    const ic: FilterIC = {
      id: 'root',
      children: [{ id: 'g1', children: [] }],
    };
    const result = removeGroupIC(ic, 'g1');
    expect(result.children).toHaveLength(0);
  });

  it('throws when trying to remove root group', () => {
    const ic: FilterIC = { id: 'root', children: [] };
    expect(() => removeGroupIC(ic, 'root')).toThrow('Cannot remove root group');
  });

  it('removes nested group', () => {
    const ic: FilterIC = {
      id: 'root',
      children: [
        {
          id: 'g1',
          children: [
            { id: 'r1', field: 'a', operator: 'eq', value: 1 },
            'and',
            { id: 'g2', children: [] },
          ],
        },
      ],
    };
    const result = removeGroupIC(ic, 'g2');
    const g1 = result.children[0] as FilterIC;
    expect(g1.children).toHaveLength(1);
    expect(g1.children[0]).toMatchObject({ id: 'r1' });
  });
});

describe('moveRuleIC', () => {
  it('moves rule to position 0 within same group (combinator goes after)', () => {
    const ic: FilterIC = {
      id: 'root',
      children: [
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
        'and',
        { id: 'r2', field: 'b', operator: 'eq', value: 2 },
        'or',
        { id: 'r3', field: 'c', operator: 'eq', value: 3 },
      ],
    };
    // Move r3 to item position 0
    const result = moveRuleIC(ic, 'r3', 'root', 0);
    expect(icItemIds(result.children)).toEqual(['r3', 'r1', 'r2']);
    // combinator after r3 should be defaultCombinator ('and')
    expect(result.children[1]).toBe('and');
    // original combinator between r1 and r2 should be preserved
    expect(result.children[3]).toBe('and');
  });

  it('moves rule forward within same group (currentItemIdx < position)', () => {
    const ic: FilterIC = {
      id: 'root',
      children: [
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
        'and',
        { id: 'r2', field: 'b', operator: 'eq', value: 2 },
        'or',
        { id: 'r3', field: 'c', operator: 'eq', value: 3 },
      ],
    };
    // Move r1 (item 0) to item position 2
    const result = moveRuleIC(ic, 'r1', 'root', 2);
    expect(icItemIds(result.children)).toEqual(['r2', 'r3', 'r1']);
  });

  it('moves rule backward within same group (currentItemIdx > position)', () => {
    const ic: FilterIC = {
      id: 'root',
      children: [
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
        'and',
        { id: 'r2', field: 'b', operator: 'eq', value: 2 },
        'or',
        { id: 'r3', field: 'c', operator: 'eq', value: 3 },
      ],
    };
    // Move r3 (item 2) to item position 0
    const result = moveRuleIC(ic, 'r3', 'root', 0);
    expect(icItemIds(result.children)).toEqual(['r3', 'r1', 'r2']);
  });

  it('moves rule between different groups', () => {
    const ic: FilterIC = {
      id: 'root',
      children: [
        {
          id: 'g1',
          children: [
            { id: 'r1', field: 'a', operator: 'eq', value: 1 },
            'and',
            { id: 'r2', field: 'b', operator: 'eq', value: 2 },
          ],
        },
        'and',
        {
          id: 'g2',
          children: [{ id: 'r3', field: 'c', operator: 'eq', value: 3 }],
        },
      ],
    };
    // Move r1 from g1 to g2 at item position 1
    const result = moveRuleIC(ic, 'r1', 'g2', 1);
    const g1 = result.children[0] as FilterIC;
    const g2 = result.children[2] as FilterIC;
    expect(icItemIds(g1.children)).toEqual(['r2']);
    expect(icItemIds(g2.children)).toEqual(['r3', 'r1']);
  });

  it('moves rule to empty target group (no combinator needed)', () => {
    const ic: FilterIC = {
      id: 'root',
      children: [
        {
          id: 'g1',
          children: [{ id: 'r1', field: 'a', operator: 'eq', value: 1 }],
        },
        'and',
        {
          id: 'g2',
          children: [],
        },
      ],
    };
    const result = moveRuleIC(ic, 'r1', 'g2', 0);
    const g1 = result.children[0] as FilterIC;
    const g2 = result.children[2] as FilterIC;
    expect(icItemIds(g1.children)).toEqual([]);
    expect(icItemIds(g2.children)).toEqual(['r1']);
  });

  it('uses custom combinator when provided', () => {
    const ic: FilterIC = {
      id: 'root',
      children: [
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
        'and',
        { id: 'r2', field: 'b', operator: 'eq', value: 2 },
      ],
    };
    // Move r2 to item position 0 with custom combinator 'or'
    const result = moveRuleIC(ic, 'r2', 'root', 0, 'or');
    expect(result.children[0]).toMatchObject({ id: 'r2' });
    expect(result.children[1]).toBe('or');
    expect(result.children[2]).toMatchObject({ id: 'r1' });
  });

  it('throws when ruleId not found', () => {
    const ic: FilterIC = {
      id: 'root',
      children: [{ id: 'r1', field: 'a', operator: 'eq', value: 1 }],
    };
    expect(() => moveRuleIC(ic, 'nope', 'root', 0)).toThrow('Rule not found: nope');
  });

  it('throws when targetGroupId not found', () => {
    const ic: FilterIC = {
      id: 'root',
      children: [{ id: 'r1', field: 'a', operator: 'eq', value: 1 }],
    };
    expect(() => moveRuleIC(ic, 'r1', 'nope', 0)).toThrow('Target group not found: nope');
  });

  it('moves rule from descendant group to ancestor group without duplicates', () => {
    const ic: FilterIC = {
      id: 'root',
      children: [
        {
          id: 'g1',
          children: [
            {
              id: 'g2',
              children: [{ id: 'r1', field: 'a', operator: 'eq', value: 1 }],
            },
          ],
        },
      ],
    };
    // Move r1 from g2 (descendant) to g1 (ancestor) at item position 0
    const result = moveRuleIC(ic, 'r1', 'g1', 0);
    const g1 = result.children[0] as FilterIC;
    expect(icItemIds(g1.children)).toEqual(['r1', 'g2']);
    const g2 = g1.children[2] as FilterIC;
    expect(icItemIds(g2.children)).toEqual([]);
    // Verify no duplicate r1 anywhere in the tree
    const r1Count = JSON.stringify(result).split('"id":"r1"').length - 1;
    expect(r1Count).toBe(1);
  });

  it('moves rule from ancestor group to descendant group without duplicates', () => {
    const ic: FilterIC = {
      id: 'root',
      children: [
        {
          id: 'g1',
          children: [
            { id: 'r1', field: 'a', operator: 'eq', value: 1 },
            'and',
            {
              id: 'g2',
              children: [{ id: 'r2', field: 'b', operator: 'eq', value: 2 }],
            },
          ],
        },
      ],
    };
    // Move r1 from g1 (ancestor) to g2 (descendant) at item position 1
    const result = moveRuleIC(ic, 'r1', 'g2', 1);
    const g1 = result.children[0] as FilterIC;
    expect(icItemIds(g1.children)).toEqual(['g2']);
    const g2 = g1.children[0] as FilterIC;
    expect(icItemIds(g2.children)).toEqual(['r2', 'r1']);
    // Verify no duplicate r1 anywhere in the tree
    const r1Count = JSON.stringify(result).split('"id":"r1"').length - 1;
    expect(r1Count).toBe(1);
  });
});
