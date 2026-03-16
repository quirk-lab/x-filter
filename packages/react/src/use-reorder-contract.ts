import type { FilterGroup } from '@x-filter/core';
import { moveRule as coreMoveRule, findById, isFilterGroup } from '@x-filter/core';
import { useCallback } from 'react';
import type { MoveOperation, UseReorderContractOptions, UseReorderContractReturn } from './types';

export function useReorderContract(options: UseReorderContractOptions): UseReorderContractReturn {
  const { filter, onReorder } = options;

  const moveItem = useCallback(
    (op: MoveOperation) => {
      const newFilter = coreMoveRule(filter, op.id, op.targetGroupId, op.targetIndex);
      onReorder(newFilter);
    },
    [filter, onReorder]
  );

  const canDrop = useCallback(
    (dragId: string, targetGroupId: string): boolean => {
      const dragNode = findById(filter, dragId);
      if (!dragNode) return false;

      if (isFilterGroup(dragNode)) {
        const isDescendant = (node: FilterGroup): boolean => {
          if (node.id === targetGroupId) return true;
          return node.conditions.some((c) => isFilterGroup(c) && isDescendant(c));
        };
        if (isDescendant(dragNode)) return false;
      }

      const targetNode = findById(filter, targetGroupId);
      return targetNode !== undefined && isFilterGroup(targetNode);
    },
    [filter]
  );

  return { moveItem, canDrop };
}
