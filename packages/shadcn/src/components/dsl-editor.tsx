import type { CompletionItem, FieldSchema, Filter } from '@x-filter/core';
import type { FilterBuilderLabels } from '@x-filter/react';
import { useDslEditor } from '@x-filter/react';
import type React from 'react';
import { useState } from 'react';
import { ShadcnCompletionMenu } from './completion-menu';
import { Button, cn } from './primitives';

export interface ShadcnDslEditorProps {
  filter: Filter;
  schema: FieldSchema[];
  className?: string;
  completionMenuClassName?: string;
  labels?: FilterBuilderLabels;
  onCommit: (filter: Filter) => void;
}

function needsStringQuoting(value: string): boolean {
  if (value.length === 0) return true;
  if (!/^[a-zA-Z0-9_.]+$/.test(value)) return true;
  if (value.includes('..')) return true;
  const upperValue = value.toUpperCase();
  if (upperValue === 'AND' || upperValue === 'OR' || upperValue === 'NOT') return true;
  if (value === 'true' || value === 'false') return true;
  if (/^\d+(\.\d+)?$/.test(value)) return true;
  return false;
}

function formatCompletionValue(item: CompletionItem): string {
  if (item.kind !== 'value' || !needsStringQuoting(item.value)) {
    return item.value;
  }

  return `"${item.value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function replaceCurrentSegment(draft: string, cursor: number, item: CompletionItem) {
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

export function ShadcnDslEditor({
  filter,
  schema,
  className,
  completionMenuClassName,
  labels,
  onCommit,
}: ShadcnDslEditorProps) {
  const [cursor, setCursor] = useState<number | undefined>();
  const [isCompletionOpen, setIsCompletionOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const editor = useDslEditor({ filter, schema, onCommit, cursor });
  const visibleCompletions = isCompletionOpen ? editor.completions : [];
  const inputLabel = labels?.dslInput ?? 'DSL';
  const applyLabel = labels?.applyDsl ?? 'Apply DSL';

  const updateCursor = (target: HTMLTextAreaElement) => {
    setCursor(target.selectionStart ?? target.value.length);
  };

  const applyCompletion = (item: CompletionItem) => {
    const cursorPosition = cursor ?? editor.draftDSL.length;
    const { nextDraft, nextCursor } = replaceCurrentSegment(editor.draftDSL, cursorPosition, item);

    editor.setDraftDSL(nextDraft);
    setCursor(nextCursor);
    setActiveIndex(0);
    setIsCompletionOpen(false);
  };

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    editor.setDraftDSL(event.target.value);
    updateCursor(event.target);
    setActiveIndex(0);
    setIsCompletionOpen(true);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Escape') {
      setIsCompletionOpen(false);
      return;
    }

    if (editor.completions.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsCompletionOpen(true);
      setActiveIndex((index) => (index + 1) % editor.completions.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setIsCompletionOpen(true);
      setActiveIndex(
        (index) => (index - 1 + editor.completions.length) % editor.completions.length
      );
      return;
    }

    if (event.key === 'Enter' && isCompletionOpen) {
      event.preventDefault();
      applyCompletion(editor.completions[activeIndex] ?? editor.completions[0]);
    }
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <textarea
        aria-label={inputLabel}
        className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        onChange={handleChange}
        onClick={(event) => updateCursor(event.currentTarget)}
        onFocus={(event) => {
          updateCursor(event.currentTarget);
          setIsCompletionOpen(true);
        }}
        onKeyDown={handleKeyDown}
        onSelect={(event) => updateCursor(event.currentTarget)}
        value={editor.draftDSL}
      />
      <Button onClick={editor.commit}>{applyLabel}</Button>
      {editor.parseError ? (
        <div
          className="rounded-md border border-destructive px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {editor.parseError}
        </div>
      ) : null}
      <ShadcnCompletionMenu
        activeIndex={activeIndex}
        className={completionMenuClassName}
        items={visibleCompletions}
        onSelect={applyCompletion}
      />
    </div>
  );
}
