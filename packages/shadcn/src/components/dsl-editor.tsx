import type { FieldSchema, Filter } from '@x-filter/core';
import type { FilterBuilderLabels } from '@x-filter/react';
import { useDslEditor, useDslEditorInteraction } from '@x-filter/react';
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
  const editor = useDslEditor({ filter, schema, onCommit });
  const interaction = useDslEditorInteraction({ editor });
  const inputLabel = labels?.dslInput ?? 'DSL';

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <textarea
        aria-label={inputLabel}
        className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
      {editor.parseError ? (
        <div
          className="rounded-md border border-destructive px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {editor.parseError}
        </div>
      ) : null}
      <ShadcnCompletionMenu
        activeIndex={interaction.activeIndex}
        className={completionMenuClassName}
        items={interaction.visibleCompletions}
        onSelect={interaction.applyCompletion}
      />
    </div>
  );
}
