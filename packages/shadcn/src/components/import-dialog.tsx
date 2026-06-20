import type { FieldSchema, Filter } from '@x-filter/core';
import { formatDSL } from '@x-filter/core';
import type { ImportFormat } from '@x-filter/react';
import { parseFilterInput } from '@x-filter/react';
import { useCallback, useId, useState } from 'react';
import { Button, cn } from './primitives';

export type { ImportFormat } from '@x-filter/react';

export interface ShadcnImportFilterDialogProps {
  schema?: FieldSchema[];
  onImport: (filter: Filter) => void;
  /** Label for the trigger button. Defaults to "Import". */
  triggerLabel?: string;
  /** Dialog heading. Defaults to "Import filter". */
  title?: string;
  className?: string;
}

const textareaClass =
  'min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

export function ShadcnImportFilterDialog({
  onImport,
  triggerLabel = 'Import',
  title = 'Import filter',
  className,
}: ShadcnImportFilterDialogProps) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ImportFormat>('dsl');
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<Filter | null>(null);
  const [error, setError] = useState<string | null>(null);
  const titleId = useId();

  const reset = useCallback(() => {
    setText('');
    setPreview(null);
    setError(null);
    setFormat('dsl');
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    reset();
  }, [reset]);

  const handleParse = useCallback(() => {
    const result = parseFilterInput(format, text);
    if (result.ok) {
      setPreview(result.filter);
      setError(null);
    } else {
      setPreview(null);
      setError(result.error);
    }
  }, [format, text]);

  const handleConfirm = useCallback(() => {
    if (!preview) return;
    onImport(preview);
    close();
  }, [preview, onImport, close]);

  const switchFormat = useCallback((next: ImportFormat) => {
    setFormat(next);
    setPreview(null);
    setError(null);
  }, []);

  return (
    <div className={className}>
      <Button variant="outline" onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <button
            aria-label="Close"
            className="absolute inset-0 h-full w-full cursor-default border-0 bg-transparent"
            onClick={close}
            type="button"
          />
          <div
            aria-labelledby={titleId}
            aria-modal="true"
            className="relative z-10 flex w-full max-w-lg flex-col gap-3 rounded-lg border bg-card p-4 text-card-foreground shadow-lg"
            onKeyDown={(event) => {
              if (event.key === 'Escape') close();
            }}
            role="dialog"
          >
            <h2 className="text-base font-semibold" id={titleId}>
              {title}
            </h2>

            <div className="flex gap-2" role="radiogroup" aria-label="Import format">
              {(['dsl', 'json'] as const).map((option) => (
                <Button
                  aria-pressed={format === option}
                  key={option}
                  variant={format === option ? 'default' : 'outline'}
                  onClick={() => switchFormat(option)}
                >
                  {option.toUpperCase()}
                </Button>
              ))}
            </div>

            <textarea
              aria-label="Filter source"
              className={cn(textareaClass)}
              onChange={(event) => {
                setText(event.target.value);
                setPreview(null);
                setError(null);
              }}
              placeholder={
                format === 'dsl' ? 'status:equals:open AND age:gt:18' : '{ "combinator": "and", … }'
              }
              value={text}
            />

            {error ? (
              <p
                className="rounded-md border border-destructive px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            {preview ? (
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Preview</span>
                <code className="block overflow-x-auto rounded-md bg-muted px-3 py-2 text-sm">
                  {formatDSL(preview)}
                </code>
              </div>
            ) : null}

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={close}>
                Cancel
              </Button>
              <Button variant="outline" onClick={handleParse}>
                Parse
              </Button>
              <Button disabled={!preview} onClick={handleConfirm}>
                Confirm import
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
