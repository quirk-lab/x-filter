import type { FieldSchema, Filter } from '@x-filter/core';
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
import { useFilterBuilder, useFilterViewModel, useReorderContract } from '@x-filter/react';
import { Button, Card, Space } from 'antd';
import { useMemo } from 'react';
import { AntdCombinatorSelector } from './combinator-selector';
import { AntdDslEditor } from './dsl-editor';
import { AntdFieldSelector } from './field-selector';
import { AntdFilterGroup } from './group-block';
import { AntdNotToggle } from './not-toggle';
import { AntdOperatorSelector } from './operator-selector';
import { AntdFilterRule } from './rule-row';
import { SortableFilterContext } from './sortable-context';
import { AntdValueEditor } from './value-editor';

export interface AntdFilterBuilderProps {
  schema: FieldSchema[];
  value?: Filter;
  defaultValue?: Filter;
  onChange?: (filter: Filter) => void;
  slots?: FilterBuilderSlots;
  labels?: FilterBuilderLabels;
  classNames?: FilterBuilderClassNames;
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

export function AntdFilterBuilder({
  schema,
  value,
  defaultValue,
  onChange,
  slots,
  labels,
  classNames,
  dsl,
  dnd,
}: AntdFilterBuilderProps) {
  const builder = useFilterBuilder({ value, defaultValue, onChange, schema });
  const viewModel = useFilterViewModel({ filter: builder.filter, schema: builder.schema });
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
    [builder, reorder]
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
        <AntdFilterRule
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
      <Space
        aria-describedby={rule.aria.describedBy}
        aria-label={rule.aria.label}
        className={classNames?.rule}
        role="group"
        wrap
      >
        <AntdNotToggle
          checked={Boolean(rule.rule.not)}
          onChange={(not) => actions.updateRule(rule.id, { not })}
        />
        {FieldSelector ? (
          FieldSelector({ ...slotProps, rule })
        ) : (
          <AntdFieldSelector
            className={classNames?.fieldSelector}
            rule={rule.rule}
            schema={builder.schema}
            onChange={(field) => actions.updateRule(rule.id, { field })}
          />
        )}
        {OperatorSelector ? (
          OperatorSelector({ ...slotProps, rule })
        ) : (
          <AntdOperatorSelector
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
          <AntdValueEditor
            className={classNames?.valueEditor}
            field={rule.field}
            operator={rule.operator}
            rule={rule.rule}
            schema={builder.schema}
            onChange={(nextValue) => actions.updateRule(rule.id, { value: nextValue })}
          />
        )}
        <span className={classNames?.actions}>
          <Button danger onClick={() => actions.removeRule(rule.id)}>
            {resolvedLabels.removeRule}
          </Button>
        </span>
      </Space>
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
    const children = group.children.map((child, index) => (
      <div key={child.id}>
        {dnd ? (
          <div>
            {renderMoveControls(group, child, index)}
            {renderNode(child)}
          </div>
        ) : (
          renderNode(child)
        )}
      </div>
    ));
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
        <AntdFilterGroup
          className={classNames?.group}
          group={group}
          onAddGroup={actions.addGroup}
          onAddRule={actions.addRule}
          onCombinatorChange={(groupId, combinator) => actions.updateGroup(groupId, { combinator })}
          onNotChange={(groupId, not) => actions.updateGroup(groupId, { not })}
          onRemove={isRoot ? undefined : actions.removeGroup}
        >
          {orderedChildren}
        </AntdFilterGroup>
      );
    }

    return (
      <Card
        aria-describedby={group.aria.describedBy}
        aria-label={group.aria.label}
        className={classNames?.group}
        role="group"
        size="small"
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space className={classNames?.actions} wrap>
            <AntdCombinatorSelector
              value={group.group.combinator}
              onChange={(combinator) => actions.updateGroup(group.id, { combinator })}
            />
            <AntdNotToggle
              checked={Boolean(group.group.not)}
              onChange={(not) => actions.updateGroup(group.id, { not })}
            />
            <Button onClick={() => actions.addRule(group.id)}>{resolvedLabels.addRule}</Button>
            <Button onClick={() => actions.addGroup(group.id)}>{resolvedLabels.addGroup}</Button>
            {isRoot ? null : (
              <Button danger onClick={() => actions.removeGroup(group.id)}>
                {resolvedLabels.removeGroup}
              </Button>
            )}
          </Space>
          {children.length > 0 ? <Space direction="vertical">{orderedChildren}</Space> : null}
        </Space>
      </Card>
    );
  };

  const tree = renderGroup(viewModel.root);
  const dslEditor = dsl ? (
    <AntdDslEditor
      className={classNames?.dslEditor}
      completionMenuClassName={classNames?.completionMenu}
      filter={builder.filter}
      labels={labels}
      schema={builder.schema}
      onCommit={builder.setFilter}
    />
  ) : null;
  const children = dslEditor ? (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {dslEditor}
      {tree}
    </Space>
  ) : (
    tree
  );

  if (slots?.Root) {
    return slots.Root({ ...slotProps, children });
  }

  return <div className={classNames?.root}>{children}</div>;
}
