import type { CompletionItem, FieldSchema, Filter } from '@x-filter/core';
import type { FilterBuilderLabels } from '@x-filter/react';
import { replaceCurrentSegment, useDslEditor } from '@x-filter/react';
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
      <Button onClick={editor.commit}>Apply DSL</Button>
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
