import type { FilterGroup } from '@x-filter/core';
import { moveRule as coreMoveRule, findById, isFilterGroup } from '@x-filter/core';
import { useCallback } from 'react';
import type { MoveOperation, UseReorderContractOptions, UseReorderContractReturn } from './types';

function removeGroupFromTree(
  root: FilterGroup,
  groupId: string
):
  | { root: FilterGroup; removed: undefined; sourceGroupId: undefined; sourceIndex: undefined }
  | { root: FilterGroup; removed: FilterGroup; sourceGroupId: string; sourceIndex: number } {
  const directIndex = root.conditions.findIndex(
    (condition) => isFilterGroup(condition) && condition.id === groupId
  );
  if (directIndex !== -1) {
    const removed = root.conditions[directIndex];
    if (!isFilterGroup(removed)) {
      return { root, removed: undefined, sourceGroupId: undefined, sourceIndex: undefined };
    }
    return {
      root: {
        ...root,
        conditions: root.conditions.filter((_, index) => index !== directIndex),
      },
      removed,
      sourceGroupId: root.id,
      sourceIndex: directIndex,
    };
  }

  for (let index = 0; index < root.conditions.length; index++) {
    const condition = root.conditions[index];
    if (!isFilterGroup(condition)) continue;

    const result = removeGroupFromTree(condition, groupId);
    if (!result.removed) continue;

    const newConditions = [...root.conditions];
    newConditions[index] = result.root;
    return {
      root: { ...root, conditions: newConditions },
      removed: result.removed,
      sourceGroupId: result.sourceGroupId,
      sourceIndex: result.sourceIndex,
    };
  }

  return { root, removed: undefined, sourceGroupId: undefined, sourceIndex: undefined };
}

function insertGroupIntoTree(
  root: FilterGroup,
  targetGroupId: string,
  group: FilterGroup,
  targetIndex: number
): { root: FilterGroup; inserted: boolean } {
  if (root.id === targetGroupId) {
    const nextConditions = [...root.conditions];
    const safeIndex = Math.min(Math.max(targetIndex, 0), nextConditions.length);
    nextConditions.splice(safeIndex, 0, group);
    return { root: { ...root, conditions: nextConditions }, inserted: true };
  }

  for (let index = 0; index < root.conditions.length; index++) {
    const condition = root.conditions[index];
    if (!isFilterGroup(condition)) continue;

    const result = insertGroupIntoTree(condition, targetGroupId, group, targetIndex);
    if (!result.inserted) continue;

    const newConditions = [...root.conditions];
    newConditions[index] = result.root;
    return { root: { ...root, conditions: newConditions }, inserted: true };
  }

  return { root, inserted: false };
}

function moveGroup(
  filter: FilterGroup,
  groupId: string,
  targetGroupId: string,
  targetIndex: number
): FilterGroup {
  if (filter.id === groupId) {
    throw new Error('Cannot move root group');
  }

  const removedResult = removeGroupFromTree(filter, groupId);
  if (!removedResult.removed) {
    throw new Error(`Group not found: ${groupId}`);
  }

  let insertIndex = targetIndex;
  if (removedResult.sourceGroupId === targetGroupId && removedResult.sourceIndex < targetIndex) {
    insertIndex -= 1;
  }

  const insertedResult = insertGroupIntoTree(
    removedResult.root,
    targetGroupId,
    removedResult.removed,
    insertIndex
  );
  if (!insertedResult.inserted) {
    throw new Error(`Target group not found: ${targetGroupId}`);
  }

  return insertedResult.root;
}

export function useReorderContract(options: UseReorderContractOptions): UseReorderContractReturn {
  const { filter, onReorder } = options;

  const moveItem = useCallback(
    (op: MoveOperation) => {
      const newFilter =
        op.type === 'group'
          ? moveGroup(filter, op.id, op.targetGroupId, op.targetIndex)
          : coreMoveRule(filter, op.id, op.targetGroupId, op.targetIndex);
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
