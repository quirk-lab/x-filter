import type { FieldSchema, Filter } from '@x-filter/core';
import { formatDSL } from '@x-filter/core';
import type { ImportFormat } from '@x-filter/react';
import { parseFilterInput } from '@x-filter/react';
import { Button, Input, Modal, Radio } from 'antd';
import { useCallback, useState } from 'react';

export type { ImportFormat } from '@x-filter/react';

const { TextArea } = Input;

export interface AntdImportFilterDialogProps {
  schema?: FieldSchema[];
  onImport: (filter: Filter) => void;
  /** Label for the trigger button. Defaults to "Import". */
  triggerLabel?: string;
  /** Dialog heading. Defaults to "Import filter". */
  title?: string;
  className?: string;
}

export function AntdImportFilterDialog({
  onImport,
  triggerLabel = 'Import',
  title = 'Import filter',
  className,
}: AntdImportFilterDialogProps) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ImportFormat>('dsl');
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<Filter | null>(null);
  const [error, setError] = useState<string | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setText('');
    setPreview(null);
    setError(null);
    setFormat('dsl');
  }, []);

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

  return (
    <span className={className}>
      <Button onClick={() => setOpen(true)}>{triggerLabel}</Button>
      <Modal
        footer={[
          <Button key="cancel" onClick={close}>
            Cancel
          </Button>,
          <Button key="parse" onClick={handleParse}>
            Parse
          </Button>,
          <Button disabled={!preview} key="confirm" type="primary" onClick={handleConfirm}>
            Confirm import
          </Button>,
        ]}
        onCancel={close}
        open={open}
        title={title}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Radio.Group
            onChange={(event) => {
              setFormat(event.target.value as ImportFormat);
              setPreview(null);
              setError(null);
            }}
            value={format}
          >
            <Radio.Button value="dsl">DSL</Radio.Button>
            <Radio.Button value="json">JSON</Radio.Button>
          </Radio.Group>

          <TextArea
            aria-label="Filter source"
            autoSize={{ minRows: 4 }}
            onChange={(event) => {
              setText(event.target.value);
              setPreview(null);
              setError(null);
            }}
            placeholder={
              format === 'dsl' ? 'status:equals:open AND age:gt:18' : '{ "combinator": "and", … }'
            }
            style={{ fontFamily: 'monospace' }}
            value={text}
          />

          {error ? (
            <div role="alert" style={{ color: '#cf1322' }}>
              {error}
            </div>
          ) : null}

          {preview ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ color: '#8c8c8c', fontSize: '0.8rem' }}>Preview</span>
              <code style={{ display: 'block', overflowX: 'auto' }}>{formatDSL(preview)}</code>
            </div>
          ) : null}
        </div>
      </Modal>
    </span>
  );
}
