import type { FieldSchema, FilterRule } from '@x-filter/core';
import { findSchemaField, getFieldOperators } from '@x-filter/react';
import { Select } from 'antd';

export interface AntdOperatorSelectorProps {
  schema: FieldSchema[];
  rule?: FilterRule;
  field?: FieldSchema;
  value?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  onChange: (operatorName: string) => void;
}

export function AntdOperatorSelector({
  schema,
  rule,
  field,
  value,
  disabled,
  className,
  label = 'Operator',
  onChange,
}: AntdOperatorSelectorProps) {
  const selectedField = field ?? findSchemaField(schema, rule?.field);
  const operators = getFieldOperators(selectedField);

  return (
    <Select
      aria-label={label}
      className={className}
      disabled={disabled || operators.length === 0}
      onChange={(operatorName) => onChange(operatorName)}
      options={operators.map((operator) => ({ value: operator.name, label: operator.label }))}
      placeholder={label}
      value={value ?? rule?.operator}
    />
  );
}
