import { useValidatedInput } from '@x-filter/react';
import type React from 'react';

export interface ValidatedInputProps {
  placeholder?: string;
  onChange?: (value: string, isValid: boolean) => void;
}

/**
 * Shadcn-style validated input component
 */
export function ValidatedInput({ placeholder, onChange }: ValidatedInputProps) {
  const { value, setValue, isValid } = useValidatedInput('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onChange?.(newValue, isValid);
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
