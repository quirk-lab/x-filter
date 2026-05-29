import type { FieldSchema, FilterRule } from '@x-filter/core';
import { Select } from 'antd';

export interface AntdFieldSelectorProps {
  schema: FieldSchema[];
  rule?: FilterRule;
  value?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  onChange: (fieldName: string) => void;
}

export function AntdFieldSelector({
  schema,
  rule,
  value,
  disabled,
  className,
  label = 'Field',
  onChange,
}: AntdFieldSelectorProps) {
  return (
    <Select
      aria-label={label}
      className={className}
      disabled={disabled}
      onChange={(fieldName) => onChange(fieldName)}
      options={schema.map((field) => ({ value: field.name, label: field.label }))}
      placeholder={label}
      value={value ?? rule?.field}
    />
  );
}
