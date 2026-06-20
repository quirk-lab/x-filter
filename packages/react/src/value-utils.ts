/**
 * Converts an unknown value to a string for text inputs.
 * Returns empty string for null/undefined.
 */
export function asStringValue(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}

/**
 * Converts an unknown value to a string array for multi-select inputs.
 * Returns empty array for non-arrays.
 */
export function asArrayValue(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

/**
 * Extracts a pair [first, second] from an unknown value.
 * Returns [undefined, undefined] for non-arrays.
 */
export function asPairValue(value: unknown): [unknown, unknown] {
  return Array.isArray(value) ? [value[0], value[1]] : [undefined, undefined];
}

/**
 * Parses a number from an input string.
 * Returns undefined for empty string.
 */
export function parseNumberInput(value: string): number | undefined {
  return value === '' ? undefined : Number(value);
}

/**
 * Updates one element of a pair value, preserving the other.
 */
export function updatePairValue(
  value: unknown,
  index: 0 | 1,
  nextValue: unknown
): [unknown, unknown] {
  const pair = asPairValue(value);
  pair[index] = nextValue;
  return pair;
}
