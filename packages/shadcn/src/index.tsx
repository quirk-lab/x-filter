import { useValidatedInput } from '@x-filter/react';
import type React from 'react';

export * from './components';

export interface ValidatedInputProps {
  placeholder?: string;
  onChange?: (value: string, isValid: boolean) => void;
}

export function ValidatedInput({ placeholder, onChange }: ValidatedInputProps) {
  const { value, setValue, isValid } = useValidatedInput('');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    const nextIsValid = newValue.trim().length > 0;
    setValue(newValue);
    onChange?.(newValue, nextIsValid);
  };

  return (
    <div className="validated-input">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={isValid ? 'valid' : 'invalid'}
      />
    </div>
  );
}

export type {
  FilterBuilderClassNames,
  FilterBuilderLabels,
  FilterBuilderSlotProps,
  FilterBuilderSlots,
  FilterGroupViewModel,
  FilterNodeViewModel,
  FilterRuleViewModel,
  UseFilterBuilderReturn,
  UseFilterDslReturn,
} from '@x-filter/react';
