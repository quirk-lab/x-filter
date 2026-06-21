import { useMemo } from 'react';
import type {
  FilterBuilderActionHandlers,
  FilterBuilderSlotProps,
  FilterGroupViewModel,
  FilterNodeViewModel,
  UseFilterBuilderOrchestratorOptions,
  UseFilterBuilderOrchestratorReturn,
} from './types';
import { useFilterBuilder } from './use-filter-builder';
import { useFilterViewModel } from './use-filter-view-model';
import { useReorderContract } from './use-reorder-contract';

export function useFilterBuilderOrchestrator(
  options: UseFilterBuilderOrchestratorOptions
): UseFilterBuilderOrchestratorReturn {
  const { value, defaultValue, onChange, schema, errors, mode } = options;

  const builder = useFilterBuilder({ value, defaultValue, onChange, schema, mode });
  const viewModel = useFilterViewModel({
    filter: builder.filter,
    schema: builder.schema,
    errors,
  });
  const reorder = useReorderContract({ filter: builder.filter, onReorder: builder.setFilter });

  const actions = useMemo<FilterBuilderActionHandlers>(
    () => ({
      addRule: builder.addRule,
      removeRule: builder.removeRule,
      updateRule: builder.updateRule,
      addGroup: builder.addGroup,
      removeGroup: builder.removeGroup,
      updateGroup: builder.updateGroup,
      setCombinator: builder.setCombinator,
      cloneRule: builder.cloneRule,
      cloneGroup: builder.cloneGroup,
      moveItem: reorder.moveItem,
      canDrop: reorder.canDrop,
    }),
    [
      builder.addRule,
      builder.removeRule,
      builder.updateRule,
      builder.addGroup,
      builder.removeGroup,
      builder.updateGroup,
      builder.setCombinator,
      builder.cloneRule,
      builder.cloneGroup,
      reorder.moveItem,
      reorder.canDrop,
    ]
  );

  const slotProps: FilterBuilderSlotProps = useMemo(
    () => ({
      filter: builder.filter,
      schema: builder.schema,
      actions,
    }),
    [builder.filter, builder.schema, actions]
  );

  const canMoveChild = (
    group: FilterGroupViewModel,
    child: FilterNodeViewModel,
    targetIndex: number
  ): boolean => {
    return (
      targetIndex >= 0 && targetIndex < group.children.length && actions.canDrop(child.id, group.id)
    );
  };

  const moveChild = (
    group: FilterGroupViewModel,
    child: FilterNodeViewModel,
    index: number,
    direction: 'up' | 'down'
  ): void => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (!canMoveChild(group, child, targetIndex)) return;

    actions.moveItem({
      type: child.kind,
      id: child.id,
      targetGroupId: group.id,
      targetIndex: child.kind === 'group' && direction === 'down' ? index + 2 : targetIndex,
    });
  };

  const handleSortableMove = (
    group: FilterGroupViewModel,
    activeId: string,
    overId: string
  ): void => {
    const activeIndex = group.children.findIndex((child) => child.id === activeId);
    const overIndex = group.children.findIndex((child) => child.id === overId);
    if (activeIndex === -1 || overIndex === -1) return;

    const child = group.children[activeIndex];
    if (!actions.canDrop(child.id, group.id)) return;

    actions.moveItem({
      type: child.kind,
      id: child.id,
      targetGroupId: group.id,
      targetIndex: child.kind === 'group' && activeIndex < overIndex ? overIndex + 1 : overIndex,
    });
  };

  return {
    builder,
    viewModel,
    reorder,
    actions,
    slotProps,
    canMoveChild,
    moveChild,
    handleSortableMove,
  };
}
