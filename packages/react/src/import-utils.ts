import type { Filter } from '@x-filter/core';
import { fromJSON, tryParseDSL } from '@x-filter/core';

export type ImportFormat = 'dsl' | 'json';

export type ParseFilterInputResult = { ok: true; filter: Filter } | { ok: false; error: string };

/**
 * Parses pasted text into a `Filter`, used by the import dialogs.
 *
 * - `'dsl'` delegates to `tryParseDSL`.
 * - `'json'` runs `JSON.parse` then `fromJSON`, rejecting non-objects.
 *
 * Returns a discriminated result rather than throwing so UIs can surface the
 * error message inline.
 */
export function parseFilterInput(format: ImportFormat, text: string): ParseFilterInputResult {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: 'Enter a filter to import.' };
  }

  if (format === 'dsl') {
    const result = tryParseDSL(trimmed);
    return result.ok
      ? { ok: true, filter: result.filter }
      : { ok: false, error: result.errors.map((e) => `[${e.code}] ${e.message}`).join('; ') };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (cause) {
    return { ok: false, error: `Invalid JSON: ${(cause as Error).message}` };
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { ok: false, error: 'JSON must be a filter object.' };
  }
  return { ok: true, filter: fromJSON(parsed as Record<string, unknown>) as Filter };
}
