import type { FieldSchema, Filter, FilterAny, ValidationError } from '@x-filter/core';
import type {
  FilterBuilderClassNames,
  FilterBuilderLabels,
  FilterBuilderMode,
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
import type { ReactNode } from 'react';
import { ShadcnCombinatorSelector } from './combinator-selector';
import { ShadcnDslEditor } from './dsl-editor';
import { ShadcnFieldSelector } from './field-selector';
import { ShadcnFilterGroup } from './group-block';
import { ShadcnInlineCombinator } from './inline-combinator';
import { ShadcnNotToggle } from './not-toggle';
import { ShadcnOperatorSelector } from './operator-selector';
import { Button, Card, cn } from './primitives';
import { ShadcnFilterRule } from './rule-row';
import { SortableFilterContext, SortableFilterItem } from './sortable-context';
import { ShadcnValueEditor } from './value-editor';

export interface ShadcnFilterBuilderProps {
  schema: FieldSchema[];
  value?: FilterAny;
  defaultValue?: FilterAny;
  onChange?: (filter: Filter) => void;
  slots?: FilterBuilderSlots;
  labels?: FilterBuilderLabels;
  classNames?: FilterBuilderClassNames;
  errors?: Record<string, ValidationError[]>;
  dsl?: boolean;
  dnd?: boolean;
  /** `'ic'` renders editable inline combinators between rules. Defaults to `'standard'`. */
  mode?: FilterBuilderMode;
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
  mode,
}: ShadcnFilterBuilderProps) {
  const { builder, viewModel, actions, slotProps, canMoveChild, moveChild, handleSortableMove } =
    useFilterBuilderOrchestrator({ value, defaultValue, onChange, schema, errors, mode });
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
      <fieldset
        aria-describedby={rule.aria.describedBy}
        aria-label={rule.aria.label}
        className={cn(
          'flex flex-wrap items-center gap-2',
          locked && 'opacity-60',
          classNames?.rule
        )}
        data-locked={locked || undefined}
      >
        <ShadcnNotToggle
          checked={Boolean(rule.rule.not)}
          disabled={locked}
          label={labels?.not}
          onChange={(not) => actions.updateRule(rule.id, { not })}
        />
        {FieldSelector ? (
          FieldSelector({ ...slotProps, rule })
        ) : (
          <ShadcnFieldSelector
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
          <ShadcnOperatorSelector
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
          <ShadcnValueEditor
            className={classNames?.valueEditor}
            disabled={locked}
            endLabel={labels?.endValue}
            errorId={rule.aria.describedBy}
            errors={rule.errors}
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
            <Button variant="outline" onClick={() => actions.cloneRule(rule.id)}>
              {resolvedLabels.cloneRule}
            </Button>
            <Button variant="destructive" onClick={() => actions.removeRule(rule.id)}>
              {resolvedLabels.removeRule}
            </Button>
          </span>
        )}
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
    // IC groups carry per-position combinators; render them interleaved between
    // rules (and skip DnD, which is a standard-mode concern).
    const isIC = group.combinators !== undefined;
    if (isIC) {
      const combinators = group.combinators ?? [];
      const interleaved: ReactNode[] = [];
      group.children.forEach((child, index) => {
        if (index > 0) {
          const comboIndex = index - 1;
          interleaved.push(
            <ShadcnInlineCombinator
              key={`combinator-${child.id}`}
              label={labels?.combinator}
              value={combinators[comboIndex] ?? 'and'}
              onChange={(combinator) => actions.setCombinator(group.id, comboIndex, combinator)}
            />
          );
        }
        interleaved.push(<div key={child.id}>{renderNode(child)}</div>);
      });
      return renderGroupShell(group, interleaved, group.children.length > 0);
    }

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

    return renderGroupShell(group, orderedChildren, children.length > 0);
  };

  const renderGroupShell = (
    group: FilterGroupViewModel,
    orderedChildren: ReactNode,
    hasChildren: boolean
  ) => {
    const isIC = group.combinators !== undefined;

    if (slots?.Group) {
      return slots.Group({ ...slotProps, group, children: orderedChildren });
    }

    const isRoot = group.id === viewModel.root.id;
    const locked = group.locked;

    if (!isIC && canUseAtomicGroup(resolvedLabels, classNames)) {
      return (
        <ShadcnFilterGroup
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
        </ShadcnFilterGroup>
      );
    }

    return (
      <Card
        aria-describedby={group.aria.describedBy}
        aria-label={group.aria.label}
        className={classNames?.group}
        data-locked={locked || undefined}
        role="group"
      >
        <div className="flex flex-col gap-4">
          <div
            className={cn(
              'flex flex-wrap items-center gap-2',
              locked && 'opacity-60',
              classNames?.actions
            )}
          >
            {isIC ? null : (
              <ShadcnCombinatorSelector
                disabled={locked}
                label={labels?.combinator}
                value={'combinator' in group.group ? group.group.combinator : 'and'}
                onChange={(combinator) => actions.updateGroup(group.id, { combinator })}
              />
            )}
            <ShadcnNotToggle
              checked={Boolean(group.group.not)}
              disabled={locked}
              label={labels?.not}
              onChange={(not) => actions.updateGroup(group.id, { not })}
            />
            {locked ? null : (
              <>
                <Button variant="outline" onClick={() => actions.addRule(group.id)}>
                  {resolvedLabels.addRule}
                </Button>
                <Button variant="outline" onClick={() => actions.addGroup(group.id)}>
                  {resolvedLabels.addGroup}
                </Button>
                {isRoot ? null : (
                  <Button variant="outline" onClick={() => actions.cloneGroup(group.id)}>
                    {resolvedLabels.cloneGroup}
                  </Button>
                )}
                {isRoot ? null : (
                  <Button variant="destructive" onClick={() => actions.removeGroup(group.id)}>
                    {resolvedLabels.removeGroup}
                  </Button>
                )}
              </>
            )}
          </div>
          {hasChildren ? <div className="flex flex-col gap-3">{orderedChildren}</div> : null}
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
