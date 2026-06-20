import { act, renderHook } from '@testing-library/react';
import type { Filter } from '@x-filter/core';
import { useFilterHistory } from '../use-filter-history';

function makeFilter(value: string): Filter {
  return {
    id: 'root',
    combinator: 'and',
    children: [{ id: 'r1', field: 'name', operator: 'contains', value }],
  };
}

const initial = makeFilter('a');

describe('useFilterHistory', () => {
  it('starts at the initial filter with no undo/redo available', () => {
    const { result } = renderHook(() => useFilterHistory({ initialFilter: initial }));

    expect(result.current.current).toBe(initial);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('pushes history on setFilter and enables undo', () => {
    const { result } = renderHook(() => useFilterHistory({ initialFilter: initial }));
    const next = makeFilter('b');

    act(() => result.current.setFilter(next));

    expect(result.current.current).toBe(next);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('undo walks back to previous states and enables redo', () => {
    const { result } = renderHook(() => useFilterHistory({ initialFilter: initial }));
    const b = makeFilter('b');
    const c = makeFilter('c');

    act(() => result.current.setFilter(b));
    act(() => result.current.setFilter(c));

    act(() => result.current.undo());
    expect(result.current.current).toBe(b);
    expect(result.current.canRedo).toBe(true);

    act(() => result.current.undo());
    expect(result.current.current).toBe(initial);
    expect(result.current.canUndo).toBe(false);
  });

  it('redo re-applies an undone change', () => {
    const { result } = renderHook(() => useFilterHistory({ initialFilter: initial }));
    const b = makeFilter('b');

    act(() => result.current.setFilter(b));
    act(() => result.current.undo());
    expect(result.current.current).toBe(initial);

    act(() => result.current.redo());
    expect(result.current.current).toBe(b);
    expect(result.current.canRedo).toBe(false);
  });

  it('clears the redo stack when a new edit is made after undo', () => {
    const { result } = renderHook(() => useFilterHistory({ initialFilter: initial }));
    const b = makeFilter('b');
    const c = makeFilter('c');

    act(() => result.current.setFilter(b));
    act(() => result.current.undo());
    expect(result.current.canRedo).toBe(true);

    act(() => result.current.setFilter(c));
    expect(result.current.current).toBe(c);
    expect(result.current.canRedo).toBe(false);
  });

  it('supports a functional updater', () => {
    const { result } = renderHook(() => useFilterHistory({ initialFilter: initial }));

    act(() =>
      result.current.setFilter((prev) => ({
        ...prev,
        children: [{ id: 'r1', field: 'name', operator: 'contains', value: 'z' }],
      }))
    );

    expect((result.current.current.children[0] as { value: string }).value).toBe('z');
    expect(result.current.canUndo).toBe(true);
  });

  it('ignores a no-op setFilter that returns the same reference', () => {
    const { result } = renderHook(() => useFilterHistory({ initialFilter: initial }));

    act(() => result.current.setFilter(initial));
    expect(result.current.canUndo).toBe(false);

    act(() => result.current.setFilter((prev) => prev));
    expect(result.current.canUndo).toBe(false);
  });

  it('drops the oldest entries beyond maxHistory', () => {
    const { result } = renderHook(() =>
      useFilterHistory({ initialFilter: initial, maxHistory: 2 })
    );

    act(() => result.current.setFilter(makeFilter('b')));
    act(() => result.current.setFilter(makeFilter('c')));
    act(() => result.current.setFilter(makeFilter('d')));

    // Only 2 prior states retained: 'c' and 'b'. Cannot reach the initial.
    act(() => result.current.undo());
    expect((result.current.current.children[0] as { value: string }).value).toBe('c');
    act(() => result.current.undo());
    expect((result.current.current.children[0] as { value: string }).value).toBe('b');
    expect(result.current.canUndo).toBe(false);
  });

  it('clear() empties history but keeps the current filter', () => {
    const { result } = renderHook(() => useFilterHistory({ initialFilter: initial }));
    const b = makeFilter('b');

    act(() => result.current.setFilter(b));
    act(() => result.current.clear());

    expect(result.current.current).toBe(b);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('falls back to an empty filter when no initial is provided', () => {
    const { result } = renderHook(() => useFilterHistory());
    expect(result.current.current).toBeDefined();
    expect(result.current.current.combinator).toBe('and');
    expect(result.current.canUndo).toBe(false);
  });
});
