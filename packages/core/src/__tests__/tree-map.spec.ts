import { mapTree, updateById } from '../tree-map';
import type { Filter, FilterGroup, FilterIC, FilterRule } from '../types';

describe('mapTree', () => {
  const filter: Filter = {
    id: 'root',
    combinator: 'and',
    children: [
      { id: 'r1', field: 'name', operator: 'eq', value: 'John' },
      {
        id: 'g1',
        combinator: 'or',
        children: [{ id: 'r2', field: 'age', operator: 'gt', value: 18 }],
      },
    ],
  };

  it('onGroup: transforms matching group, preserves others by reference', () => {
    const result = mapTree(filter, {
      onGroup: (g) => (g.id === 'g1' ? { ...g, combinator: 'and' } : g),
    });
    expect((result.children[1] as FilterGroup).combinator).toBe('and');
    // root rebuilt because child changed
    expect(result).not.toBe(filter);
    // r1 untouched by reference
    expect(result.children[0]).toBe(filter.children[0]);
  });

  it('onGroup: returns same root by reference when nothing changes', () => {
    const result = mapTree(filter, {
      onGroup: (g) => g,
    });
    expect(result).toBe(filter);
  });

  it('onRule: transforms matching rule', () => {
    const result = mapTree(filter, {
      onRule: (r) => (r.id === 'r1' ? { ...r, value: 'Jane' } : r),
    });
    expect((result.children[0] as FilterRule).value).toBe('Jane');
    expect(result).not.toBe(filter);
  });

  it('onRule: returns same root by reference when nothing changes', () => {
    const result = mapTree(filter, {
      onRule: (r) => r,
    });
    expect(result).toBe(filter);
  });

  it('onGroup + onRule both applied', () => {
    const result = mapTree(filter, {
      onGroup: (g) => (g.id === 'g1' ? { ...g, combinator: 'and' } : g),
      onRule: (r) => (r.id === 'r1' ? { ...r, value: 'Jane' } : r),
    });
    expect((result.children[0] as FilterRule).value).toBe('Jane');
    expect((result.children[1] as FilterGroup).combinator).toBe('and');
  });

  it('IC mode: combinator strings pass through untouched', () => {
    const ic: FilterIC = {
      id: 'root',
      children: [
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
        'and',
        { id: 'r2', field: 'b', operator: 'eq', value: 2 },
      ],
    };
    const result = mapTree(ic, {
      onRule: (r) => (r.id === 'r1' ? { ...r, value: 99 } : r),
    });
    expect(result.children).toEqual([
      { id: 'r1', field: 'a', operator: 'eq', value: 99 },
      'and',
      { id: 'r2', field: 'b', operator: 'eq', value: 2 },
    ]);
  });

  it('IC mode: onGroup transforms nested IC group', () => {
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
    const result = mapTree(ic, {
      onGroup: (g) => (g.id === 'g1' ? { ...g, not: true } : g),
    });
    expect((result.children[0] as FilterIC).not).toBe(true);
  });

  it('IC mode: returns same root by reference when nothing changes', () => {
    const ic: FilterIC = {
      id: 'root',
      children: [
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
        'and',
        { id: 'r2', field: 'b', operator: 'eq', value: 2 },
      ],
    };
    const result = mapTree(ic, {
      onRule: (r) => r,
    });
    expect(result).toBe(ic);
  });
});

describe('updateById', () => {
  const filter: Filter = {
    id: 'root',
    combinator: 'and',
    children: [
      { id: 'r1', field: 'name', operator: 'eq', value: 'John' },
      {
        id: 'g1',
        combinator: 'or',
        children: [{ id: 'r2', field: 'age', operator: 'gt', value: 18 }],
      },
    ],
  };

  it('updates rule by id', () => {
    const result = updateById(filter, 'r1', (r) => ({ ...r, value: 'Jane' }));
    expect((result.children[0] as FilterRule).value).toBe('Jane');
  });

  it('updates group by id', () => {
    const result = updateById(filter, 'g1', (g) => ({ ...g, combinator: 'and' }));
    expect((result.children[1] as FilterGroup).combinator).toBe('and');
  });

  it('updates nested rule by id', () => {
    const result = updateById(filter, 'r2', (r) => ({ ...r, value: 21 }));
    const g1 = result.children[1] as FilterGroup;
    expect((g1.children[0] as FilterRule).value).toBe(21);
  });

  it('returns same root by reference when id not found', () => {
    const result = updateById(filter, 'nonexistent', (n) => n);
    expect(result).toBe(filter);
  });
});
