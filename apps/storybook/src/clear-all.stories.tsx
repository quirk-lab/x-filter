import type { Meta, StoryObj } from '@storybook/react';
import { AntdFilterBuilder } from '@x-filter/antd';
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

function ClearAllScenario() {
  const [shadcnFilter, setShadcnFilter] = useState<Filter>(initialFilter);
  const [antdFilter, setAntdFilter] = useState<Filter>(initialFilter);

  return (
    <main style={pageStyle}>
      <StoryIntro title="Clear all + empty state">
        Press <strong>Clear all</strong> to reset the builder — a two-step confirm guards against
        accidental wipes. Once empty, an inline guide invites you to add the first rule, and the
        button to add is one click away. The toolbar and guide are hidden in <code>readOnly</code>{' '}
        mode (issue #29).
      </StoryIntro>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '1.25rem',
          alignItems: 'start',
        }}
      >
        <section style={panelStyle}>
          <strong style={{ fontSize: '0.95rem' }}>shadcn</strong>
          <ShadcnFilterBuilder
            schema={issueSchema}
            value={shadcnFilter}
            onChange={setShadcnFilter}
          />
        </section>
        <section style={panelStyle}>
          <strong style={{ fontSize: '0.95rem' }}>Ant Design</strong>
          <AntdFilterBuilder schema={issueSchema} value={antdFilter} onChange={setAntdFilter} />
        </section>
      </div>
    </main>
  );
}

const meta = {
  title: 'Scenarios/Clear All',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <ClearAllScenario />,
};
