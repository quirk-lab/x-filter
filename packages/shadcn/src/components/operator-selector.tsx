import { type FieldSchema, type FilterRule, getOperators, type OperatorDef } from '@x-filter/core';
import type { ChangeEvent } from 'react';
import { Select } from './primitives';

export interface ShadcnOperatorSelectorProps {
  schema: FieldSchema[];
  rule?: FilterRule;
  field?: FieldSchema;
  value?: string;
  disabled?: boolean;
  className?: string;
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
  onChange,
}: ShadcnOperatorSelectorProps) {
  const selectedField = field ?? findSchemaField(schema, rule?.field);
  const operators = getFieldOperators(selectedField);

  return (
    <Select
      aria-label="Operator"
      className={className}
      disabled={disabled || operators.length === 0}
      onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value)}
      options={operators.map((operator) => ({ value: operator.name, label: operator.label }))}
      placeholder="Select operator"
      value={value ?? rule?.operator ?? ''}
    />
  );
}
