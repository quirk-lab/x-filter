import { type FieldSchema, type FilterRule, getOperators, type OperatorDef } from '@x-filter/core';
import { Select } from 'antd';

export interface AntdOperatorSelectorProps {
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

export function AntdOperatorSelector({
  schema,
  rule,
  field,
  value,
  disabled,
  className,
  onChange,
}: AntdOperatorSelectorProps) {
  const selectedField = field ?? findSchemaField(schema, rule?.field);
  const operators = getFieldOperators(selectedField);

  return (
    <Select
      aria-label="Operator"
      className={className}
      disabled={disabled || operators.length === 0}
      onChange={(operatorName) => onChange(operatorName)}
      options={operators.map((operator) => ({ value: operator.name, label: operator.label }))}
      placeholder="Select operator"
      value={value ?? rule?.operator}
    />
  );
}
