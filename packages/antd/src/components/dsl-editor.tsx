import type { FieldSchema, Filter } from '@x-filter/core';
import type { FilterBuilderLabels } from '@x-filter/react';
import { useDslEditor, useDslEditorInteraction } from '@x-filter/react';
import { Alert, Button, Input, Space } from 'antd';
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
  const editor = useDslEditor({ filter, schema, onCommit });
  const interaction = useDslEditorInteraction({ editor });
  const inputLabel = labels?.dslInput ?? 'DSL';

  return (
    <Space className={className} direction="vertical" size="small" style={{ width: '100%' }}>
      <Input.TextArea
        aria-label={inputLabel}
        autoSize
        onChange={interaction.handleChange}
        onClick={(event) => interaction.updateCursor(event.currentTarget)}
        onFocus={(event) => {
          interaction.updateCursor(event.currentTarget);
          interaction.setIsCompletionOpen(true);
        }}
        onKeyDown={interaction.handleKeyDown}
        onSelect={(event) => interaction.updateCursor(event.currentTarget)}
        value={editor.draftDSL}
      />
      <Button onClick={editor.commit}>Apply DSL</Button>
      {editor.parseError ? <Alert message={editor.parseError} showIcon type="error" /> : null}
      <AntdCompletionMenu
        activeIndex={interaction.activeIndex}
        className={completionMenuClassName}
        items={interaction.visibleCompletions}
        onSelect={interaction.applyCompletion}
      />
    </Space>
  );
}
