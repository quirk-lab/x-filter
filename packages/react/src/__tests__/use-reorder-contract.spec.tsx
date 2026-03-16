import { act, renderHook } from '@testing-library/react';
import type { Filter } from '@x-filter/core';
import { useReorderContract } from '../use-reorder-contract';

const makeFilter = (): Filter => ({
  id: 'root',
  combinator: 'and',
  conditions: [
    { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
    { id: 'r2', field: 'age', operator: 'gt', value: 18 },
    {
      id: 'g1',
      combinator: 'or',
      conditions: [{ id: 'r3', field: 'status', operator: 'equals', value: 'active' }],
    },
  ],
});

const makeNestedFilter = (): Filter => ({
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
          conditions: [{ id: 'r1', field: 'x', operator: 'eq', value: 1 }],
        },
      ],
    },
  ],
});

describe('useReorderContract', () => {
  describe('moveItem', () => {
    it('calls onReorder with updated filter when moving a rule', () => {
      const onReorder = jest.fn();
      const filter = makeFilter();
      const { result } = renderHook(() => useReorderContract({ filter, onReorder }));

      act(() => {
        result.current.moveItem({
          type: 'rule',
          id: 'r1',
          targetGroupId: 'root',
          targetIndex: 2,
        });
      });

      expect(onReorder).toHaveBeenCalledTimes(1);
      const newFilter = onReorder.mock.calls[0][0] as Filter;
      expect(newFilter.conditions[0]).toMatchObject({ id: 'r2' });
    });

    it('moves a rule into a sub-group', () => {
      const onReorder = jest.fn();
      const filter = makeFilter();
      const { result } = renderHook(() => useReorderContract({ filter, onReorder }));

      act(() => {
        result.current.moveItem({
          type: 'rule',
          id: 'r1',
          targetGroupId: 'g1',
          targetIndex: 0,
        });
      });

      expect(onReorder).toHaveBeenCalledTimes(1);
      const newFilter = onReorder.mock.calls[0][0] as Filter;
      const g1 = newFilter.conditions.find((c) => 'id' in c && c.id === 'g1') as Filter;
      expect(g1.conditions.some((c) => 'id' in c && c.id === 'r1')).toBe(true);
    });
  });

  describe('canDrop', () => {
    it('returns true for valid drops (rule into group)', () => {
      const onReorder = jest.fn();
      const filter = makeFilter();
      const { result } = renderHook(() => useReorderContract({ filter, onReorder }));

      expect(result.current.canDrop('r1', 'root')).toBe(true);
      expect(result.current.canDrop('r1', 'g1')).toBe(true);
      expect(result.current.canDrop('r3', 'root')).toBe(true);
    });

    it('returns false for non-existent drag item', () => {
      const onReorder = jest.fn();
      const filter = makeFilter();
      const { result } = renderHook(() => useReorderContract({ filter, onReorder }));

      expect(result.current.canDrop('nonexistent', 'root')).toBe(false);
    });

    it('returns false for non-existent target group', () => {
      const onReorder = jest.fn();
      const filter = makeFilter();
      const { result } = renderHook(() => useReorderContract({ filter, onReorder }));

      expect(result.current.canDrop('r1', 'nonexistent')).toBe(false);
    });

    it('returns false when dropping group into itself', () => {
      const onReorder = jest.fn();
      const filter = makeFilter();
      const { result } = renderHook(() => useReorderContract({ filter, onReorder }));

      expect(result.current.canDrop('g1', 'g1')).toBe(false);
    });

    it('returns false when dropping group into its descendant', () => {
      const onReorder = jest.fn();
      const filter = makeNestedFilter();
      const { result } = renderHook(() => useReorderContract({ filter, onReorder }));

      expect(result.current.canDrop('g1', 'g2')).toBe(false);
    });

    it('returns false when target is a rule, not a group', () => {
      const onReorder = jest.fn();
      const filter = makeFilter();
      const { result } = renderHook(() => useReorderContract({ filter, onReorder }));

      expect(result.current.canDrop('r1', 'r2')).toBe(false);
    });

    it('allows dropping a group into a non-descendant group', () => {
      const filter: Filter = {
        id: 'root',
        combinator: 'and',
        conditions: [
          { id: 'g1', combinator: 'or', conditions: [] },
          { id: 'g2', combinator: 'or', conditions: [] },
        ],
      };
      const onReorder = jest.fn();
      const { result } = renderHook(() => useReorderContract({ filter, onReorder }));

      expect(result.current.canDrop('g1', 'g2')).toBe(true);
      expect(result.current.canDrop('g2', 'g1')).toBe(true);
    });

    it('allows dropping a group into root', () => {
      const onReorder = jest.fn();
      const filter = makeFilter();
      const { result } = renderHook(() => useReorderContract({ filter, onReorder }));

      expect(result.current.canDrop('g1', 'root')).toBe(true);
    });

    it('returns false when dropping root into a child', () => {
      const onReorder = jest.fn();
      const filter = makeFilter();
      const { result } = renderHook(() => useReorderContract({ filter, onReorder }));

      expect(result.current.canDrop('root', 'g1')).toBe(false);
    });
  });

  describe('reactivity', () => {
    it('canDrop updates when filter prop changes', () => {
      const onReorder = jest.fn();
      const filter1 = makeFilter();

      const { result, rerender } = renderHook(
        ({ filter }) => useReorderContract({ filter, onReorder }),
        { initialProps: { filter: filter1 } }
      );

      expect(result.current.canDrop('r1', 'g1')).toBe(true);

      const filter2: Filter = {
        id: 'root',
        combinator: 'and',
        conditions: [{ id: 'r1', field: 'name', operator: 'equals', value: 'John' }],
      };

      rerender({ filter: filter2 });

      expect(result.current.canDrop('r1', 'g1')).toBe(false);
    });
  });
});
