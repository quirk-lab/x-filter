import type { FieldSchema, FilterRule } from '@x-filter/core';
import type { FilterRuleViewModel } from '@x-filter/react';
import { getDefaultRuleUpdatesForField } from '@x-filter/react';
import { memo } from 'react';
import { ShadcnFieldSelector } from './field-selector';
import { ShadcnNotToggle } from './not-toggle';
import { ShadcnOperatorSelector } from './operator-selector';
import { Button, cn } from './primitives';
import { ShadcnValueEditor } from './value-editor';

export interface ShadcnFilterRuleProps {
  schema: FieldSchema[];
  rule: FilterRuleViewModel;
  className?: string;
  onChange: (ruleId: string, updates: Partial<Omit<FilterRule, 'id'>>) => void;
  onRemove: (ruleId: string) => void;
  onClone?: (ruleId: string) => void;
}

/**
 * Memoized atomic rule row. Skips re-render when `rule` (the ViewModel),
 * `schema`, `className`, `onChange`, and `onRemove` are all `===` — which is
 * exactly what `useFilterViewModel`'s identity cache + `useFilterBuilder`'s
 * `useCallback`-stabilized actions guarantee for an unchanged rule across a
 * sibling mutation. See ADR 0001.
 */
export const ShadcnFilterRule = memo(function ShadcnFilterRule({
  schema,
  rule,
  className,
  onChange,
  onRemove,
  onClone,
}: ShadcnFilterRuleProps) {
  // Locked rules are read-only: disable every control and hide the mutating
  // actions. Core mutations reject locked edits regardless, this is the UX layer.
  const locked = rule.locked;
  return (
    <fieldset
      aria-describedby={rule.aria.describedBy}
      aria-label={rule.aria.label}
      className={cn(
        'flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center',
        locked && 'opacity-60',
        className
      )}
      data-locked={locked || undefined}
    >
      <ShadcnNotToggle
        checked={Boolean(rule.rule.not)}
        disabled={locked}
        onChange={(not) => onChange(rule.id, { not })}
      />
      <ShadcnFieldSelector
        schema={schema}
        rule={rule.rule}
        disabled={locked}
        onChange={(field) => onChange(rule.id, getDefaultRuleUpdatesForField(schema, field))}
      />
      <ShadcnOperatorSelector
        field={rule.field}
        schema={schema}
        rule={rule.rule}
        disabled={locked}
        onChange={(operator) => onChange(rule.id, { operator })}
      />
      <ShadcnValueEditor
        errorId={rule.aria.describedBy}
        errors={rule.errors}
        field={rule.field}
        operator={rule.operator}
        schema={schema}
        rule={rule.rule}
        disabled={locked}
        onChange={(value) => onChange(rule.id, { value })}
      />
      {locked ? null : (
        <>
          {onClone ? (
            <Button variant="outline" onClick={() => onClone(rule.id)}>
              Clone rule
            </Button>
          ) : null}
          <Button variant="destructive" onClick={() => onRemove(rule.id)}>
            Remove rule
          </Button>
        </>
      )}
    </fieldset>
  );
});
