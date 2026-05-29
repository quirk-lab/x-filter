import type { FieldSchema, FilterRule } from '@x-filter/core';
import type { ChangeEvent } from 'react';
import { Select } from './primitives';

export interface ShadcnFieldSelectorProps {
  schema: FieldSchema[];
  rule?: FilterRule;
  value?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  onChange: (fieldName: string) => void;
}

export function ShadcnFieldSelector({
  schema,
  rule,
  value,
  disabled,
  className,
  label = 'Field',
  onChange,
}: ShadcnFieldSelectorProps) {
  return (
    <Select
      aria-label={label}
      className={className}
      disabled={disabled}
      onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value)}
      options={schema.map((field) => ({ value: field.name, label: field.label }))}
      placeholder={label}
      value={value ?? rule?.field ?? ''}
    />
  );
}
