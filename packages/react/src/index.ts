import { validateInput } from '@x-filter/core';
import { useEffect, useState } from 'react';

/**
 * Hook for validated input
 */
export function useValidatedInput(initialValue = '') {
  const [value, setValue] = useState(initialValue);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    setIsValid(validateInput(value));
  }, [value]);

  return {
    value,
    setValue,
    isValid,
  };
}

/**
 * Hook for filtering array
 */
export function useFilteredArray<T>(array: (T | null | undefined)[]) {
  const [filtered, setFiltered] = useState<T[]>([]);

  useEffect(() => {
    setFiltered(array.filter((item): item is T => item !== null && item !== undefined));
  }, [array]);

  return filtered;
}
