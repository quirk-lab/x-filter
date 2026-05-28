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
import { useMemo } from 'react';
import { ShadcnCombinatorSelector } from './combinator-selector';
import { ShadcnDslEditor } from './dsl-editor';
import { ShadcnFieldSelector } from './field-selector';
import { ShadcnFilterGroup } from './group-block';
import { ShadcnNotToggle } from './not-toggle';
import { ShadcnOperatorSelector } from './operator-selector';
import { Button, Card, cn } from './primitives';
import { ShadcnFilterRule } from './rule-row';
import { ShadcnValueEditor } from './value-editor';

export interface ShadcnFilterBuilderProps {
  schema: FieldSchema[];
  value?: Filter;
  defaultValue?: Filter;
  onChange?: (filter: Filter) => void;
  slots?: FilterBuilderSlots;
  labels?: FilterBuilderLabels;
  classNames?: FilterBuilderClassNames;
  dsl?: boolean;
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
  dsl,
}: ShadcnFilterBuilderProps) {
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
            onChange={(field) => actions.updateRule(rule.id, { field })}
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
    const children = group.children.map((child) => <div key={child.id}>{renderNode(child)}</div>);

    if (slots?.Group) {
      return slots.Group({ ...slotProps, group, children });
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
          {children}
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
          {children.length > 0 ? <div className="flex flex-col gap-3">{children}</div> : null}
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
