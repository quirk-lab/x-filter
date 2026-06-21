import type { Meta, StoryObj } from '@storybook/react';
import type { Filter } from '@x-filter/core';
import { formatDSL } from '@x-filter/core';
import { ShadcnFilterBuilder } from '@x-filter/shadcn';
import { useState } from 'react';
import {
  codeStyle,
  filterIssues,
  IssueResults,
  issueSchema,
  pageStyle,
  panelStyle,
  StoryIntro,
} from './scenario-data';

const initialFilter: Filter = {
  id: 'root',
  combinator: 'and',
  children: [
    { id: 'r-status', field: 'status', operator: 'equals', value: 'open' },
    {
      id: 'g-people',
      combinator: 'or',
      children: [
        { id: 'r-assignee', field: 'assignee', operator: 'contains', value: 'ada' },
        { id: 'r-label', field: 'labels', operator: 'includes', value: 'bug' },
      ],
    },
  ],
};

function NotionScenario() {
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const results = filterIssues(filter);

  return (
    <main style={pageStyle}>
      <StoryIntro title="Notion-style database filter">
        A nested rule tree drives a live "database" view. Edit any condition and the matching issues
        update instantly — the end-to-end loop a Notion filter popover provides.
      </StoryIntro>

      <section style={{ ...panelStyle, background: '#fbfbfa' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.1rem' }}>🗂️</span>
          <strong style={{ fontSize: '0.95rem' }}>Issues · Filtered view</strong>
        </div>
        <ShadcnFilterBuilder schema={issueSchema} value={filter} onChange={setFilter} />
        <code style={codeStyle}>{formatDSL(filter) || '(no conditions)'}</code>
      </section>

      <IssueResults rows={results} />
    </main>
  );
}

const meta = {
  title: 'Scenarios/Notion Filter',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <NotionScenario />,
};
