import type { Combinator } from '@x-filter/core';
import { Select } from 'antd';

export interface AntdCombinatorSelectorProps {
  value: Combinator;
  disabled?: boolean;
  className?: string;
  label?: string;
  onChange: (combinator: Combinator) => void;
}

export function AntdCombinatorSelector({
  value,
  disabled,
  className,
  label = 'Combinator',
  onChange,
}: AntdCombinatorSelectorProps) {
  return (
    <Select
      aria-label={label}
      className={className}
      disabled={disabled}
      onChange={(combinator) => onChange(combinator)}
      options={[
        { value: 'and', label: 'AND' },
        { value: 'or', label: 'OR' },
      ]}
      value={value}
    />
  );
}
