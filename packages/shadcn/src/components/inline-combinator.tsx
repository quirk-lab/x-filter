import type { Combinator } from '@x-filter/core';
import type { ChangeEvent } from 'react';
import { cn, Select } from './primitives';

export interface ShadcnInlineCombinatorProps {
  value: Combinator;
  disabled?: boolean;
  className?: string;
  label?: string;
  onChange: (combinator: Combinator) => void;
}

/**
 * Compact combinator selector rendered *between* sibling rules in an IC
 * (inline-combinator) group, where each position carries its own AND/OR.
 */
export function ShadcnInlineCombinator({
  value,
  disabled,
  className,
  label = 'Inline combinator',
  onChange,
}: ShadcnInlineCombinatorProps) {
  return (
    <Select
      aria-label={label}
      className={cn('w-fit', className)}
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
