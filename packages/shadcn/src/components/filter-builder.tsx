import type { FieldSchema, Filter, ValidationError } from '@x-filter/core';
import type {
  FilterBuilderActionHandlers,
  FilterBuilderClassNames,
  FilterBuilderLabels,
  FilterBuilderSlotProps,
  FilterBuilderSlots,
  FilterGroupViewModel,
  FilterNodeViewModel,
  FilterRuleViewModel,
} from '@x-filter/react';
import {
  getDefaultRuleUpdatesForField,
  useFilterBuilder,
  useFilterViewModel,
  useReorderContract,
} from '@x-filter/react';
import { useMemo } from 'react';
import { ShadcnCombinatorSelector } from './combinator-selector';
import { ShadcnDslEditor } from './dsl-editor';
import { ShadcnFieldSelector } from './field-selector';
import { ShadcnFilterGroup } from './group-block';
import { ShadcnNotToggle } from './not-toggle';
import { ShadcnOperatorSelector } from './operator-selector';
import { Button, Card, cn } from './primitives';
import { ShadcnFilterRule } from './rule-row';
import { SortableFilterContext, SortableFilterItem } from './sortable-context';
import { ShadcnValueEditor } from './value-editor';

export interface ShadcnFilterBuilderProps {
  schema: FieldSchema[];
  value?: Filter;
  defaultValue?: Filter;
  onChange?: (filter: Filter) => void;
  slots?: FilterBuilderSlots;
  labels?: FilterBuilderLabels;
  classNames?: FilterBuilderClassNames;
  errors?: Record<string, ValidationError[]>;
  dsl?: boolean;
  dnd?: boolean;
}

const DEFAULT_LABELS = {
  addRule: 'Add rule',
  addGroup: 'Add group',
  removeRule: 'Remove rule',
  removeGroup: 'Remove group',
} satisfies Required<
  Pick<FilterBuilderLabels, 'addRule' | 'addGroup' | 'removeRule' | 'removeGroup'>
>;

function canUseAtomicGroup(labels: typeof DEFAULT_LABELS, classNames?: FilterBuilderClassNames) {
  return (
    labels.addRule === DEFAULT_LABELS.addRule &&
    labels.addGroup === DEFAULT_LABELS.addGroup &&
    labels.removeGroup === DEFAULT_LABELS.removeGroup &&
    !classNames?.actions
  );
}

function canUseAtomicRule(
  labels: typeof DEFAULT_LABELS,
  slots?: FilterBuilderSlots,
  classNames?: FilterBuilderClassNames
) {
  return (
    labels.removeRule === DEFAULT_LABELS.removeRule &&
    !slots?.FieldSelector &&
    !slots?.OperatorSelector &&
    !slots?.ValueEditor &&
    !classNames?.fieldSelector &&
    !classNames?.operatorSelector &&
    !classNames?.valueEditor &&
    !classNames?.actions
  );
}

