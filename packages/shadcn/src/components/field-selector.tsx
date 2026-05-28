import type { FieldSchema, FilterRule } from '@x-filter/core';
import type { ChangeEvent } from 'react';
import { Select } from './primitives';

export interface ShadcnFieldSelectorProps {
  schema: FieldSchema[];
  rule?: FilterRule;
  value?: string;
  disabled?: boolean;
  className?: string;
  onChange: (fieldName: string) => void;
}

export function ShadcnFieldSelector({
  schema,
  rule,
  value,
  disabled,
  className,
  onChange,
}: ShadcnFieldSelectorProps) {
  return (
    <Select
      aria-label="Field"
      className={className}
      disabled={disabled}
      onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value)}
      options={schema.map((field) => ({ value: field.name, label: field.label }))}
      placeholder="Select field"
      value={value ?? rule?.field ?? ''}
    />
  );
}
