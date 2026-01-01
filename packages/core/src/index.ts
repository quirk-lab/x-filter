import { isDefined } from '@x-filter/utils';

/**
 * Core filter function that removes null/undefined values from an array
 */
export function filterDefined<T>(array: (T | null | undefined)[]): T[] {
  return array.filter(isDefined);
}

/**
 * Core validation function
 */
export function validateInput(input: unknown): boolean {
  return isDefined(input) && typeof input === 'string' && input.length > 0;
}
