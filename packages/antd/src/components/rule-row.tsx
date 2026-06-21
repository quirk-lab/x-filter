import type { FieldSchema, FilterRule } from '@x-filter/core';
import type { FilterRuleViewModel } from '@x-filter/react';
import { getDefaultRuleUpdatesForField } from '@x-filter/react';
import { Button, Space } from 'antd';
import { memo } from 'react';
import { AntdFieldSelector } from './field-selector';
import { AntdNotToggle } from './not-toggle';
import { AntdOperatorSelector } from './operator-selector';
import { AntdValueEditor } from './value-editor';

export interface AntdFilterRuleProps {
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
export const AntdFilterRule = memo(function AntdFilterRule({
  schema,
  rule,
  className,
  onChange,
  onRemove,
  onClone,
}: AntdFilterRuleProps) {
  return (
    <Space
      aria-describedby={rule.aria.describedBy}
      aria-label={rule.aria.label}
      className={className}
      role="group"
      wrap
    >
      <AntdNotToggle
        checked={Boolean(rule.rule.not)}
        onChange={(not) => onChange(rule.id, { not })}
      />
      <AntdFieldSelector
        schema={schema}
        rule={rule.rule}
        onChange={(field) => onChange(rule.id, getDefaultRuleUpdatesForField(schema, field))}
      />
      <AntdOperatorSelector
        field={rule.field}
        schema={schema}
        rule={rule.rule}
        onChange={(operator) => onChange(rule.id, { operator })}
      />
      <AntdValueEditor
        field={rule.field}
        operator={rule.operator}
        schema={schema}
        rule={rule.rule}
        onChange={(value) => onChange(rule.id, { value })}
      />
      {onClone ? <Button onClick={() => onClone(rule.id)}>Clone rule</Button> : null}
      <Button danger onClick={() => onRemove(rule.id)}>
        Remove rule
      </Button>
    </Space>
  );
});
