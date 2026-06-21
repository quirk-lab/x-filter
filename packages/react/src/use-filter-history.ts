import type { Filter } from '@x-filter/core';
import { createFilter } from '@x-filter/core';
import { useCallback, useRef, useState } from 'react';
import type { UseFilterHistoryOptions, UseFilterHistoryReturn } from './types';

interface HistoryState {
  past: Filter[];
  present: Filter;
  future: Filter[];
}

/**
 * A self-contained undo/redo history stack for a filter.
 *
 * Wire `current` to a builder's `value` and `setFilter` to its `onChange`:
 * every committed change pushes the previous state onto the undo stack and
 * clears the redo stack (the standard past/present/future model). `maxHistory`
 * caps the undo depth so long editing sessions don't grow unbounded.
 *
 * State management only — keyboard shortcuts and toolbar buttons are left to
 * the consumer (see the Storybook "Undo / Redo" demo).
 */
export function useFilterHistory(options: UseFilterHistoryOptions = {}): UseFilterHistoryReturn {
  const { initialFilter, maxHistory = 50 } = options;

  // `maxHistory` is read inside functional state updaters; a ref keeps those
  // callbacks stable while always seeing the latest cap.
  const maxHistoryRef = useRef(maxHistory);
  maxHistoryRef.current = maxHistory;

  const [state, setState] = useState<HistoryState>(() => ({
    past: [],
    present: initialFilter ?? createFilter(),
    future: [],
  }));

  const setFilter = useCallback((filterOrUpdater: Filter | ((prev: Filter) => Filter)) => {
    setState((prev) => {
      const next =
        typeof filterOrUpdater === 'function'
          ? (filterOrUpdater as (p: Filter) => Filter)(prev.present)
          : filterOrUpdater;
      // Skip identical commits so they don't pollute the undo stack.
      if (next === prev.present) return prev;

      const cap = Math.max(0, maxHistoryRef.current);
      const past = [...prev.past, prev.present];
      const trimmed = past.length > cap ? past.slice(past.length - cap) : past;
      return { past: trimmed, present: next, future: [] };
    });
  }, []);

  const undo = useCallback(() => {
    setState((prev) => {
      if (prev.past.length === 0) return prev;
      const previous = prev.past[prev.past.length - 1];
      return {
        past: prev.past.slice(0, -1),
        present: previous,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState((prev) => {
      if (prev.future.length === 0) return prev;
      const [next, ...rest] = prev.future;
      return {
        past: [...prev.past, prev.present],
        present: next,
        future: rest,
      };
    });
  }, []);

  const clear = useCallback(() => {
    setState((prev) =>
      prev.past.length === 0 && prev.future.length === 0
        ? prev
        : { past: [], present: prev.present, future: [] }
    );
  }, []);

  return {
    current: state.present,
    setFilter,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    clear,
  };
}
