import type { Meta, StoryObj } from '@storybook/react';
import type { Filter } from '@x-filter/core';
import { formatDSL } from '@x-filter/core';
import { useFilterHistory } from '@x-filter/react';
import { ShadcnFilterBuilder } from '@x-filter/shadcn';
import { useEffect } from 'react';
import { codeStyle, issueSchema, pageStyle, panelStyle, StoryIntro } from './scenario-data';

const initialFilter: Filter = {
  id: 'root',
  combinator: 'and',
  children: [{ id: 'r-status', field: 'status', operator: 'equals', value: 'open' }],
};

const toolbarButtonStyle = {
  borderRadius: '8px',
  border: '1px solid #cbd5e1',
  background: '#fff',
  padding: '0.4rem 0.9rem',
  fontSize: '0.85rem',
  cursor: 'pointer',
} as const;

function UndoRedoScenario() {
  const history = useFilterHistory({ initialFilter, maxHistory: 50 });
  const { undo, redo, canUndo, canRedo } = history;

  // Ctrl/Cmd+Z to undo, Ctrl/Cmd+Shift+Z to redo.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z') return;
      event.preventDefault();
      if (event.shiftKey) {
        redo();
      } else {
        undo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [undo, redo]);

  return (
    <main style={pageStyle}>
      <StoryIntro title="Undo / Redo history">
        <code>useFilterHistory</code> wraps the filter state in a past/present/future stack. Edit
        the filter, then step backward and forward. Keyboard: <kbd>Ctrl/Cmd+Z</kbd> undo,{' '}
        <kbd>Ctrl/Cmd+Shift+Z</kbd> redo (issue #23).
      </StoryIntro>

      <section style={panelStyle}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            style={{ ...toolbarButtonStyle, opacity: canUndo ? 1 : 0.4 }}
            disabled={!canUndo}
            onClick={undo}
          >
            ↶ Undo
          </button>
          <button
            type="button"
            style={{ ...toolbarButtonStyle, opacity: canRedo ? 1 : 0.4 }}
            disabled={!canRedo}
            onClick={redo}
          >
            ↷ Redo
          </button>
          <button type="button" style={toolbarButtonStyle} onClick={history.clear}>
            Clear history
          </button>
        </div>
        <ShadcnFilterBuilder
          schema={issueSchema}
          value={history.current}
          onChange={history.setFilter}
        />
        <code style={codeStyle}>{formatDSL(history.current) || '(no conditions)'}</code>
      </section>
    </main>
  );
}

const meta = {
  title: 'Scenarios/Undo Redo',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <UndoRedoScenario />,
};
