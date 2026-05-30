import { type FieldSchema, type FilterRule, getOperators, type OperatorDef } from '@x-filter/core';
import type { ChangeEvent } from 'react';
import { Select, type SelectOption } from './primitives';

export interface ShadcnOperatorSelectorProps {
  schema: FieldSchema[];
  rule?: FilterRule;
  field?: FieldSchema;
  value?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  onChange: (operatorName: string) => void;
}

export function getFieldOperators(field?: FieldSchema): OperatorDef[] {
  return field ? getOperators(field.type, field.operators) : [];
}

export function findSchemaField(
  schema: FieldSchema[],
  fieldName?: string
): FieldSchema | undefined {
  return schema.find((field) => field.name === fieldName);
}

export function ShadcnOperatorSelector({
  schema,
  rule,
  field,
  value,
  disabled,
  className,
  label = 'Operator',
  onChange,
}: ShadcnOperatorSelectorProps) {
  const selectedField = field ?? findSchemaField(schema, rule?.field);
  const operators = getFieldOperators(selectedField);
  const selectedValue = value ?? rule?.operator ?? '';
  const options: SelectOption[] = operators.map((operator) => ({
    value: operator.name,
    label: operator.label,
  }));
  const hasSelectedValue =
    selectedValue === '' || options.some((option) => option.value === selectedValue);

  if (!hasSelectedValue) {
    options.push({ value: selectedValue, label: selectedValue, disabled: true });
  }

  return (
    <Select
      aria-label={label}
      className={className}
      disabled={disabled || operators.length === 0}
      onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value)}
      options={options}
      placeholder={label}
      value={selectedValue}
    />
  );
}
