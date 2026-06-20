import { negateGroup, negateRule } from '../negate';
import type { Filter } from '../types';

describe('negateRule', () => {
  it('sets not to true on rule without not', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'name', operator: 'equals', value: 'John' }],
    };
    const result = negateRule(filter, 'r1');
    const r1 = result.children[0];
    expect(r1).toMatchObject({ id: 'r1', not: true });
  });

  it('toggles not from true to false', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'name', operator: 'equals', value: 'John', not: true }],
    };
    const result = negateRule(filter, 'r1');
    const r1 = result.children[0];
    expect(r1).toMatchObject({ id: 'r1', not: false });
  });

  it('negateRule on rule with not: false sets to true', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'name', operator: 'equals', value: 'John', not: false }],
    };
    const result = negateRule(filter, 'r1');
    const r1 = result.children[0];
    expect(r1).toMatchObject({ id: 'r1', not: true });
  });

  it('negateRule on non-existent ruleId returns unchanged', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'name', operator: 'equals', value: 'John' }],
    };
    const result = negateRule(filter, 'nonexistent');
    expect(result).toBe(filter);
    expect(result.children[0]).toMatchObject({ id: 'r1' });
    expect(result.children[0]).not.toHaveProperty('not');
  });

  it('negateRule preserves immutability (original unchanged)', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'name', operator: 'equals', value: 'John' }],
    };
    const result = negateRule(filter, 'r1');
    expect(result).not.toBe(filter);
    expect(filter.children[0]).not.toHaveProperty('not');
    expect(result.children[0]).toMatchObject({ not: true });
  });

  it('negateRule on rule inside nested group', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      children: [
        {
          id: 'g1',
          combinator: 'or',
          children: [{ id: 'r2', field: 'age', operator: 'gt', value: 18 }],
        },
      ],
    };
    const result = negateRule(filter, 'r2');
    const g1 = result.children[0];
    if ('children' in g1) {
      expect(g1.children[0]).toMatchObject({ id: 'r2', not: true });
    }
  });

  it('negateRule on root-level rule when nested groups exist', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      children: [
        {
          id: 'g1',
          combinator: 'or',
          children: [{ id: 'r2', field: 'age', operator: 'gt', value: 18 }],
        },
        { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
      ],
    };
    const result = negateRule(filter, 'r1');
    expect(result.children[1]).toMatchObject({ id: 'r1', not: true });
    if ('children' in result.children[0]) {
      expect((result.children[0] as Filter).children[0]).toMatchObject({ id: 'r2' });
    }
  });
});

describe('negateGroup', () => {
  it('sets not to true on group', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      children: [
        {
          id: 'g1',
          combinator: 'or',
          children: [{ id: 'r1', field: 'x', operator: 'eq', value: 1 }],
        },
      ],
    };
    const result = negateGroup(filter, 'g1');
    const g1 = result.children[0];
    expect(g1).toMatchObject({ id: 'g1', not: true });
  });

  it('toggles not from true to false', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      children: [
        {
          id: 'g1',
          combinator: 'or',
          not: true,
          children: [{ id: 'r1', field: 'x', operator: 'eq', value: 1 }],
        },
      ],
    };
    const result = negateGroup(filter, 'g1');
    const g1 = result.children[0];
    expect(g1).toMatchObject({ id: 'g1', not: false });
  });

  it('negateGroup on root group', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'x', operator: 'eq', value: 1 }],
    };
    const result = negateGroup(filter, 'root');
    expect(result).toMatchObject({ id: 'root', not: true });
  });

  it('negateGroup on non-existent groupId returns unchanged', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      children: [
        {
          id: 'g1',
          combinator: 'or',
          children: [],
        },
      ],
    };
    const result = negateGroup(filter, 'nonexistent');
    expect(result).toBe(filter);
    expect(result.children[0]).not.toHaveProperty('not');
  });

  it('negateGroup preserves immutability', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      children: [
        {
          id: 'g1',
          combinator: 'or',
          children: [],
        },
      ],
    };
    const result = negateGroup(filter, 'g1');
    expect(result).not.toBe(filter);
    expect(filter.children[0]).not.toHaveProperty('not');
    expect(result.children[0]).toMatchObject({ not: true });
  });
});
