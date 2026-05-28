import { Checkbox } from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';

export interface AntdNotToggleProps {
  checked?: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
  onChange: (checked: boolean) => void;
}

export function AntdNotToggle({
  checked = false,
  disabled,
  className,
  label = 'Not',
  onChange,
}: AntdNotToggleProps) {
  return (
    <Checkbox
      checked={checked}
      className={className}
      disabled={disabled}
      onChange={(event: CheckboxChangeEvent) => onChange(event.target.checked)}
    >
      {label}
    </Checkbox>
  );
}
