import type { FieldSchema, FilterRule } from '@x-filter/core';
import type { FilterRuleViewModel } from '@x-filter/react';
import { memo } from 'react';
import { ShadcnFieldSelector } from './field-selector';
import { ShadcnNotToggle } from './not-toggle';
import { ShadcnOperatorSelector } from './operator-selector';
import { Button, cn } from './primitives';
import { getDefaultRuleUpdatesForField } from './rule-defaults';
import { ShadcnValueEditor } from './value-editor';

export interface ShadcnFilterRuleProps {
  schema: FieldSchema[];
  rule: FilterRuleViewModel;
  className?: string;
  onChange: (ruleId: string, updates: Partial<Omit<FilterRule, 'id'>>) => void;
  onRemove: (ruleId: string) => void;
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
}: ShadcnFilterRuleProps) {
  return (
    <fieldset
      aria-describedby={rule.aria.describedBy}
      aria-label={rule.aria.label}
      className={cn('flex flex-wrap items-center gap-2', className)}
    >
      <ShadcnNotToggle
        checked={Boolean(rule.rule.not)}
        onChange={(not) => onChange(rule.id, { not })}
      />
      <ShadcnFieldSelector
        schema={schema}
        rule={rule.rule}
        onChange={(field) => onChange(rule.id, getDefaultRuleUpdatesForField(schema, field))}
      />
      <ShadcnOperatorSelector
        field={rule.field}
        schema={schema}
        rule={rule.rule}
        onChange={(operator) => onChange(rule.id, { operator })}
      />
      <ShadcnValueEditor
        field={rule.field}
        operator={rule.operator}
        schema={schema}
        rule={rule.rule}
        onChange={(value) => onChange(rule.id, { value })}
      />
      <Button variant="destructive" onClick={() => onRemove(rule.id)}>
        Remove rule
      </Button>
    </fieldset>
  );
});
