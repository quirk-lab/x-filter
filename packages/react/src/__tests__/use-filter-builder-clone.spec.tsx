import { act, renderHook } from '@testing-library/react';
import type { FieldSchema, Filter, FilterIC, FilterRule } from '@x-filter/core';
import { useFilterBuilder } from '../use-filter-builder';

const schema: FieldSchema[] = [{ name: 'name', label: 'Name', type: 'text' }];

describe('useFilterBuilder clone (standard mode)', () => {
  it('cloneRule inserts a copy after the source with a fresh id', () => {
    const defaultValue: Filter = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'name', operator: 'equals', value: 'a' }],
    };
    const { result } = renderHook(() => useFilterBuilder({ defaultValue, schema }));

    act(() => {
      result.current.cloneRule('r1');
    });

    expect(result.current.filter.children).toHaveLength(2);
    const [first, second] = result.current.filter.children as FilterRule[];
    expect(first.id).toBe('r1');
    expect(second.id).not.toBe('r1');
    expect(second).toMatchObject({ field: 'name', operator: 'equals', value: 'a' });
  });

  it('cloneGroup deep-clones a group after the source', () => {
    const defaultValue: Filter = {
      id: 'root',
      combinator: 'and',
      children: [
        {
          id: 'g1',
          combinator: 'or',
          children: [{ id: 'r1', field: 'name', operator: 'equals', value: 'a' }],
        },
      ],
    };
    const { result } = renderHook(() => useFilterBuilder({ defaultValue, schema }));

    act(() => {
      result.current.cloneGroup('g1');
    });

    expect(result.current.filter.children).toHaveLength(2);
    const clone = result.current.filter.children[1] as Extract<
      Filter['children'][number],
      { combinator: unknown }
    >;
    expect(clone.id).not.toBe('g1');
    expect((clone.children[0] as FilterRule).id).not.toBe('r1');
  });
});

describe('useFilterBuilder clone (IC mode)', () => {
  it('cloneRule inserts [combinator, clone] after the source', () => {
    const defaultValue: FilterIC = {
      id: 'root',
      children: [
        { id: 'r1', field: 'name', operator: 'equals', value: 'a' },
        'or',
        { id: 'r2', field: 'name', operator: 'equals', value: 'b' },
      ],
    };
    const { result } = renderHook(() =>
      useFilterBuilder({ defaultValue: defaultValue as unknown as Filter, schema, mode: 'ic' })
    );

    act(() => {
      result.current.cloneRule('r1');
    });

    const children = (result.current.filter as unknown as FilterIC).children;
    expect(children).toHaveLength(5);
    expect(children[1]).toBe('or');
    expect((children[2] as FilterRule).id).not.toBe('r1');
  });
});
