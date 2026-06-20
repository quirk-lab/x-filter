import type { FieldSchema, Filter, ValidationError } from '@x-filter/core';
import type {
  FilterBuilderClassNames,
  FilterBuilderLabels,
  FilterBuilderSlots,
  FilterGroupViewModel,
  FilterNodeViewModel,
  FilterRuleViewModel,
} from '@x-filter/react';
import {
  canUseAtomicGroup,
  canUseAtomicRule,
  getDefaultRuleUpdatesForField,
  MoveControls,
  resolveLabels,
  useFilterBuilderOrchestrator,
  useFilterKeyboardNav,
  useIsMobile,
} from '@x-filter/react';
import { Button, Card, Space } from 'antd';
import { type ReactNode, useState } from 'react';
import { AntdCombinatorSelector } from './combinator-selector';
import { AntdDslEditor } from './dsl-editor';
import { AntdFieldSelector } from './field-selector';
import { AntdFilterGroup } from './group-block';
import { AntdNotToggle } from './not-toggle';
import { AntdOperatorSelector } from './operator-selector';
import { AntdFilterRule } from './rule-row';
import { SortableFilterContext, SortableFilterItem } from './sortable-context';
import { AntdValueEditor } from './value-editor';

export interface AntdFilterBuilderProps {
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
  /**
   * Renders a read-only view: every control is disabled, action buttons and the
   * DSL editor are hidden, and drag-and-drop is turned off. Useful for showing a
   * saved filter without allowing edits.
   */
  readOnly?: boolean;
}

