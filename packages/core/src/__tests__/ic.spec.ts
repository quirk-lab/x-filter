import {
  isFilterGroupIC,
  convertToIC,
  convertFromIC,
  addRuleIC,
  removeRuleIC,
} from '../ic';
import type { Filter, FilterIC, FilterRule } from '../types';

describe('isFilterGroupIC', () => {
  it('returns true for IC group (object with id, conditions, no combinator)', () => {
    const icGroup: FilterIC = {
      id: 'root',
      conditions: [],
    };
    expect(isFilterGroupIC(icGroup)).toBe(true);
  });

  it('returns false for standard group (has combinator)', () => {
    const standardGroup: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [],
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
      conditions: [],
    };
    const ic = convertToIC(filter);
    expect(ic.id).toBe('root');
    expect(ic.conditions).toEqual([]);
    expect('combinator' in ic).toBe(false);
  });

  it('single rule: no combinator inserted', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [{ id: 'r1', field: 'name', operator: 'equals', value: 'John' }],
    };
    const ic = convertToIC(filter);
    expect(ic.conditions).toEqual([
      { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
    ]);
  });

  it('multiple rules: combinator interleaved', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [
        { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
        { id: 'r2', field: 'age', operator: 'gt', value: 18 },
      ],
    };
    const ic = convertToIC(filter);
    expect(ic.conditions).toEqual([
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
      conditions: [],
    };
    const ic = convertToIC(filter);
    expect(ic.not).toBe(true);
  });

  it('nested groups converted recursively', () => {
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
          ],
        },
      ],
    };
    const ic = convertToIC(filter);
    expect(ic.conditions).toEqual([
      { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
      'and',
      {
        id: 'g1',
        conditions: [{ id: 'r2', field: 'age', operator: 'gt', value: 18 }],
      },
    ]);
  });
});

