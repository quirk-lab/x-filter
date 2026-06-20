import type { CompletionItem } from '@x-filter/core';
import {
  formatCompletionValue,
  needsStringQuoting,
  replaceCurrentSegment,
} from '../dsl-completion-utils';

describe('needsStringQuoting', () => {
  it('requires quoting for empty string', () => {
    expect(needsStringQuoting('')).toBe(true);
  });

  it('requires quoting for strings with special characters', () => {
    expect(needsStringQuoting('in progress')).toBe(true);
    expect(needsStringQuoting('a/b')).toBe(true);
  });

  it('requires quoting for reserved words', () => {
    expect(needsStringQuoting('AND')).toBe(true);
    expect(needsStringQuoting('or')).toBe(true);
    expect(needsStringQuoting('NOT')).toBe(true);
  });

  it('requires quoting for booleans', () => {
    expect(needsStringQuoting('true')).toBe(true);
    expect(needsStringQuoting('false')).toBe(true);
  });

  it('requires quoting for numbers', () => {
    expect(needsStringQuoting('42')).toBe(true);
    expect(needsStringQuoting('3.14')).toBe(true);
  });

  it('does not require quoting for simple identifiers', () => {
    expect(needsStringQuoting('status')).toBe(false);
    expect(needsStringQuoting('field_name')).toBe(false);
    expect(needsStringQuoting('field.name')).toBe(false);
  });

  it('requires quoting for range syntax', () => {
    expect(needsStringQuoting('1..10')).toBe(true);
  });
});

describe('formatCompletionValue', () => {
  it('returns value as-is for non-value completions', () => {
    const item: CompletionItem = { kind: 'field', value: 'status', label: 'Status' };
    expect(formatCompletionValue(item)).toBe('status');
  });

  it('returns value as-is for values that do not need quoting', () => {
    const item: CompletionItem = { kind: 'value', value: 'active', label: 'Active' };
    expect(formatCompletionValue(item)).toBe('active');
  });

  it('quotes values that need quoting', () => {
    const item: CompletionItem = { kind: 'value', value: 'in progress', label: 'In progress' };
    expect(formatCompletionValue(item)).toBe('"in progress"');
  });

  it('escapes backslashes and quotes in values', () => {
    const item: CompletionItem = { kind: 'value', value: 'say "hi"', label: 'Say hi' };
    expect(formatCompletionValue(item)).toBe('"say \\"hi\\""');
  });
});

describe('replaceCurrentSegment', () => {
  it('replaces the current segment with a field completion', () => {
    const item: CompletionItem = { kind: 'field', value: 'status', label: 'Status' };
    const result = replaceCurrentSegment('sta', 3, item);
    expect(result.nextDraft).toBe('status');
    expect(result.nextCursor).toBe(6);
  });

  it('replaces the value segment in a field:operator:value pattern', () => {
    const item: CompletionItem = { kind: 'value', value: 'open', label: 'Open' };
    const result = replaceCurrentSegment('status:equals:op', 16, item);
    expect(result.nextDraft).toBe('status:equals:open');
    expect(result.nextCursor).toBe(18);
  });

  it('handles empty parentheses draft', () => {
    const item: CompletionItem = { kind: 'field', value: 'status', label: 'Status' };
    const result = replaceCurrentSegment('()', 1, item);
    expect(result.nextDraft).toBe('status');
    expect(result.nextCursor).toBe(6);
  });
});
