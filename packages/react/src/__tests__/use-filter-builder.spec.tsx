import { act, renderHook } from '@testing-library/react';
import type { FieldSchema, Filter, FilterRule } from '@x-filter/core';
import { useFilterBuilder } from '../use-filter-builder';

const schema: FieldSchema[] = [
  { name: 'name', label: 'Name', type: 'text' },
  { name: 'age', label: 'Age', type: 'number' },
];

const makeFilter = (overrides?: Partial<Filter>): Filter => ({
  id: 'root',
  combinator: 'and',
  children: [],
  ...overrides,
});

const makeRule = (id: string, overrides?: Partial<FilterRule>): FilterRule => ({
  id,
  field: 'name',
  operator: 'equals',
  value: 'test',
  ...overrides,
});

describe('useFilterBuilder', () => {
  describe('uncontrolled mode', () => {
    it('creates default filter when no defaultValue provided', () => {
      const { result } = renderHook(() => useFilterBuilder({ schema }));
      expect(result.current.filter).toMatchObject({
        combinator: 'and',
        children: [],
      });
      expect(result.current.filter.id).toBeDefined();
    });

    it('uses defaultValue when provided', () => {
      const defaultValue = makeFilter({ id: 'custom-root' });
      const { result } = renderHook(() => useFilterBuilder({ defaultValue, schema }));
      expect(result.current.filter).toBe(defaultValue);
    });

    it('addRule adds a rule to the specified group', () => {
      const defaultValue = makeFilter();
      const { result } = renderHook(() => useFilterBuilder({ defaultValue, schema }));

      act(() => {
        result.current.addRule('root', { field: 'name', operator: 'equals', value: 'John' });
      });

      expect(result.current.filter.children).toHaveLength(1);
      expect(result.current.filter.children[0]).toMatchObject({
        field: 'name',
        operator: 'equals',
        value: 'John',
      });
    });

    it('removeRule removes a rule', () => {
      const defaultValue = makeFilter({
        children: [makeRule('r1'), makeRule('r2')],
      });
      const { result } = renderHook(() => useFilterBuilder({ defaultValue, schema }));

      act(() => {
        result.current.removeRule('r1');
      });

      expect(result.current.filter.children).toHaveLength(1);
      expect(result.current.filter.children[0]).toMatchObject({ id: 'r2' });
    });

    it("updateRule updates a rule's fields", () => {
      const defaultValue = makeFilter({
        children: [makeRule('r1', { field: 'name', operator: 'equals', value: 'old' })],
      });
      const { result } = renderHook(() => useFilterBuilder({ defaultValue, schema }));

      act(() => {
        result.current.updateRule('r1', { value: 'new', operator: 'contains' });
      });

      expect(result.current.filter.children[0]).toMatchObject({
        id: 'r1',
        field: 'name',
        operator: 'contains',
        value: 'new',
      });
    });

    it('addGroup adds a sub-group', () => {
      const defaultValue = makeFilter();
      const { result } = renderHook(() => useFilterBuilder({ defaultValue, schema }));

      act(() => {
        result.current.addGroup('root', { combinator: 'or' });
      });

      expect(result.current.filter.children).toHaveLength(1);
      const subGroup = result.current.filter.children[0];
      expect(subGroup).toMatchObject({ combinator: 'or', children: [] });
    });

    it('removeGroup removes a sub-group', () => {
      const defaultValue: Filter = {
        id: 'root',
        combinator: 'and',
        children: [{ id: 'g1', combinator: 'or', children: [] }],
      };
      const { result } = renderHook(() => useFilterBuilder({ defaultValue, schema }));

      act(() => {
        result.current.removeGroup('g1');
      });

      expect(result.current.filter.children).toHaveLength(0);
    });

    it('updateGroup updates combinator', () => {
      const defaultValue: Filter = {
        id: 'root',
        combinator: 'and',
        children: [{ id: 'g1', combinator: 'and', children: [] }],
      };
      const { result } = renderHook(() => useFilterBuilder({ defaultValue, schema }));

      act(() => {
        result.current.updateGroup('g1', { combinator: 'or' });
      });

      expect(result.current.filter.children[0]).toMatchObject({
        id: 'g1',
        combinator: 'or',
      });
    });

    it('updateGroup updates not flag', () => {
      const defaultValue: Filter = {
        id: 'root',
        combinator: 'and',
        children: [{ id: 'g1', combinator: 'and', children: [] }],
      };
      const { result } = renderHook(() => useFilterBuilder({ defaultValue, schema }));

      act(() => {
        result.current.updateGroup('g1', { not: true });
      });

      expect(result.current.filter.children[0]).toMatchObject({
        id: 'g1',
        not: true,
      });
    });

    it('moveRule moves a rule to a different position', () => {
      const defaultValue: Filter = {
        id: 'root',
        combinator: 'and',
        children: [
          makeRule('r1', { value: 'a' }),
          makeRule('r2', { value: 'b' }),
          makeRule('r3', { value: 'c' }),
        ],
      };
      const { result } = renderHook(() => useFilterBuilder({ defaultValue, schema }));

      act(() => {
        result.current.moveRule('r3', 'root', 0);
      });

      expect(result.current.filter.children[0]).toMatchObject({ id: 'r3' });
      expect(result.current.filter.children[1]).toMatchObject({ id: 'r1' });
      expect(result.current.filter.children[2]).toMatchObject({ id: 'r2' });
    });

    it('moveRule moves a rule between groups', () => {
      const defaultValue: Filter = {
        id: 'root',
        combinator: 'and',
        children: [
          { id: 'g1', combinator: 'or', children: [makeRule('r1')] },
          { id: 'g2', combinator: 'or', children: [] },
        ],
      };
      const { result } = renderHook(() => useFilterBuilder({ defaultValue, schema }));

      act(() => {
        result.current.moveRule('r1', 'g2', 0);
      });

      const g1 = result.current.filter.children[0] as Filter;
      const g2 = result.current.filter.children[1] as Filter;
      expect(g1.children).toHaveLength(0);
      expect(g2.children).toHaveLength(1);
      expect(g2.children[0]).toMatchObject({ id: 'r1' });
    });

    it('setFilter with direct value updates filter', () => {
      const defaultValue = makeFilter();
      const newFilter = makeFilter({ id: 'new-root', combinator: 'or' });
      const { result } = renderHook(() => useFilterBuilder({ defaultValue, schema }));

      act(() => {
        result.current.setFilter(newFilter);
      });

      expect(result.current.filter).toBe(newFilter);
    });

    it('setFilter with function updater updates filter', () => {
      const defaultValue = makeFilter({ children: [makeRule('r1')] });
      const { result } = renderHook(() => useFilterBuilder({ defaultValue, schema }));

      act(() => {
        result.current.setFilter((prev) => ({
          ...prev,
          combinator: 'or' as const,
        }));
      });

      expect(result.current.filter.combinator).toBe('or');
      expect(result.current.filter.children).toHaveLength(1);
    });

    it('onChange callback is called on mutations', () => {
      const onChange = jest.fn();
      const defaultValue = makeFilter();
      const { result } = renderHook(() => useFilterBuilder({ defaultValue, onChange, schema }));

      act(() => {
        result.current.addRule('root', { field: 'name', operator: 'equals', value: 'x' });
      });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ children: expect.any(Array) })
      );
    });

    it('onChange is called for each mutation type', () => {
      const onChange = jest.fn();
      const defaultValue: Filter = {
        id: 'root',
        combinator: 'and',
        children: [makeRule('r1'), { id: 'g1', combinator: 'or', children: [makeRule('r2')] }],
      };
      const { result } = renderHook(() => useFilterBuilder({ defaultValue, onChange, schema }));

      act(() => result.current.removeRule('r1'));
      expect(onChange).toHaveBeenCalledTimes(1);

      act(() => result.current.updateGroup('g1', { combinator: 'and' }));
      expect(onChange).toHaveBeenCalledTimes(2);

      act(() => result.current.setFilter(makeFilter()));
      expect(onChange).toHaveBeenCalledTimes(3);
    });

    it('applies back-to-back mutations from the latest state', () => {
      const defaultValue = makeFilter();
      const onChange = jest.fn();
      const { result } = renderHook(() => useFilterBuilder({ defaultValue, onChange, schema }));

      act(() => {
        result.current.addRule('root', { field: 'name', operator: 'equals', value: 'A' });
        result.current.addRule('root', { field: 'age', operator: 'gt', value: 18 });
      });

      expect(result.current.filter.children).toHaveLength(2);
      expect(onChange).toHaveBeenCalledTimes(2);
      expect(onChange.mock.calls[0][0].children).toHaveLength(1);
      expect(onChange.mock.calls[1][0].children).toHaveLength(2);
    });
  });

  describe('clear', () => {
    it('empties children while preserving id and combinator', () => {
      const defaultValue = makeFilter({
        id: 'root',
        combinator: 'or',
        children: [makeRule('r1'), { id: 'g1', combinator: 'and', children: [makeRule('r2')] }],
      });
      const onChange = jest.fn();
      const { result } = renderHook(() => useFilterBuilder({ defaultValue, onChange, schema }));

      act(() => {
        result.current.clear();
      });

      expect(result.current.filter).toEqual({ id: 'root', combinator: 'or', children: [] });
      expect(onChange).toHaveBeenCalledWith({ id: 'root', combinator: 'or', children: [] });
    });

    it('leaves a locked root untouched', () => {
      const defaultValue = makeFilter({ children: [makeRule('r1')], locked: true });
      const { result } = renderHook(() => useFilterBuilder({ defaultValue, schema }));

      act(() => {
        result.current.clear();
      });

      expect(result.current.filter.children).toHaveLength(1);
    });

    it('clears an IC-mode root, keeping its shape', () => {
      const { result } = renderHook(() =>
        useFilterBuilder({
          defaultValue: {
            id: 'root',
            children: [makeRule('r1'), 'and', makeRule('r2')],
          } as unknown as Filter,
          schema,
          mode: 'ic',
        })
      );

      act(() => {
        result.current.clear();
      });

      expect(result.current.filter).toEqual({ id: 'root', children: [] });
    });
  });

  describe('controlled mode', () => {
    it('uses value prop as filter', () => {
      const value = makeFilter({ id: 'controlled', children: [makeRule('r1')] });
      const { result } = renderHook(() => useFilterBuilder({ value, schema }));
      expect(result.current.filter).toBe(value);
    });

    it('onChange is called but internal state does not change', () => {
      const onChange = jest.fn();
      const value = makeFilter();
      const { result } = renderHook(() => useFilterBuilder({ value, onChange, schema }));

      act(() => {
        result.current.addRule('root', { field: 'name', operator: 'equals', value: 'x' });
      });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(result.current.filter).toBe(value);
    });

    it('re-renders with new value prop updates filter', () => {
      const onChange = jest.fn();
      const value1 = makeFilter({ id: 'v1' });
      const value2 = makeFilter({ id: 'v2', children: [makeRule('r1')] });

      const { result, rerender } = renderHook(
        ({ value }) => useFilterBuilder({ value, onChange, schema }),
        { initialProps: { value: value1 } }
      );

      expect(result.current.filter).toBe(value1);

      rerender({ value: value2 });

      expect(result.current.filter).toBe(value2);
    });

    it('setFilter with function updater reads from controlled value', () => {
      const onChange = jest.fn();
      const value = makeFilter({ combinator: 'and' });
      const { result } = renderHook(() => useFilterBuilder({ value, onChange, schema }));

      act(() => {
        result.current.setFilter((prev) => ({
          ...prev,
          combinator: 'or',
        }));
      });

      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ combinator: 'or' }));
      expect(result.current.filter).toBe(value);
    });

    it('uses latest emitted state for batched controlled mutations', () => {
      const onChange = jest.fn();
      const value = makeFilter();
      const { result } = renderHook(() => useFilterBuilder({ value, onChange, schema }));

      act(() => {
        result.current.addRule('root', { field: 'name', operator: 'equals', value: 'A' });
        result.current.addRule('root', { field: 'age', operator: 'gt', value: 18 });
      });

      expect(onChange).toHaveBeenCalledTimes(2);
      expect(onChange.mock.calls[0][0].children).toHaveLength(1);
      expect(onChange.mock.calls[1][0].children).toHaveLength(2);
    });
  });

  describe('schema', () => {
    it('returns schema as-is', () => {
      const { result } = renderHook(() => useFilterBuilder({ schema }));
      expect(result.current.schema).toBe(schema);
    });
  });
});
