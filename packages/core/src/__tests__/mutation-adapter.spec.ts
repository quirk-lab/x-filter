import { convertToIC } from '../ic';
import { icMutationAdapter, standardMutationAdapter } from '../mutation-adapter';
import type { Filter, FilterIC } from '../types';

// Helper: extract item ids from conditions (works for both modes)
function itemIds(children: unknown[]): string[] {
  return children.filter((c) => typeof c !== 'string').map((c) => (c as { id: string }).id);
}

const makeStandardFilter = (): Filter => ({
  id: 'root',
  combinator: 'and',
  children: [
    { id: 'r1', field: 'a', operator: 'eq', value: 1 },
    { id: 'r2', field: 'b', operator: 'eq', value: 2 },
  ],
});

const makeICFilter = (): FilterIC => convertToIC(makeStandardFilter());

describe('MutationAdapter contract: addRule', () => {
  it('standard: adds rule to group', () => {
    const filter = makeStandardFilter();
    const result = standardMutationAdapter.addRule(filter, 'root', {
      id: 'r3',
      field: 'c',
      operator: 'eq',
      value: 3,
    });
    expect(itemIds(result.children)).toEqual(['r1', 'r2', 'r3']);
  });

  it('IC: adds rule to group', () => {
    const filter = makeICFilter();
    const result = icMutationAdapter.addRule(filter, 'root', {
      id: 'r3',
      field: 'c',
      operator: 'eq',
      value: 3,
    });
    expect(itemIds(result.children)).toEqual(['r1', 'r2', 'r3']);
  });
});

describe('MutationAdapter contract: updateRule', () => {
  it('standard: updates rule value', () => {
    const filter = makeStandardFilter();
    const result = standardMutationAdapter.updateRule(filter, 'r1', { value: 99 });
    expect(result.children[0]).toMatchObject({ id: 'r1', value: 99 });
  });

  it('IC: updates rule value', () => {
    const filter = makeICFilter();
    const result = icMutationAdapter.updateRule(filter, 'r1', { value: 99 });
    expect(result.children[0]).toMatchObject({ id: 'r1', value: 99 });
  });
});

describe('MutationAdapter contract: removeRule', () => {
  it('standard: removes rule', () => {
    const filter = makeStandardFilter();
    const result = standardMutationAdapter.removeRule(filter, 'r1');
    expect(itemIds(result.children)).toEqual(['r2']);
  });

  it('IC: removes rule', () => {
    const filter = makeICFilter();
    const result = icMutationAdapter.removeRule(filter, 'r1');
    expect(itemIds(result.children)).toEqual(['r2']);
  });
});

describe('MutationAdapter contract: moveRule', () => {
  it('standard: moves rule to position 0', () => {
    const filter = makeStandardFilter();
    const result = standardMutationAdapter.moveRule(filter, 'r2', 'root', 0);
    expect(itemIds(result.children)).toEqual(['r2', 'r1']);
  });

  it('IC: moves rule to position 0', () => {
    const filter = makeICFilter();
    const result = icMutationAdapter.moveRule(filter, 'r2', 'root', 0);
    expect(itemIds(result.children)).toEqual(['r2', 'r1']);
  });
});

describe('MutationAdapter contract: addGroup', () => {
  it('standard: adds group', () => {
    const filter = makeStandardFilter();
    const result = standardMutationAdapter.addGroup(filter, 'root', { id: 'g1' });
    expect(itemIds(result.children)).toEqual(['r1', 'r2', 'g1']);
  });

  it('IC: adds group', () => {
    const filter = makeICFilter();
    const result = icMutationAdapter.addGroup(filter, 'root', { id: 'g1' });
    expect(itemIds(result.children)).toEqual(['r1', 'r2', 'g1']);
  });
});

describe('MutationAdapter contract: removeGroup', () => {
  it('standard: removes group', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      children: [
        { id: 'g1', combinator: 'or', children: [] },
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
      ],
    };
    const result = standardMutationAdapter.removeGroup(filter, 'g1');
    expect(itemIds(result.children)).toEqual(['r1']);
  });

  it('IC: removes group', () => {
    const filter: FilterIC = {
      id: 'root',
      children: [
        { id: 'g1', children: [] },
        'and',
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
      ],
    };
    const result = icMutationAdapter.removeGroup(filter, 'g1');
    expect(itemIds(result.children)).toEqual(['r1']);
  });
});

describe('MutationAdapter contract: negateRule', () => {
  it('standard: negates rule', () => {
    const filter = makeStandardFilter();
    const result = standardMutationAdapter.negateRule(filter, 'r1');
    expect(result.children[0]).toMatchObject({ id: 'r1', not: true });
  });

  it('IC: negates rule', () => {
    const filter = makeICFilter();
    const result = icMutationAdapter.negateRule(filter, 'r1');
    expect(result.children[0]).toMatchObject({ id: 'r1', not: true });
  });
});

describe('MutationAdapter contract: negateGroup', () => {
  it('standard: negates group', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'g1', combinator: 'or', children: [] }],
    };
    const result = standardMutationAdapter.negateGroup(filter, 'g1');
    expect(result.children[0]).toMatchObject({ id: 'g1', not: true });
  });

  it('IC: negates group', () => {
    const filter: FilterIC = {
      id: 'root',
      children: [{ id: 'g1', children: [] }],
    };
    const result = icMutationAdapter.negateGroup(filter, 'g1');
    expect(result.children[0]).toMatchObject({ id: 'g1', not: true });
  });
});
