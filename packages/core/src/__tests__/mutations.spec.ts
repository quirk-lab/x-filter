import { createFilter } from '../create';
import {
  addRule,
  updateRule,
  removeRule,
  moveRule,
  addGroup,
  removeGroup,
  updateGroup,
} from '../mutations';
import type { Filter } from '../types';

describe('addRule', () => {
  it('adds rule to root group', () => {
    const filter = createFilter({ idGenerator: () => 'root' });
    const result = addRule(filter, 'root', {
      field: 'name',
      operator: 'equals',
      value: 'John',
    });
    expect(result.conditions).toHaveLength(1);
    expect(result.conditions[0]).toMatchObject({
      field: 'name',
      operator: 'equals',
      value: 'John',
    });
    expect(result.conditions[0]).toHaveProperty('id');
  });

  it('adds rule to nested group', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [
        {
          id: 'g1',
          combinator: 'or',
          conditions: [],
        },
      ],
    };
    const result = addRule(filter, 'g1', {
      field: 'age',
      operator: 'gt',
      value: 18,
    });
    const g1 = result.conditions[0];
    expect(g1).toHaveProperty('conditions');
    if ('conditions' in g1) {
      expect(g1.conditions).toHaveLength(1);
      expect(g1.conditions[0]).toMatchObject({
        field: 'age',
        operator: 'gt',
        value: 18,
      });
    }
  });

  it('throws when groupId does not exist', () => {
    const filter = createFilter({ idGenerator: () => 'root' });
    expect(() => addRule(filter, 'nonexistent', { field: 'x', operator: 'eq', value: 1 })).toThrow(
      'Group not found: nonexistent'
    );
  });

  it('returns new object (immutability) - original filter unchanged', () => {
    const filter = createFilter({ idGenerator: () => 'root' });
    const result = addRule(filter, 'root', { field: 'x', operator: 'eq', value: 1 });
    expect(result).not.toBe(filter);
    expect(filter.conditions).toHaveLength(0);
    expect(result.conditions).toHaveLength(1);
  });

  it('new rule gets auto-generated id', () => {
    const filter = createFilter({ idGenerator: () => 'root' });
    const result = addRule(filter, 'root', { field: 'x', operator: 'eq', value: 1 });
    const rule = result.conditions[0];
    expect(rule).toHaveProperty('id');
    expect(typeof (rule as { id: string }).id).toBe('string');
    expect((rule as { id: string }).id.length).toBeGreaterThan(0);
  });

  it('respects custom idGenerator in options', () => {
    const filter = createFilter({ idGenerator: () => 'root' });
    const customId = 'custom-rule-id';
    const result = addRule(filter, 'root', { field: 'x', operator: 'eq', value: 1 }, {
      idGenerator: () => customId,
    });
    expect(result.conditions[0]).toMatchObject({ id: customId });
  });

  it('preserves rule.not when provided', () => {
    const filter = createFilter({ idGenerator: () => 'root' });
    const result = addRule(filter, 'root', {
      field: 'x',
      operator: 'eq',
      value: 1,
      not: true,
    });
    expect(result.conditions[0]).toMatchObject({ not: true });
  });
});

describe('updateRule', () => {
  const filter: Filter = {
    id: 'root',
    combinator: 'and',
    conditions: [
      { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
      { id: 'r2', field: 'age', operator: 'gt', value: 18 },
    ],
  };

  it('updates field', () => {
    const result = updateRule(filter, 'r1', { field: 'email' });
    const r1 = result.conditions[0];
    expect(r1).toMatchObject({ id: 'r1', field: 'email', operator: 'equals', value: 'John' });
  });

  it('updates operator', () => {
    const result = updateRule(filter, 'r1', { operator: 'contains' });
    const r1 = result.conditions[0];
    expect(r1).toMatchObject({ id: 'r1', field: 'name', operator: 'contains', value: 'John' });
  });

  it('updates value', () => {
    const result = updateRule(filter, 'r1', { value: 'Jane' });
    const r1 = result.conditions[0];
    expect(r1).toMatchObject({ id: 'r1', field: 'name', operator: 'equals', value: 'Jane' });
  });

  it('updates multiple fields at once', () => {
    const result = updateRule(filter, 'r1', {
      field: 'email',
      operator: 'contains',
      value: '@',
    });
    const r1 = result.conditions[0];
    expect(r1).toMatchObject({
      id: 'r1',
      field: 'email',
      operator: 'contains',
      value: '@',
    });
  });

  it('returns unchanged filter when ruleId not found', () => {
    const result = updateRule(filter, 'nonexistent', { field: 'x' });
    expect(result).toBe(filter);
    expect(result.conditions).toHaveLength(2);
  });

  it('preserves immutability', () => {
    const result = updateRule(filter, 'r1', { field: 'email' });
    expect(result).not.toBe(filter);
    expect(filter.conditions[0]).toMatchObject({ field: 'name' });
    expect(result.conditions[0]).toMatchObject({ field: 'email' });
  });

  it('can set not flag', () => {
    const result = updateRule(filter, 'r1', { not: true });
    const r1 = result.conditions[0];
    expect(r1).toMatchObject({ id: 'r1', not: true });
  });

  it('updates rule inside nested group', () => {
    const nestedFilter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [
        {
          id: 'g1',
          combinator: 'or',
          conditions: [
            { id: 'r3', field: 'status', operator: 'equals', value: 'active' },
          ],
        },
      ],
    };
    const result = updateRule(nestedFilter, 'r3', { value: 'inactive' });
    const g1 = result.conditions[0];
    if ('conditions' in g1) {
      expect(g1.conditions[0]).toMatchObject({ id: 'r3', value: 'inactive' });
    }
  });

  it('updates root-level rule when nested groups exist', () => {
    const nestedFilter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [
        {
          id: 'g1',
          combinator: 'or',
          conditions: [
            { id: 'r3', field: 'status', operator: 'equals', value: 'active' },
          ],
        },
        { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
      ],
    };
    const result = updateRule(nestedFilter, 'r1', { value: 'Jane' });
    expect(result.conditions[1]).toMatchObject({ id: 'r1', value: 'Jane' });
  });
});

