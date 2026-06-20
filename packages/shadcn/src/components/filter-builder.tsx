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
} from '@x-filter/react';
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
  const { builder, viewModel, actions, slotProps, canMoveChild, moveChild, handleSortableMove } =
    useFilterBuilderOrchestrator({ value, defaultValue, onChange, schema, errors });
  const resolvedLabels = resolveLabels(labels);

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

  const renderGroup = (group: FilterGroupViewModel) => {
    const children = group.children.map((child, index) =>
      dnd ? (
        <SortableFilterItem key={child.id} id={child.id}>
          <div>
            <MoveControls
              canMoveChild={canMoveChild}
              child={child}
              dnd={dnd}
              group={group}
              index={index}
              moveChild={moveChild}
            />
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
