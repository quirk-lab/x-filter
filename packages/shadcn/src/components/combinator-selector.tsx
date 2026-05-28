import type { Combinator } from '@x-filter/core';
import type { ChangeEvent } from 'react';
import { Select } from './primitives';

export interface ShadcnCombinatorSelectorProps {
  value: Combinator;
  disabled?: boolean;
  className?: string;
  onChange: (combinator: Combinator) => void;
}

export function ShadcnCombinatorSelector({
  value,
  disabled,
  className,
  onChange,
}: ShadcnCombinatorSelectorProps) {
  return (
    <Select
      aria-label="Combinator"
      className={className}
      disabled={disabled}
      onChange={(event: ChangeEvent<HTMLSelectElement>) =>
        onChange(event.target.value as Combinator)
      }
      options={[
        { value: 'and', label: 'AND' },
        { value: 'or', label: 'OR' },
      ]}
      value={value}
    />
  );
}
