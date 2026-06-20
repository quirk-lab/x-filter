import type { Meta, StoryObj } from '@storybook/react';
import type { Filter } from '@x-filter/core';
import { ShadcnFilterBuilder } from '@x-filter/shadcn';
import { useState } from 'react';
import { issueSchema, pageStyle, panelStyle, StoryIntro } from './scenario-data';

const initialFilter: Filter = {
  id: 'root',
  combinator: 'and',
  children: [
    { id: 'r-status', field: 'status', operator: 'equals', value: 'open' },
    { id: 'r-assignee', field: 'assignee', operator: 'contains', value: 'ada' },
  ],
};

const frameStyle = (width: number) =>
  ({
    width,
    maxWidth: '100%',
    border: '1px solid #cbd5e1',
    borderRadius: '12px',
    padding: '1rem',
    background: '#fff',
  }) as const;

const captionStyle = {
  margin: '0 0 0.5rem',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: '#475569',
} as const;

function ResponsiveScenario() {
  const [filter, setFilter] = useState<Filter>(initialFilter);

  return (
    <main style={pageStyle}>
      <StoryIntro title="Responsive layout">
        Rule controls flow horizontally on wide screens and stack vertically below the{' '}
        <code>sm</code> breakpoint (640px) so each field, operator and value gets a full row on
        phones. Drag handles use a 44px touch target with <code>touch-action: none</code> and a
        long-press <code>TouchSensor</code> (issue #27). Resize the frames below to compare.
      </StoryIntro>

      <section style={{ ...panelStyle, display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <p style={captionStyle}>Phone (360px) — stacked</p>
          <div style={frameStyle(360)}>
            <ShadcnFilterBuilder dnd schema={issueSchema} value={filter} onChange={setFilter} />
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 480 }}>
          <p style={captionStyle}>Desktop — inline</p>
          <div style={frameStyle(720)}>
            <ShadcnFilterBuilder dnd schema={issueSchema} value={filter} onChange={setFilter} />
          </div>
        </div>
      </section>
    </main>
  );
}

const meta = {
  title: 'Scenarios/Responsive',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <ResponsiveScenario />,
};
