import type { Meta, StoryObj } from '@storybook/react';
import type { Filter } from '@x-filter/core';
import { formatDSL } from '@x-filter/core';
import { ShadcnFilterBuilder } from '@x-filter/shadcn';
import { useState } from 'react';
import { codeStyle, issueSchema, pageStyle, panelStyle, StoryIntro } from './scenario-data';

const initialFilter: Filter = {
  id: 'root',
  combinator: 'and',
  children: [
    { id: 'r-status', field: 'status', operator: 'equals', value: 'open' },
    {
      id: 'g-meta',
      combinator: 'or',
      children: [
        { id: 'r-assignee', field: 'assignee', operator: 'contains', value: 'ada' },
        { id: 'r-author', field: 'author', operator: 'contains', value: 'lin' },
      ],
    },
  ],
};

const keyStyle = {
  display: 'inline-block',
  minWidth: '1.4rem',
  textAlign: 'center',
  padding: '0.1rem 0.4rem',
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  background: '#f8fafc',
  fontFamily: 'ui-monospace, monospace',
  fontSize: '0.8rem',
} as const;

const SHORTCUTS: [string, string][] = [
  ['Tab', 'Move focus onto the filter tree'],
  ['↑ / ↓', 'Move row focus to the previous / next condition'],
  ['Home / End', 'Jump to the first / last condition'],
  ['Enter', 'Focus the first control of the current row'],
  ['Esc', 'Return focus from a control back to its row'],
  ['Delete', 'Remove the focused condition'],
  ['Ctrl / Cmd + D', 'Clone the focused condition'],
];

function KeyboardNavScenario() {
  const [filter, setFilter] = useState<Filter>(initialFilter);

  return (
    <main style={pageStyle}>
      <StoryIntro title="Keyboard navigation">
        The builder is an ARIA <code>tree</code>: every condition and group is a{' '}
        <code>treeitem</code> reachable by keyboard with a roving tabindex. Click a row (or press{' '}
        <kbd>Tab</kbd>), then drive the whole tree without a mouse (issue #25).
      </StoryIntro>

      <section style={panelStyle}>
        <table style={{ borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <tbody>
            {SHORTCUTS.map(([keys, desc]) => (
              <tr key={keys}>
                <td style={{ padding: '0.25rem 1rem 0.25rem 0', whiteSpace: 'nowrap' }}>
                  <span style={keyStyle}>{keys}</span>
                </td>
                <td style={{ padding: '0.25rem 0', color: '#475569' }}>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={panelStyle}>
        <ShadcnFilterBuilder schema={issueSchema} value={filter} onChange={setFilter} />
        <code style={codeStyle}>{formatDSL(filter) || '(no conditions)'}</code>
      </section>
    </main>
  );
}

const meta = {
  title: 'Scenarios/Keyboard Navigation',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <KeyboardNavScenario />,
};
