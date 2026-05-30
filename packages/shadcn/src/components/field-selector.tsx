import type { FieldSchema, FilterRule } from '@x-filter/core';
import type { ChangeEvent } from 'react';
import { Select, type SelectOption } from './primitives';

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
  const selectedValue = value ?? rule?.field ?? '';
  const options: SelectOption[] = schema.map((field) => ({
    value: field.name,
    label: field.label,
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
      disabled={disabled}
      onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value)}
      options={options}
      placeholder={label}
      value={selectedValue}
    />
  );
}