describe('removeRule', () => {
  it('removes rule from root group', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [
        { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
        { id: 'r2', field: 'age', operator: 'gt', value: 18 },
      ],
    };
    const result = removeRule(filter, 'r1');
    expect(result.conditions).toHaveLength(1);
    expect(result.conditions[0]).toMatchObject({ id: 'r2' });
  });

  it('removes rule from nested group', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [
        {
          id: 'g1',
          combinator: 'or',
          conditions: [
            { id: 'r1', field: 'a', operator: 'eq', value: 1 },
            { id: 'r2', field: 'b', operator: 'eq', value: 2 },
          ],
        },
      ],
    };
    const result = removeRule(filter, 'r1');
    const g1 = result.conditions[0];
    expect(g1).toHaveProperty('conditions');
    if ('conditions' in g1) {
      expect(g1.conditions).toHaveLength(1);
      expect(g1.conditions[0]).toMatchObject({ id: 'r2' });
    }
  });

  it('returns unchanged when ruleId not found', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [{ id: 'r1', field: 'x', operator: 'eq', value: 1 }],
    };
    const result = removeRule(filter, 'nonexistent');
    expect(result).toBe(filter);
    expect(result.conditions).toHaveLength(1);
  });

  it('empty group remains after removing last rule', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [{ id: 'r1', field: 'x', operator: 'eq', value: 1 }],
    };
    const result = removeRule(filter, 'r1');
    expect(result.conditions).toHaveLength(0);
    expect(result.id).toBe('root');
  });

  it('preserves immutability', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [
        { id: 'r1', field: 'x', operator: 'eq', value: 1 },
        { id: 'r2', field: 'y', operator: 'eq', value: 2 },
      ],
    };
    const result = removeRule(filter, 'r1');
    expect(result).not.toBe(filter);
    expect(filter.conditions).toHaveLength(2);
    expect(result.conditions).toHaveLength(1);
  });
});

