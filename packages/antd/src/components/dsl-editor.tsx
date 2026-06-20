import type { CompletionItem, FieldSchema, Filter } from '@x-filter/core';
import type { FilterBuilderLabels } from '@x-filter/react';
import { replaceCurrentSegment, useDslEditor } from '@x-filter/react';
import { Alert, Button, Input, Space } from 'antd';
import type React from 'react';
import { useState } from 'react';
import { AntdCompletionMenu } from './completion-menu';

export interface AntdDslEditorProps {
  filter: Filter;
  schema: FieldSchema[];
  className?: string;
  completionMenuClassName?: string;
  labels?: FilterBuilderLabels;
  onCommit: (filter: Filter) => void;
}

export function AntdDslEditor({
  filter,
  schema,
  className,
  completionMenuClassName,
  labels,
  onCommit,
}: AntdDslEditorProps) {
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
    <Space className={className} direction="vertical" size="small" style={{ width: '100%' }}>
      <Input.TextArea
        aria-label={inputLabel}
        autoSize
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
      {editor.parseError ? <Alert message={editor.parseError} showIcon type="error" /> : null}
      <AntdCompletionMenu
        activeIndex={activeIndex}
        className={completionMenuClassName}
        items={visibleCompletions}
        onSelect={applyCompletion}
      />
    </Space>
  );
}
