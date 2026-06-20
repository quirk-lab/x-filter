import type { FieldSchema, FieldType, FilterRule, OperatorDef } from '@x-filter/core';
import {
  asArrayValue,
  asPairValue,
  asStringValue,
  findOperator,
  findSchemaField,
  updatePairValue,
} from '@x-filter/react';
import { Checkbox, Input, InputNumber, Select, Space } from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';

export interface AntdValueEditorProps {
  schema: FieldSchema[];
  rule: FilterRule;
  field?: FieldSchema;
  operator?: OperatorDef;
  disabled?: boolean;
  className?: string;
  label?: string;
  startLabel?: string;
  endLabel?: string;
  noValueLabel?: string;
  onChange: (value: unknown) => void;
}

function asOptionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

// Temporal field types map to native HTML input types. Values are kept as the
// input's string representation (`yyyy-mm-dd`, `HH:mm`, `yyyy-mm-ddTHH:mm`).
const temporalInputType: Partial<Record<FieldType, 'date' | 'time' | 'datetime-local'>> = {
  date: 'date',
  time: 'time',
  dateTime: 'datetime-local',
};

export function AntdValueEditor({
  schema,
  rule,
  field,
  operator,
  disabled,
  className,
  label = 'Value',
  startLabel = 'Start value',
  endLabel = 'End value',
  noValueLabel = 'No value',
  onChange,
}: AntdValueEditorProps) {
  const selectedField = field ?? findSchemaField(schema, rule.field);
  const selectedOperator = operator ?? findOperator(selectedField, rule.operator);
  const isDisabled = disabled || selectedOperator?.arity === 'unary';
  const temporalType = selectedField ? temporalInputType[selectedField.type] : undefined;

  if (selectedOperator?.arity === 'unary') {
    return (
      <Input
        aria-label={label}
        className={className}
        disabled
        placeholder={noValueLabel}
        value=""
      />
    );
  }

  if (selectedOperator?.arity === 'ternary') {
    const [firstValue, secondValue] = asPairValue(rule.value);

    if (selectedField?.type === 'number') {
      return (
        <Space.Compact className={className}>
          <InputNumber
            aria-label={startLabel}
            disabled={disabled}
            onChange={(value) => onChange(updatePairValue(rule.value, 0, value))}
            value={asOptionalNumber(firstValue)}
          />
          <InputNumber
            aria-label={endLabel}
            disabled={disabled}
            onChange={(value) => onChange(updatePairValue(rule.value, 1, value))}
            value={asOptionalNumber(secondValue)}
          />
        </Space.Compact>
      );
    }

    if (temporalType) {
      return (
        <Space.Compact className={className}>
          <Input
            aria-label={startLabel}
            disabled={disabled}
            onChange={(event) => onChange(updatePairValue(rule.value, 0, event.target.value))}
            type={temporalType}
            value={asStringValue(firstValue)}
          />
          <Input
            aria-label={endLabel}
            disabled={disabled}
            onChange={(event) => onChange(updatePairValue(rule.value, 1, event.target.value))}
            type={temporalType}
            value={asStringValue(secondValue)}
          />
        </Space.Compact>
      );
    }
  }

  if (selectedField?.type === 'number') {
    return (
      <InputNumber
        aria-label={label}
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
        aria-label={label}
        className={className}
        disabled={isDisabled}
        onChange={(value) => onChange(value)}
        options={(selectedField.values ?? []).map((option) => ({
          value: option.value,
          label: option.label,
        }))}
        placeholder={label}
        value={asStringValue(rule.value) || undefined}
      />
    );
  }

  if (selectedField?.type === 'multiSelect') {
    return (
      <Select
        aria-label={label}
        className={className}
        disabled={isDisabled}
        mode="multiple"
        onChange={(value) => onChange(value)}
        options={(selectedField.values ?? []).map((option) => ({
          value: option.value,
          label: option.label,
        }))}
        placeholder={label}
        value={asArrayValue(rule.value)}
      />
    );
  }

  if (selectedField?.type === 'boolean') {
    return (
      <Checkbox
        aria-label={label}
        checked={Boolean(rule.value)}
        className={className}
        disabled={isDisabled}
        onChange={(event: CheckboxChangeEvent) => onChange(event.target.checked)}
      />
    );
  }

  if (temporalType) {
    return (
      <Input
        aria-label={label}
        className={className}
        disabled={isDisabled}
        onChange={(event) => onChange(event.target.value)}
        type={temporalType}
        value={asStringValue(rule.value)}
      />
    );
  }

  return (
    <Input
      aria-label={label}
      className={className}
      disabled={isDisabled}
      onChange={(event) => onChange(event.target.value)}
      value={asStringValue(rule.value)}
    />
  );
}