describe('moveRule', () => {
  it('moves rule within same group (reorder)', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
        { id: 'r2', field: 'b', operator: 'eq', value: 2 },
        { id: 'r3', field: 'c', operator: 'eq', value: 3 },
      ],
    };
    const result = moveRule(filter, 'r3', 'root', 0);
    expect(result.conditions[0]).toMatchObject({ id: 'r3' });
    expect(result.conditions[1]).toMatchObject({ id: 'r1' });
    expect(result.conditions[2]).toMatchObject({ id: 'r2' });
  });

  it('moves rule between different groups', () => {
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
          combinator: 'or',
          conditions: [{ id: 'r2', field: 'b', operator: 'eq', value: 2 }],
        },
      ],
    };
    const result = moveRule(filter, 'r1', 'g2', 1);
    const g1 = result.conditions[0];
    const g2 = result.conditions[1];
    expect(g1).toHaveProperty('conditions');
    expect(g2).toHaveProperty('conditions');
    if ('conditions' in g1 && 'conditions' in g2) {
      expect(g1.conditions).toHaveLength(0);
      expect(g2.conditions).toHaveLength(2);
      expect(g2.conditions[0]).toMatchObject({ id: 'r2' });
      expect(g2.conditions[1]).toMatchObject({ id: 'r1' });
    }
  });

  it('moves rule from descendant group to ancestor group without duplicates', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [
        {
          id: 'g1',
          combinator: 'or',
          conditions: [
            {
              id: 'g2',
              combinator: 'and',
              conditions: [{ id: 'r1', field: 'a', operator: 'eq', value: 1 }],
            },
          ],
        },
      ],
    };

    const result = moveRule(filter, 'r1', 'g1', 0);
    const g1 = result.conditions[0];
    expect(g1).toHaveProperty('conditions');

    if ('conditions' in g1) {
      expect(g1.conditions[0]).toMatchObject({ id: 'r1' });
      const g2 = g1.conditions[1];
      expect(g2).toHaveProperty('conditions');
      if (g2 && 'conditions' in g2) {
        expect(g2.conditions).toHaveLength(0);
      }
      const allR1Count = JSON.stringify(result).split('"id":"r1"').length - 1;
      expect(allR1Count).toBe(1);
    }
  });

  it('throws when ruleId does not exist', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [{ id: 'r1', field: 'x', operator: 'eq', value: 1 }],
    };
    expect(() => moveRule(filter, 'nonexistent', 'root', 0)).toThrow(
      'Rule not found: nonexistent'
    );
  });

  it('throws when targetGroupId does not exist', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [{ id: 'r1', field: 'x', operator: 'eq', value: 1 }],
    };
    expect(() => moveRule(filter, 'r1', 'nonexistent', 0)).toThrow(
      'Target group not found: nonexistent'
    );
  });

  it('moves to position 0', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
        { id: 'r2', field: 'b', operator: 'eq', value: 2 },
      ],
    };
    const result = moveRule(filter, 'r2', 'root', 0);
    expect(result.conditions[0]).toMatchObject({ id: 'r2' });
    expect(result.conditions[1]).toMatchObject({ id: 'r1' });
  });
});

describe('addGroup', () => {
  it('adds empty group to root', () => {
    const filter = createFilter({ idGenerator: () => 'root' });
    const result = addGroup(filter, 'root');
    expect(result.conditions).toHaveLength(1);
    const added = result.conditions[0];
    expect(added).toHaveProperty('conditions');
    if ('conditions' in added) {
      expect(added.conditions).toEqual([]);
      expect(added).toMatchObject({ combinator: 'and' });
    }
  });

  it('adds group with custom combinator', () => {
    const filter = createFilter({ idGenerator: () => 'root' });
    const result = addGroup(filter, 'root', { combinator: 'or' });
    const added = result.conditions[0];
    expect(added).toMatchObject({ combinator: 'or' });
  });

  it('throws when parentGroupId does not exist', () => {
    const filter = createFilter({ idGenerator: () => 'root' });
    expect(() => addGroup(filter, 'nonexistent')).toThrow(
      'Parent group not found: nonexistent'
    );
  });

  it('adds group with not flag', () => {
    const filter = createFilter({ idGenerator: () => 'root' });
    const result = addGroup(filter, 'root', { not: true });
    const added = result.conditions[0];
    expect(added).toMatchObject({ not: true });
  });
});

describe('removeGroup', () => {
  it('removes child group', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [
        {
          id: 'g1',
          combinator: 'or',
          conditions: [{ id: 'r1', field: 'x', operator: 'eq', value: 1 }],
        },
      ],
    };
    const result = removeGroup(filter, 'g1');
    expect(result.conditions).toHaveLength(0);
  });

  it('throws when trying to remove root group', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [],
    };
    expect(() => removeGroup(filter, 'root')).toThrow('Cannot remove root group');
  });

  it('removes nested group and all its contents', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [
        {
          id: 'g1',
          combinator: 'or',
          conditions: [
            {
              id: 'g2',
              combinator: 'and',
              conditions: [
                { id: 'r1', field: 'x', operator: 'eq', value: 1 },
              ],
            },
          ],
        },
      ],
    };
    const result = removeGroup(filter, 'g1');
    expect(result.conditions).toHaveLength(0);
  });
});

describe('updateGroup', () => {
  it('updates combinator', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [
        {
          id: 'g1',
          combinator: 'or',
          conditions: [],
        },
      ],
    };
    const result = updateGroup(filter, 'g1', { combinator: 'and' });
    const g1 = result.conditions[0];
    expect(g1).toMatchObject({ id: 'g1', combinator: 'and' });
  });

  it('updates not flag', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [
        {
          id: 'g1',
          combinator: 'or',
          conditions: [],
        },
      ],
    };
    const result = updateGroup(filter, 'g1', { not: true });
    const g1 = result.conditions[0];
    expect(g1).toMatchObject({ id: 'g1', not: true });
  });
});