export function AntdFilterBuilder({
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
  readOnly,
}: AntdFilterBuilderProps) {
  const { builder, viewModel, actions, slotProps, canMoveChild, moveChild, handleSortableMove } =
    useFilterBuilderOrchestrator({ value, defaultValue, onChange, schema, errors, readOnly });
  const resolvedLabels = resolveLabels(labels);
  // Drag-and-drop is an editing affordance; suppress it entirely in read-only.
  const dndEnabled = dnd && !readOnly;
  // On narrow viewports stack rule controls vertically (one per row).
  const isMobile = useIsMobile();
  // Two-step confirm for the destructive "Clear all" action.
  const [confirmingClear, setConfirmingClear] = useState(false);

  const rootId = viewModel.root.id;
  const keyboard = useFilterKeyboardNav({
    // The root group is structural and cannot be removed/cloned via keyboard.
    onDeleteNode: readOnly
      ? undefined
      : (id, kind) => {
          if (id === rootId) return;
          if (kind === 'group') actions.removeGroup(id);
          else actions.removeRule(id);
        },
    onCloneNode: readOnly
      ? undefined
      : (id, kind) => {
          if (id === rootId) return;
          if (kind === 'group') actions.cloneGroup(id);
          else actions.cloneRule(id);
        },
  });
  // Global pre-order index for roving tabindex; reset every render. The index is
  // claimed BEFORE rendering descendants so parents precede their children.
  let treeItemIndex = 0;

  // Wraps a node as an ARIA `treeitem` (the OUTERMOST wrapper of every node) so
  // interactive affordances rendered alongside it (e.g. the drag handle) stay
  // inside a treeitem rather than becoming disallowed direct children of the
  // `tree`. `renderInner` is a thunk so a node's index is claimed before its
  // descendants' (pre-order).
  const renderTreeItem = (node: FilterNodeViewModel, renderInner: () => ReactNode): ReactNode => {
    const index = treeItemIndex++;
    const inner = renderInner();
    const expanded = node.kind === 'group' && node.children.length > 0 ? true : undefined;
    const itemProps = keyboard.getItemProps(node.id, index, node.kind, {
      label: node.aria.label,
      expanded,
    });
    return (
      <div {...itemProps} key={node.id}>
        {inner}
      </div>
    );
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
          onClone={actions.cloneRule}
          onRemove={actions.removeRule}
        />
      );
    }

    const FieldSelector = slots?.FieldSelector;
    const OperatorSelector = slots?.OperatorSelector;
    const ValueEditor = slots?.ValueEditor;
    const locked = rule.locked;

    return (
      <Space
        aria-describedby={rule.aria.describedBy}
        aria-label={rule.aria.label}
        className={classNames?.rule}
        data-locked={locked || undefined}
        direction={isMobile ? 'vertical' : 'horizontal'}
        role="group"
        style={{ ...(isMobile ? { width: '100%' } : null), ...(locked ? { opacity: 0.6 } : null) }}
        wrap={!isMobile}
      >
        <AntdNotToggle
          checked={Boolean(rule.rule.not)}
          disabled={locked}
          label={labels?.not}
          onChange={(not) => actions.updateRule(rule.id, { not })}
        />
        {FieldSelector ? (
          FieldSelector({ ...slotProps, rule })
        ) : (
          <AntdFieldSelector
            className={classNames?.fieldSelector}
            disabled={locked}
            label={labels?.field}
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
          <AntdOperatorSelector
            className={classNames?.operatorSelector}
            disabled={locked}
            field={rule.field}
            label={labels?.operator}
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
            disabled={locked}
            endLabel={labels?.endValue}
            field={rule.field}
            label={labels?.value}
            noValueLabel={labels?.noValue}
            operator={rule.operator}
            rule={rule.rule}
            schema={builder.schema}
            startLabel={labels?.startValue}
            onChange={(nextValue) => actions.updateRule(rule.id, { value: nextValue })}
          />
        )}
        {locked ? null : (
          <span className={classNames?.actions}>
            <Button onClick={() => actions.cloneRule(rule.id)}>{resolvedLabels.cloneRule}</Button>
            <Button danger onClick={() => actions.removeRule(rule.id)}>
              {resolvedLabels.removeRule}
            </Button>
          </span>
        )}
      </Space>
    );
  };

  const renderNode = (node: FilterNodeViewModel): ReactNode => {
    if (node.kind === 'rule') {
      return renderRule(node);
    }

    return renderGroup(node);
  };

  const renderGroup = (group: FilterGroupViewModel): ReactNode => {
    const children = group.children.map((child, index) =>
      renderTreeItem(child, () =>
        dndEnabled ? (
          <SortableFilterItem id={child.id}>
            <MoveControls
              canMoveChild={canMoveChild}
              child={child}
              dnd={dndEnabled}
              group={group}
              index={index}
              moveChild={moveChild}
            />
            {renderNode(child)}
          </SortableFilterItem>
        ) : (
          renderNode(child)
        )
      )
    );
    const orderedChildren = dndEnabled ? (
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
    const locked = group.locked;

    if (canUseAtomicGroup(resolvedLabels, classNames)) {
      return (
        <AntdFilterGroup
          className={classNames?.group}
          group={group}
          onAddGroup={actions.addGroup}
          onAddRule={actions.addRule}
          onClone={isRoot ? undefined : actions.cloneGroup}
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
        data-locked={locked || undefined}
        role="group"
        size="small"
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space className={classNames?.actions} style={locked ? { opacity: 0.6 } : undefined} wrap>
            <AntdCombinatorSelector
              disabled={locked}
              label={labels?.combinator}
              value={'combinator' in group.group ? group.group.combinator : 'and'}
              onChange={(combinator) => actions.updateGroup(group.id, { combinator })}
            />
            <AntdNotToggle
              checked={Boolean(group.group.not)}
              disabled={locked}
              label={labels?.not}
              onChange={(not) => actions.updateGroup(group.id, { not })}
            />
            {locked ? null : (
              <>
                <Button onClick={() => actions.addRule(group.id)}>{resolvedLabels.addRule}</Button>
                <Button onClick={() => actions.addGroup(group.id)}>
                  {resolvedLabels.addGroup}
                </Button>
                {isRoot ? null : (
                  <Button onClick={() => actions.cloneGroup(group.id)}>
                    {resolvedLabels.cloneGroup}
                  </Button>
                )}
                {isRoot ? null : (
                  <Button danger onClick={() => actions.removeGroup(group.id)}>
                    {resolvedLabels.removeGroup}
                  </Button>
                )}
              </>
            )}
          </Space>
          {children.length > 0 ? <Space direction="vertical">{orderedChildren}</Space> : null}
        </Space>
      </Card>
    );
  };

  const hasChildren = viewModel.root.children.length > 0;
  // "Clear all" toolbar: a two-step confirm guards the destructive reset. Hidden
  // in read-only; the trigger is disabled when there is nothing to clear.
  const toolbar = readOnly ? null : (
    <Space style={{ width: '100%', justifyContent: 'flex-end' }} wrap>
      {confirmingClear ? (
        <>
          <Button
            danger
            type="primary"
            onClick={() => {
              actions.clear();
              setConfirmingClear(false);
            }}
          >
            {resolvedLabels.clearAllConfirm}
          </Button>
          <Button onClick={() => setConfirmingClear(false)}>{resolvedLabels.clearAllCancel}</Button>
        </>
      ) : (
        <Button disabled={!hasChildren} onClick={() => setConfirmingClear(true)}>
          {resolvedLabels.clearAll}
        </Button>
      )}
    </Space>
  );
  // Empty-state guide: nudges first-time users toward adding a rule.
  const emptyState =
    !readOnly && !hasChildren ? (
      <Card role="note" size="small">
        <Space direction="vertical" size="small" style={{ textAlign: 'center', width: '100%' }}>
          <strong>{resolvedLabels.emptyStateTitle}</strong>
          <span style={{ color: 'rgba(0,0,0,0.45)' }}>{resolvedLabels.emptyStateDescription}</span>
          <Button type="primary" onClick={() => actions.addRule(viewModel.root.id)}>
            {resolvedLabels.emptyStateAction}
          </Button>
        </Space>
      </Card>
    ) : null;

  // The root group is itself a treeitem so its header controls (and the DnD live
  // region) are shielded from the `tree`'s required-children check.
  const tree = renderTreeItem(viewModel.root, () => renderGroup(viewModel.root));
  // The tree region owns keyboard navigation; the DSL editor sits outside it so
  // its textarea is not treated as a tree node.
  const treeRegion = <div {...keyboard.containerProps}>{tree}</div>;
  const dslEditor =
    dsl && !readOnly ? (
      <AntdDslEditor
        className={classNames?.dslEditor}
        completionMenuClassName={classNames?.completionMenu}
        filter={builder.filter}
        labels={labels}
        schema={builder.schema}
        onCommit={builder.setFilter}
      />
    ) : null;
  const children = (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {toolbar}
      {dslEditor}
      {treeRegion}
      {emptyState}
    </Space>
  );

  if (slots?.Root) {
    return slots.Root({ ...slotProps, children });
  }

  return <div className={classNames?.root}>{children}</div>;
}
