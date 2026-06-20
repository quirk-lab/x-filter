import { renderHook } from '@testing-library/react';
import type { FieldSchema, Filter, FilterAny, ValidationError } from '@x-filter/core';
import { updateRule } from '@x-filter/core';
import { useFilterValidation } from '../use-filter-validation';

const schema: FieldSchema[] = [
  { name: 'name', label: 'Name', type: 'text' },
  { name: 'age', label: 'Age', type: 'number' },
];

const baseFilter: Filter = {
  id: 'root',
  combinator: 'and',
  children: [
    { id: 'r1', field: 'name', operator: 'equals', value: 'Ada' },
    { id: 'r2', field: 'age', operator: 'gt', value: 18 },
  ],
};

describe('useFilterValidation', () => {
  it('returns a valid result for a well-formed filter', () => {
    const { result } = renderHook(() => useFilterValidation({ filter: baseFilter, schema }));
    expect(result.current.valid).toBe(true);
    expect(result.current.errors).toEqual({});
  });

  it('reports errors for an invalid rule', () => {
    const invalidFilter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'name', operator: 'equals', value: 123 }],
    };
    const { result } = renderHook(() => useFilterValidation({ filter: invalidFilter, schema }));
    expect(result.current.valid).toBe(false);
    expect(result.current.errors.r1[0].type).toBe('invalidValue');
  });

  it('keeps the ValidationResult reference stable across rerenders with unchanged inputs', () => {
    const { result, rerender } = renderHook(() =>
      useFilterValidation({ filter: baseFilter, schema })
    );
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it('carries forward the errors array reference for an unchanged rule after a sibling mutation', () => {
    const invalidFilter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [
        { id: 'r1', field: 'unknownField', operator: 'equals', value: 'x' },
        { id: 'r2', field: 'age', operator: 'gt', value: 18 },
      ],
    };

    const { result, rerender } = renderHook(
      ({ currentFilter }) => useFilterValidation({ filter: currentFilter, schema }),
      { initialProps: { currentFilter: invalidFilter } }
    );

    const firstR1Errors: ValidationError[] = result.current.errors.r1;
    expect(firstR1Errors).toBeDefined();

    // Mutate only r2; r1 is structurally shared (===).
    const nextFilter = updateRule(invalidFilter as Filter, 'r2', { value: 21 });
    expect(nextFilter.children[0]).toBe(invalidFilter.children[0]);
    rerender({ currentFilter: nextFilter });

    // r1's error array is the SAME reference (carried forward), not just equal.
    expect(result.current.errors.r1).toBe(firstR1Errors);
    expect(result.current.valid).toBe(false);
  });

  it('re-validates from scratch when the schema reference changes', () => {
    const { result, rerender } = renderHook(
      ({ currentFilter, currentSchema }) =>
        useFilterValidation({ filter: currentFilter, schema: currentSchema }),
      {
        initialProps: { currentFilter: baseFilter, currentSchema: schema },
      }
    );

    const first = result.current;

    // New schema object that drops the `name` field → r1 becomes invalidField.
    const nextSchema: FieldSchema[] = [{ name: 'age', label: 'Age', type: 'number' }];
    rerender({ currentFilter: baseFilter, currentSchema: nextSchema });

    expect(result.current).not.toBe(first);
    expect(result.current.valid).toBe(false);
    expect(result.current.errors.r1[0].type).toBe('invalidField');
  });
});
