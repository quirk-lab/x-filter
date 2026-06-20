import type { FieldSchema, FilterAny, ValidationError, ValidationResult } from '@x-filter/core';
import { validate } from '@x-filter/core';
import { useMemo, useRef } from 'react';

export interface UseFilterValidationOptions {
  filter: FilterAny;
  schema: FieldSchema[];
}

/**
 * Memoized, identity-aware validation of a `Filter` against a `FieldSchema[]`.
 *
 * Wraps the core `validate` and threads the previous `{ filter, errors }`
 * snapshot into it so that `ValidationError[]` arrays are carried forward
 * **by reference** for `===` source rules. This is what makes
 * `useFilterViewModel`'s identity cache (and `React.memo` on `<Rule>`)
 * effective across a single-node mutation: only the mutated rule's error
 * array gets a new reference.
 *
 * The `prevState` is only forwarded when the `schema` reference is unchanged,
 * satisfying the invariant documented on `ValidatePrevState` (a schema change
 * can flip a rule from valid to invalid, so carry-forward would be unsound).
 *
 * The returned `ValidationResult` is referentially stable across renders where
 * `filter` and `schema` do not change (via `useMemo`).
 */
export function useFilterValidation(options: UseFilterValidationOptions): ValidationResult {
  const { filter, schema } = options;

  const prevFilterRef = useRef<FilterAny | undefined>(undefined);
  const prevSchemaRef = useRef<FieldSchema[] | undefined>(undefined);
  const prevErrorsRef = useRef<Record<string, ValidationError[]> | undefined>(undefined);

  return useMemo(() => {
    const schemaUnchanged = prevSchemaRef.current === schema;
    const prevState =
      prevFilterRef.current !== undefined && schemaUnchanged
        ? { filter: prevFilterRef.current, errors: prevErrorsRef.current ?? {} }
        : undefined;

    const result = validate(filter, schema, prevState);

    prevFilterRef.current = filter;
    prevSchemaRef.current = schema;
    prevErrorsRef.current = result.errors;

    return result;
  }, [filter, schema]);
}
