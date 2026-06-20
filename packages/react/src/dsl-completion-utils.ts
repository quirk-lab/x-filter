import type { CompletionItem } from '@x-filter/core';

/**
 * Determines whether a DSL value needs to be quoted.
 */
export function needsStringQuoting(value: string): boolean {
  if (value.length === 0) return true;
  if (!/^[a-zA-Z0-9_.]+$/.test(value)) return true;
  if (value.includes('..')) return true;
  const upperValue = value.toUpperCase();
  if (upperValue === 'AND' || upperValue === 'OR' || upperValue === 'NOT') return true;
  if (value === 'true' || value === 'false') return true;
  if (/^\d+(\.\d+)?$/.test(value)) return true;
  return false;
}

/**
 * Formats a completion item's value for insertion into DSL text.
 * Quotes string values that need quoting.
 */
export function formatCompletionValue(item: CompletionItem): string {
  if (item.kind !== 'value' || !needsStringQuoting(item.value)) {
    return item.value;
  }

  return `"${item.value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/**
 * Replaces the current segment in a DSL draft with a completion item.
 * Returns the new draft text and cursor position.
 */
export function replaceCurrentSegment(
  draft: string,
  cursor: number,
  item: CompletionItem
): { nextDraft: string; nextCursor: number } {
  const value = formatCompletionValue(item);

  if (draft === '()') {
    return { nextDraft: value, nextCursor: value.length };
  }

  const beforeCursor = draft.slice(0, cursor);
  const afterCursor = draft.slice(cursor);
  const match = beforeCursor.match(/[\s()][^\s()]*$/);
  const segmentStart = match ? beforeCursor.length - match[0].length + 1 : 0;
  const segment = beforeCursor.slice(segmentStart);
  const parts = segment.split(':');
  const replacement =
    parts.length === 1
      ? value
      : parts.length === 2
        ? `${parts[0]}:${value}`
        : `${parts[0]}:${parts[1]}:${value}`;

  return {
    nextDraft: `${beforeCursor.slice(0, segmentStart)}${replacement}${afterCursor}`,
    nextCursor: segmentStart + replacement.length,
  };
}
