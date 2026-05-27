import { act, renderHook } from '@testing-library/react';
import { useFilteredArray, useValidatedInput } from '../index';

describe('legacy public hooks', () => {
  it('useFilteredArray returns only non-nullish items', () => {
    const { result } = renderHook(() => useFilteredArray([1, null, 2, undefined, 3]));
    expect(result.current).toEqual([1, 2, 3]);
  });

  it('useValidatedInput exposes value, setter, and trimmed validity', () => {
    const { result } = renderHook(() => useValidatedInput(''));

    expect(result.current.value).toBe('');
    expect(result.current.isValid).toBe(false);

    act(() => {
      result.current.setValue(' hello ');
    });

    expect(result.current.value).toBe(' hello ');
    expect(result.current.isValid).toBe(true);
  });
});
