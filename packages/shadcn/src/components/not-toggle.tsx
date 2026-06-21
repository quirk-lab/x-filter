import type { ReactNode } from 'react';
import { Checkbox } from './primitives';

export interface ShadcnNotToggleProps {
  checked?: boolean;
  disabled?: boolean;
  className?: string;
  label?: ReactNode;
  onChange: (checked: boolean) => void;
}

export function ShadcnNotToggle({
  checked = false,
  disabled,
  className,
  label = 'Not',
  onChange,
}: ShadcnNotToggleProps) {
  return (
    <Checkbox
      checked={checked}
      className={className}
      disabled={disabled}
      label={label}
      onChange={onChange}
    />
  );
}
