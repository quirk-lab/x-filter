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
  useFilterKeyboardNav,
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
  /**
   * Renders a read-only view: every control is disabled, action buttons and the
   * DSL editor are hidden, and drag-and-drop is turned off. Useful for showing a
   * saved filter without allowing edits.
   */
  readOnly?: boolean;
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
  readOnly,
}: ShadcnFilterBuilderProps) {
  const { builder, viewModel, actions, slotProps, canMoveChild, moveChild, handleSortableMove } =
    useFilterBuilderOrchestrator({ value, defaultValue, onChange, schema, errors, mode, readOnly });
  const resolvedLabels = resolveLabels(labels);
  // Drag-and-drop is an editing affordance; suppress it entirely in read-only.
  const dndEnabled = dnd && !readOnly;

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

  // Wraps a node as an ARIA `treeitem`. The treeitem must be the OUTERMOST
  // wrapper of every node so that interactive affordances rendered alongside the
  // node (e.g. the drag handle) live inside a treeitem and never become direct,
  // disallowed children of the `tree`. `renderInner` is a thunk so the node's
  // own index is claimed before its descendants' (pre-order).
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

  const renderNode = (node: FilterNodeViewModel): ReactNode => {
    if (node.kind === 'rule') {
      return renderRule(node);
    }

    return renderGroup(node);
  };

  const renderGroup = (group: FilterGroupViewModel): ReactNode => {
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
        interleaved.push(renderTreeItem(child, () => renderNode(child)));
      });
      return renderGroupShell(group, interleaved, group.children.length > 0);
    }

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

  // The root group is itself a treeitem so its header controls (and the DnD live
  // region) are shielded from the `tree`'s required-children check.
  const tree = renderTreeItem(viewModel.root, () => renderGroup(viewModel.root));
  // The tree region owns keyboard navigation; the DSL editor sits outside it so
  // its textarea is not treated as a tree node.
  const treeRegion = <div {...keyboard.containerProps}>{tree}</div>;
  const dslEditor =
    dsl && !readOnly ? (
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
      {treeRegion}
    </div>
  ) : (
    treeRegion
  );

  if (slots?.Root) {
    return slots.Root({ ...slotProps, children });
  }

  return <div className={classNames?.root}>{children}</div>;
}