export function ShadcnFilterBuilder({
  schema,
  value,
  defaultValue,
  onChange,
  slots,
  labels,
  classNames,
  errors,
  dsl,
  dnd,
}: ShadcnFilterBuilderProps) {
  const builder = useFilterBuilder({ value, defaultValue, onChange, schema });
  const viewModel = useFilterViewModel({ filter: builder.filter, schema: builder.schema, errors });
  const reorder = useReorderContract({ filter: builder.filter, onReorder: builder.setFilter });
  const resolvedLabels = {
    addRule: labels?.addRule ?? DEFAULT_LABELS.addRule,
    addGroup: labels?.addGroup ?? DEFAULT_LABELS.addGroup,
    removeRule: labels?.removeRule ?? DEFAULT_LABELS.removeRule,
    removeGroup: labels?.removeGroup ?? DEFAULT_LABELS.removeGroup,
  };

  const actions = useMemo<FilterBuilderActionHandlers>(
    () => ({
      addRule: builder.addRule,
      removeRule: builder.removeRule,
      updateRule: builder.updateRule,
      addGroup: builder.addGroup,
      removeGroup: builder.removeGroup,
      updateGroup: builder.updateGroup,
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
      reorder.moveItem,
      reorder.canDrop,
    ]
  );

  const slotProps: FilterBuilderSlotProps = {
    filter: builder.filter,
    schema: builder.schema,
    actions,
  };

  const renderRule = (rule: FilterRuleViewModel) => {
    if (slots?.Rule) {
      return slots.Rule({ ...slotProps, rule });
    }

    if (canUseAtomicRule(resolvedLabels, slots, classNames)) {
      return (
        <ShadcnFilterRule
          className={classNames?.rule}
          rule={rule}
          schema={builder.schema}
          onChange={actions.updateRule}
          onRemove={actions.removeRule}
        />
      );
    }

    const FieldSelector = slots?.FieldSelector;
    const OperatorSelector = slots?.OperatorSelector;
    const ValueEditor = slots?.ValueEditor;

    return (
      <fieldset
        aria-describedby={rule.aria.describedBy}
        aria-label={rule.aria.label}
        className={cn('flex flex-wrap items-center gap-2', classNames?.rule)}
      >
        <ShadcnNotToggle
          checked={Boolean(rule.rule.not)}
          onChange={(not) => actions.updateRule(rule.id, { not })}
        />
        {FieldSelector ? (
          FieldSelector({ ...slotProps, rule })
        ) : (
          <ShadcnFieldSelector
            className={classNames?.fieldSelector}
            rule={rule.rule}
            schema={builder.schema}
            onChange={(field) =>
              actions.updateRule(rule.id, getDefaultRuleUpdatesForField(builder.schema, field))
            }
          />
        )}
        {OperatorSelector ? (
          OperatorSelector({ ...slotProps, rule })
        ) : (
          <ShadcnOperatorSelector
            className={classNames?.operatorSelector}
            field={rule.field}
            rule={rule.rule}
            schema={builder.schema}
            onChange={(operator) => actions.updateRule(rule.id, { operator })}
          />
        )}
        {ValueEditor ? (
          ValueEditor({ ...slotProps, rule })
        ) : (
          <ShadcnValueEditor
            className={classNames?.valueEditor}
            field={rule.field}
            operator={rule.operator}
            rule={rule.rule}
            schema={builder.schema}
            onChange={(nextValue) => actions.updateRule(rule.id, { value: nextValue })}
          />
        )}
        <span className={classNames?.actions}>
          <Button variant="destructive" onClick={() => actions.removeRule(rule.id)}>
            {resolvedLabels.removeRule}
          </Button>
        </span>
      </fieldset>
    );
  };

  const renderNode = (node: FilterNodeViewModel) => {
    if (node.kind === 'rule') {
      return renderRule(node);
    }

    return renderGroup(node);
  };

  const canMoveChild = (
    group: FilterGroupViewModel,
    child: FilterNodeViewModel,
    targetIndex: number
  ) => {
    return (
      targetIndex >= 0 && targetIndex < group.children.length && actions.canDrop(child.id, group.id)
    );
  };

  const moveChild = (
    group: FilterGroupViewModel,
    child: FilterNodeViewModel,
    index: number,
    direction: 'up' | 'down'
  ) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (!canMoveChild(group, child, targetIndex)) return;

    actions.moveItem({
      type: child.kind,
      id: child.id,
      targetGroupId: group.id,
      targetIndex: child.kind === 'group' && direction === 'down' ? index + 2 : targetIndex,
    });
  };

  const handleSortableMove = (group: FilterGroupViewModel, activeId: string, overId: string) => {
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

  const renderMoveControls = (
    group: FilterGroupViewModel,
    child: FilterNodeViewModel,
    index: number
  ) => {
    if (!dnd) return null;

    const canMoveUp = canMoveChild(group, child, index - 1);
    const canMoveDown = canMoveChild(group, child, index + 1);

    return (
      <span>
        <button
          aria-label={`Move ${child.id} up`}
          disabled={!canMoveUp}
          type="button"
          onClick={() => moveChild(group, child, index, 'up')}
        >
          Move {child.id} up
        </button>
        <button
          aria-label={`Move ${child.id} down`}
          disabled={!canMoveDown}
          type="button"
          onClick={() => moveChild(group, child, index, 'down')}
        >
          Move {child.id} down
        </button>
      </span>
    );
  };

  const renderGroup = (group: FilterGroupViewModel) => {
    const children = group.children.map((child, index) =>
      dnd ? (
        <SortableFilterItem key={child.id} id={child.id}>
          <div>
            {renderMoveControls(group, child, index)}
            {renderNode(child)}
          </div>
        </SortableFilterItem>
      ) : (
        <div key={child.id}>{renderNode(child)}</div>
      )
    );
    const orderedChildren = dnd ? (
      <SortableFilterContext
        items={group.children.map((child) => child.id)}
        onMove={(activeId, overId) => handleSortableMove(group, activeId, overId)}
      >
        {children}
      </SortableFilterContext>
    ) : (
      children
    );

    if (slots?.Group) {
      return slots.Group({ ...slotProps, group, children: orderedChildren });
    }

    const isRoot = group.id === viewModel.root.id;

    if (canUseAtomicGroup(resolvedLabels, classNames)) {
      return (
        <ShadcnFilterGroup
          className={classNames?.group}
          group={group}
          onAddGroup={actions.addGroup}
          onAddRule={actions.addRule}
          onCombinatorChange={(groupId, combinator) => actions.updateGroup(groupId, { combinator })}
          onNotChange={(groupId, not) => actions.updateGroup(groupId, { not })}
          onRemove={isRoot ? undefined : actions.removeGroup}
        >
          {orderedChildren}
        </ShadcnFilterGroup>
      );
    }

    return (
      <Card
        aria-describedby={group.aria.describedBy}
        aria-label={group.aria.label}
        className={classNames?.group}
        role="group"
      >
        <div className="flex flex-col gap-4">
          <div className={cn('flex flex-wrap items-center gap-2', classNames?.actions)}>
            <ShadcnCombinatorSelector
              value={group.group.combinator}
              onChange={(combinator) => actions.updateGroup(group.id, { combinator })}
            />
            <ShadcnNotToggle
              checked={Boolean(group.group.not)}
              onChange={(not) => actions.updateGroup(group.id, { not })}
            />
            <Button variant="outline" onClick={() => actions.addRule(group.id)}>
              {resolvedLabels.addRule}
            </Button>
            <Button variant="outline" onClick={() => actions.addGroup(group.id)}>
              {resolvedLabels.addGroup}
            </Button>
            {isRoot ? null : (
              <Button variant="destructive" onClick={() => actions.removeGroup(group.id)}>
                {resolvedLabels.removeGroup}
              </Button>
            )}
          </div>
          {children.length > 0 ? (
            <div className="flex flex-col gap-3">{orderedChildren}</div>
          ) : null}
        </div>
      </Card>
    );
  };

  const tree = renderGroup(viewModel.root);
  const dslEditor = dsl ? (
    <ShadcnDslEditor
      className={classNames?.dslEditor}
      completionMenuClassName={classNames?.completionMenu}
      filter={builder.filter}
      labels={labels}
      schema={builder.schema}
      onCommit={builder.setFilter}
    />
  ) : null;
  const children = dslEditor ? (
    <div className="flex flex-col gap-4">
      {dslEditor}
      {tree}
    </div>
  ) : (
    tree
  );

  if (slots?.Root) {
    return slots.Root({ ...slotProps, children });
  }

  return <div className={classNames?.root}>{children}</div>;
}
