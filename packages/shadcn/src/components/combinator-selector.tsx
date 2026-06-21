import type { Combinator } from '@x-filter/core';
import { cn, Select } from './primitives';

export interface ShadcnCombinatorSelectorProps {
  value: Combinator;
  disabled?: boolean;
  className?: string;
  label?: string;
  onChange: (combinator: Combinator) => void;
}

export function ShadcnCombinatorSelector({
  value,
  disabled,
  className,
  label = 'Combinator',
  onChange,
}: ShadcnCombinatorSelectorProps) {
  return (
    <Select
      aria-label={label}
      className={cn('w-auto min-w-[5rem]', className)}
      disabled={disabled}
      onChange={(val) => onChange(val as Combinator)}
      options={[
        { value: 'and', label: 'AND' },
        { value: 'or', label: 'OR' },
      ]}
      value={value}
    />
  );
}