describe('convertFromIC', () => {
  it('empty IC converts to standard with combinator \'and\'', () => {
    const ic: FilterIC = {
      id: 'root',
      conditions: [],
    };
    const filter = convertFromIC(ic);
    expect(filter.id).toBe('root');
    expect(filter.combinator).toBe('and');
    expect(filter.conditions).toEqual([]);
  });

  it('single rule: combinator defaults to \'and\'', () => {
    const ic: FilterIC = {
      id: 'root',
      conditions: [{ id: 'r1', field: 'name', operator: 'equals', value: 'John' }],
    };
    const filter = convertFromIC(ic);
    expect(filter.combinator).toBe('and');
    expect(filter.conditions).toEqual([
      { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
    ]);
  });

  it('all same combinators: simple conversion', () => {
    const ic: FilterIC = {
      id: 'root',
      conditions: [
        { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
        'and',
        { id: 'r2', field: 'age', operator: 'gt', value: 18 },
      ],
    };
    const filter = convertFromIC(ic);
    expect(filter.combinator).toBe('and');
    expect(filter.conditions).toHaveLength(2);
    expect((filter.conditions[0] as FilterRule).id).toBe('r1');
    expect((filter.conditions[1] as FilterRule).id).toBe('r2');
  });

  it('mixed combinators: groups by AND precedence', () => {
    const ic: FilterIC = {
      id: 'root',
      conditions: [
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
        'and',
        { id: 'r2', field: 'b', operator: 'eq', value: 2 },
        'or',
        { id: 'r3', field: 'c', operator: 'eq', value: 3 },
      ],
    };
    const filter = convertFromIC(ic);
    expect(filter.combinator).toBe('or');
    expect(filter.conditions).toHaveLength(2);
    const firstSeg = filter.conditions[0] as Filter;
    const secondRule = filter.conditions[1] as FilterRule;
    expect(firstSeg.combinator).toBe('and');
    expect(firstSeg.conditions).toHaveLength(2);
    expect((firstSeg.conditions[0] as FilterRule).id).toBe('r1');
    expect((firstSeg.conditions[1] as FilterRule).id).toBe('r2');
    expect(secondRule.id).toBe('r3');
  });

  it('preserves not flag', () => {
    const ic: FilterIC = {
      id: 'root',
      not: true,
      conditions: [],
    };
    const filter = convertFromIC(ic);
    expect(filter.not).toBe(true);
  });
});

describe('addRuleIC', () => {
  const icFilter: FilterIC = {
    id: 'root',
    conditions: [
      { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
      'and',
      { id: 'r2', field: 'age', operator: 'gt', value: 18 },
    ],
  };

  it('adds first rule without combinator', () => {
    const empty: FilterIC = { id: 'root', conditions: [] };
    const result = addRuleIC(empty, 'root', {
      id: 'r1',
      field: 'name',
      operator: 'equals',
      value: 'John',
    });
    expect(result.conditions).toEqual([
      { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
    ]);
  });

  it('adds second rule with default combinator (\'and\')', () => {
    const single: FilterIC = {
      id: 'root',
      conditions: [{ id: 'r1', field: 'name', operator: 'equals', value: 'John' }],
    };
    const result = addRuleIC(single, 'root', {
      id: 'r2',
      field: 'age',
      operator: 'gt',
      value: 18,
    });
    expect(result.conditions).toEqual([
      { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
      'and',
      { id: 'r2', field: 'age', operator: 'gt', value: 18 },
    ]);
  });

  it('adds rule with custom combinator (\'or\')', () => {
    const single: FilterIC = {
      id: 'root',
      conditions: [{ id: 'r1', field: 'name', operator: 'equals', value: 'John' }],
    };
    const result = addRuleIC(
      single,
      'root',
      { id: 'r2', field: 'age', operator: 'gt', value: 18 },
      'or'
    );
    expect(result.conditions).toEqual([
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
      conditions: [
        { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
        'and',
        { id: 'r2', field: 'age', operator: 'gt', value: 18 },
      ],
    };
    const result = removeRuleIC(ic, 'r1');
    expect(result.conditions).toEqual([
      { id: 'r2', field: 'age', operator: 'gt', value: 18 },
    ]);
  });

  it('removes last rule (and preceding combinator)', () => {
    const ic: FilterIC = {
      id: 'root',
      conditions: [
        { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
        'and',
        { id: 'r2', field: 'age', operator: 'gt', value: 18 },
      ],
    };
    const result = removeRuleIC(ic, 'r2');
    expect(result.conditions).toEqual([
      { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
    ]);
  });

  it('removes only rule (no combinator to remove)', () => {
    const ic: FilterIC = {
      id: 'root',
      conditions: [{ id: 'r1', field: 'name', operator: 'equals', value: 'John' }],
    };
    const result = removeRuleIC(ic, 'r1');
    expect(result.conditions).toEqual([]);
  });

  it('returns unchanged when ruleId not found', () => {
    const ic: FilterIC = {
      id: 'root',
      conditions: [
        { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
      ],
    };
    const result = removeRuleIC(ic, 'nonexistent');
    expect(result).toBe(ic);
    expect(result.conditions).toEqual(ic.conditions);
  });

  it('removes rule from nested IC group', () => {
    const ic: FilterIC = {
      id: 'root',
      conditions: [
        {
          id: 'g1',
          conditions: [
            { id: 'r1', field: 'a', operator: 'eq', value: 1 },
            'and',
            { id: 'r2', field: 'b', operator: 'eq', value: 2 },
          ],
        },
      ],
    };
    const result = removeRuleIC(ic, 'r1');
    const g1 = result.conditions[0] as FilterIC;
    expect(g1.conditions).toEqual([
      { id: 'r2', field: 'b', operator: 'eq', value: 2 },
    ]);
  });
});

describe('addRuleIC (nested groups)', () => {
  it('adds rule to nested IC group', () => {
    const ic: FilterIC = {
      id: 'root',
      conditions: [
        {
          id: 'g1',
          conditions: [
            { id: 'r1', field: 'a', operator: 'eq', value: 1 },
          ],
        },
      ],
    };
    const result = addRuleIC(ic, 'g1', {
      id: 'r2',
      field: 'b',
      operator: 'eq',
      value: 2,
    });
    const g1 = result.conditions[0] as FilterIC;
    expect(g1.conditions).toHaveLength(3);
    expect(g1.conditions[1]).toBe('and');
    expect(g1.conditions[2]).toMatchObject({ id: 'r2' });
  });

  it('adds rule with not flag', () => {
    const ic: FilterIC = { id: 'root', conditions: [] };
    const result = addRuleIC(ic, 'root', {
      id: 'r1',
      field: 'a',
      operator: 'eq',
      value: 1,
      not: true,
    });
    expect(result.conditions[0]).toMatchObject({ id: 'r1', not: true });
  });

  it('adds rule with custom idGenerator', () => {
    const ic: FilterIC = { id: 'root', conditions: [] };
    const result = addRuleIC(ic, 'root', { field: 'a', operator: 'eq', value: 1 }, 'and', {
      idGenerator: () => 'custom-id',
    });
    expect(result.conditions[0]).toMatchObject({ id: 'custom-id' });
  });
});

describe('convertFromIC (nested IC groups)', () => {
  it('converts nested IC groups recursively', () => {
    const ic: FilterIC = {
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
    const filter = convertFromIC(ic);
    expect(filter.combinator).toBe('and');
    expect(filter.conditions).toHaveLength(1);
    const g1 = filter.conditions[0] as Filter;
    expect(g1.combinator).toBe('or');
    expect(g1.conditions).toHaveLength(2);
  });
});
