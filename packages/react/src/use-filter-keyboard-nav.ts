import type React from 'react';
import { useCallback, useRef, useState } from 'react';
import type {
  FilterKeyboardNavItemOptions,
  FilterKeyboardNavItemProps,
  UseFilterKeyboardNavOptions,
  UseFilterKeyboardNavReturn,
} from './types';

const FOCUSABLE = 'input, select, textarea, button';

/**
 * Roving-tabindex keyboard navigation for the builder tree.
 *
 * Treeitems (rule rows and groups) are registered via {@link getItemProps}.
 * The container handler (spread {@link containerProps}) implements the WAI-ARIA
 * tree keys:
 * - Arrow Up/Down — move row focus to the previous/next treeitem (DOM order)
 * - Home/End — first/last treeitem
 * - Enter — move focus into the focused row's first control
 * - Escape — return focus from a control back to its row
 * - Delete/Backspace — delete the focused node (via `onDeleteNode`)
 * - Ctrl/Cmd+D — clone the focused node (via `onCloneNode`)
 *
 * Navigation/mutation keys only fire when a row (not one of its controls) holds
 * focus, so typing inside inputs is never hijacked.
 */
export function useFilterKeyboardNav(
  options: UseFilterKeyboardNavOptions = {}
): UseFilterKeyboardNavReturn {
  const { onDeleteNode, onCloneNode, label = 'Filter tree' } = options;
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const getItems = useCallback((): HTMLElement[] => {
    const container = containerRef.current;
    if (!container) return [];
    return Array.from(container.querySelectorAll<HTMLElement>('[data-node-id][role="treeitem"]'));
  }, []);

  const focusItemAt = useCallback((items: HTMLElement[], index: number) => {
    if (items.length === 0) return;
    const clamped = Math.max(0, Math.min(index, items.length - 1));
    const target = items[clamped];
    target.focus();
    setActiveId(target.getAttribute('data-node-id'));
  }, []);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const items = getItems();
      if (items.length === 0) return;

      const active = (
        typeof document !== 'undefined' ? document.activeElement : null
      ) as HTMLElement | null;
      const rowIndex = active ? items.indexOf(active) : -1;

      if (rowIndex === -1) {
        // Focus is inside a control (or elsewhere): only Escape pops back to row.
        if (event.key === 'Escape' && active) {
          // Use the NEAREST treeitem ancestor: an outer treeitem (e.g. the root
          // group) also `contains` the control, so a flat search would pop focus
          // too far up the tree.
          const owningRow = active.closest<HTMLElement>('[data-node-id][role="treeitem"]');
          if (owningRow && containerRef.current?.contains(owningRow)) {
            event.preventDefault();
            owningRow.focus();
            setActiveId(owningRow.getAttribute('data-node-id'));
          }
        }
        return;
      }

      const row = items[rowIndex];
      const nodeId = row.getAttribute('data-node-id');
      const nodeKind = row.getAttribute('data-node-kind') === 'group' ? 'group' : 'rule';

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          focusItemAt(items, rowIndex + 1);
          break;
        case 'ArrowUp':
          event.preventDefault();
          focusItemAt(items, rowIndex - 1);
          break;
        case 'Home':
          event.preventDefault();
          focusItemAt(items, 0);
          break;
        case 'End':
          event.preventDefault();
          focusItemAt(items, items.length - 1);
          break;
        case 'Enter': {
          event.preventDefault();
          row.querySelector<HTMLElement>(FOCUSABLE)?.focus();
          break;
        }
        case 'Delete':
        case 'Backspace':
          if (nodeId && onDeleteNode) {
            event.preventDefault();
            onDeleteNode(nodeId, nodeKind);
          }
          break;
        case 'd':
        case 'D':
          if ((event.ctrlKey || event.metaKey) && nodeId && onCloneNode) {
            event.preventDefault();
            onCloneNode(nodeId, nodeKind);
          }
          break;
        default:
          break;
      }
    },
    [getItems, focusItemAt, onDeleteNode, onCloneNode]
  );

  const getItemProps = useCallback(
    (
      nodeId: string,
      index: number,
      kind: 'rule' | 'group',
      itemOptions?: FilterKeyboardNavItemOptions
    ): FilterKeyboardNavItemProps => ({
      role: 'treeitem',
      tabIndex: (activeId === null ? index === 0 : activeId === nodeId) ? 0 : -1,
      'data-node-id': nodeId,
      'data-node-kind': kind,
      'aria-selected': activeId === nodeId,
      'aria-label': itemOptions?.label,
      'aria-expanded': itemOptions?.expanded,
      // Only react when the treeitem itself is focused. `focus` bubbles, so
      // focusing a control inside a row would otherwise also mark every
      // ancestor treeitem (e.g. the root group) selected.
      onFocus: (event) => {
        if (event.target === event.currentTarget) setActiveId(nodeId);
      },
    }),
    [activeId]
  );

  return {
    containerRef,
    containerProps: { ref: containerRef, role: 'tree', 'aria-label': label, onKeyDown },
    getItemProps,
    activeId,
  };
}
