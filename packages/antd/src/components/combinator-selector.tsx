import type { Combinator } from '@x-filter/core';
import { Select } from 'antd';

export interface AntdCombinatorSelectorProps {
  value: Combinator;
  disabled?: boolean;
  className?: string;
  onChange: (combinator: Combinator) => void;
}

export function AntdCombinatorSelector({
  value,
  disabled,
  className,
  onChange,
}: AntdCombinatorSelectorProps) {
  return (
    <Select
      aria-label="Combinator"
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
