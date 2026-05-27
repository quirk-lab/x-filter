import type { FieldSchema, FilterRule, OperatorDef } from '@x-filter/core';
import { Checkbox, Input, InputNumber, Select, Space } from 'antd';
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

function asPairValue(value: unknown): [unknown, unknown] {
  return Array.isArray(value) ? [value[0], value[1]] : [undefined, undefined];
}

function asOptionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

function updatePairValue(value: unknown, index: 0 | 1, nextValue: unknown): [unknown, unknown] {
  const pair = asPairValue(value);
  pair[index] = nextValue;
  return pair;
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

  if (selectedOperator?.arity === 'ternary') {
    const [firstValue, secondValue] = asPairValue(rule.value);

    if (selectedField?.type === 'number') {
      return (
        <Space.Compact className={className}>
          <InputNumber
            aria-label="Value"
            disabled={disabled}
            onChange={(value) => onChange(updatePairValue(rule.value, 0, value))}
            value={asOptionalNumber(firstValue)}
          />
          <InputNumber
            aria-label="Value"
            disabled={disabled}
            onChange={(value) => onChange(updatePairValue(rule.value, 1, value))}
            value={asOptionalNumber(secondValue)}
          />
        </Space.Compact>
      );
    }

    if (selectedField?.type === 'date') {
      return (
        <Space.Compact className={className}>
          <Input
            aria-label="Value"
            disabled={disabled}
            onChange={(event) => onChange(updatePairValue(rule.value, 0, event.target.value))}
            type="date"
            value={asStringValue(firstValue)}
          />
          <Input
            aria-label="Value"
            disabled={disabled}
            onChange={(event) => onChange(updatePairValue(rule.value, 1, event.target.value))}
            type="date"
            value={asStringValue(secondValue)}
          />
        </Space.Compact>
      );
    }
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
