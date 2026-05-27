import type { FieldSchema, FilterRule, OperatorDef } from '@x-filter/core';
import { Checkbox, Input, InputNumber, Select } from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import { findSchemaField, getFieldOperators } from './operator-selector';

export interface AntdValueEditorProps {
  schema: FieldSchema[];
  rule: FilterRule;
  field?: FieldSchema;
  operator?: OperatorDef;
  disabled?: boolean;
  className?: string;
  onChange: (value: unknown) => void;
}

function findOperator(
  field: FieldSchema | undefined,
  operatorName: string
): OperatorDef | undefined {
  return getFieldOperators(field).find((operator) => operator.name === operatorName);
}

function asStringValue(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}

function asArrayValue(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

export function AntdValueEditor({
  schema,
  rule,
  field,
  operator,
  disabled,
  className,
  onChange,
}: AntdValueEditorProps) {
  const selectedField = field ?? findSchemaField(schema, rule.field);
  const selectedOperator = operator ?? findOperator(selectedField, rule.operator);
  const isDisabled = disabled || selectedOperator?.arity === 'unary';

  if (selectedOperator?.arity === 'unary') {
    return (
      <Input aria-label="Value" className={className} disabled placeholder="No value" value="" />
    );
  }

  if (selectedField?.type === 'number') {
    return (
      <InputNumber
        aria-label="Value"
        className={className}
        disabled={isDisabled}
        onChange={(value) => onChange(value)}
        value={typeof rule.value === 'number' ? rule.value : undefined}
      />
    );
  }

  if (selectedField?.type === 'select') {
    return (
      <Select
        aria-label="Value"
        className={className}
        disabled={isDisabled}
        onChange={(value) => onChange(value)}
        options={(selectedField.values ?? []).map((option) => ({
          value: option.value,
          label: option.label,
        }))}
        placeholder="Select value"
        value={asStringValue(rule.value) || undefined}
      />
    );
  }

  if (selectedField?.type === 'multiSelect') {
    return (
      <Select
        aria-label="Value"
        className={className}
        disabled={isDisabled}
        mode="multiple"
        onChange={(value) => onChange(value)}
        options={(selectedField.values ?? []).map((option) => ({
          value: option.value,
          label: option.label,
        }))}
        placeholder="Select values"
        value={asArrayValue(rule.value)}
      />
    );
  }

  if (selectedField?.type === 'boolean') {
    return (
      <Checkbox
        aria-label="Value"
        checked={Boolean(rule.value)}
        className={className}
        disabled={isDisabled}
        onChange={(event: CheckboxChangeEvent) => onChange(event.target.checked)}
      />
    );
  }

  if (selectedField?.type === 'date') {
    return (
      <Input
        aria-label="Value"
        className={className}
        disabled={isDisabled}
        onChange={(event) => onChange(event.target.value)}
        type="date"
        value={asStringValue(rule.value)}
      />
    );
  }

  return (
    <Input
      aria-label="Value"
      className={className}
      disabled={isDisabled}
      onChange={(event) => onChange(event.target.value)}
      value={asStringValue(rule.value)}
    />
  );
}
