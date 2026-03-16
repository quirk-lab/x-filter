import { createFilter, createGroup, createRule } from '../create';

describe('createFilter', () => {
  it('returns FilterGroup with id, combinator "and", empty conditions', () => {
    const filter = createFilter();
    expect(filter).toHaveProperty('id');
    expect(typeof filter.id).toBe('string');
    expect(filter.id.length).toBeGreaterThan(0);
    expect(filter.combinator).toBe('and');
    expect(filter.conditions).toEqual([]);
  });

  it('createFilter({ combinator: "or" }) has "or" combinator', () => {
    const filter = createFilter({ combinator: 'or' });
    expect(filter.combinator).toBe('or');
  });

  it('createFilter with custom idGenerator uses it', () => {
    const customId = 'custom-filter-id';
    const idGenerator = () => customId;
    const filter = createFilter({ idGenerator });
    expect(filter.id).toBe(customId);
  });
});

describe('createRule', () => {
  it('returns rule with id, empty field/operator, value null', () => {
    const rule = createRule();
    expect(rule).toHaveProperty('id');
    expect(typeof rule.id).toBe('string');
    expect(rule.id.length).toBeGreaterThan(0);
    expect(rule.field).toBe('');
    expect(rule.operator).toBe('');
    expect(rule.value).toBeNull();
  });

  it('createRule with all options: field, operator, value, not', () => {
    const rule = createRule({
      field: 'name',
      operator: 'equals',
      value: 'John',
      not: true,
    });
    expect(rule.field).toBe('name');
    expect(rule.operator).toBe('equals');
    expect(rule.value).toBe('John');
    expect(rule.not).toBe(true);
  });

  it('createRule with custom id', () => {
    const customId = 'rule-123';
    const rule = createRule({ id: customId });
    expect(rule.id).toBe(customId);
  });

  it('createRule with not: true sets not', () => {
    const rule = createRule({ not: true });
    expect(rule.not).toBe(true);
  });

  it('createRule with not: false sets not to false', () => {
    const rule = createRule({ not: false });
    expect(rule.not).toBe(false);
  });

  it('createRule with idGenerator', () => {
    const customId = 'gen-rule-id';
    const idGenerator = () => customId;
    const rule = createRule({ idGenerator });
    expect(rule.id).toBe(customId);
  });
});

describe('createGroup', () => {
  it('returns group with id, combinator "and", empty conditions', () => {
    const group = createGroup();
    expect(group).toHaveProperty('id');
    expect(typeof group.id).toBe('string');
    expect(group.id.length).toBeGreaterThan(0);
    expect(group.combinator).toBe('and');
    expect(group.conditions).toEqual([]);
  });

  it('createGroup with combinator "or"', () => {
    const group = createGroup({ combinator: 'or' });
    expect(group.combinator).toBe('or');
  });

  it('createGroup with not: true', () => {
    const group = createGroup({ not: true });
    expect(group.not).toBe(true);
  });

  it('createGroup with custom id', () => {
    const customId = 'group-456';
    const group = createGroup({ id: customId });
    expect(group.id).toBe(customId);
  });

  it('createGroup with idGenerator', () => {
    const customId = 'gen-group-id';
    const idGenerator = () => customId;
    const group = createGroup({ idGenerator });
    expect(group.id).toBe(customId);
  });
});
