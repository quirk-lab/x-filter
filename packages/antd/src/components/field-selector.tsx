import type { FieldSchema, FilterRule } from '@x-filter/core';
import { Select } from 'antd';

export interface AntdFieldSelectorProps {
  schema: FieldSchema[];
  rule?: FilterRule;
  value?: string;
  disabled?: boolean;
  className?: string;
  onChange: (fieldName: string) => void;
}

export function AntdFieldSelector({
  schema,
  rule,
  value,
  disabled,
  className,
  onChange,
}: AntdFieldSelectorProps) {
  return (
    <Select
      aria-label="Field"
      className={className}
      disabled={disabled}
      onChange={(fieldName) => onChange(fieldName)}
      options={schema.map((field) => ({ value: field.name, label: field.label }))}
      placeholder="Select field"
      value={value ?? rule?.field}
    />
  );
}
