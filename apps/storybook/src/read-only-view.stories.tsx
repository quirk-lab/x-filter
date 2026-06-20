import type { Meta, StoryObj } from '@storybook/react';
import { AntdFilterBuilder } from '@x-filter/antd';
import type { Filter } from '@x-filter/core';
import { formatDSL } from '@x-filter/core';
import { ShadcnFilterBuilder } from '@x-filter/shadcn';
import {
  codeStyle,
  filterIssues,
  IssueResults,
  issueSchema,
  pageStyle,
  panelStyle,
  StoryIntro,
} from './scenario-data';

const savedFilter: Filter = {
  id: 'root',
  combinator: 'and',
  children: [
    { id: 'r-status', field: 'status', operator: 'equals', value: 'open' },
    {
      id: 'g-people',
      combinator: 'or',
      children: [
        { id: 'r-assignee', field: 'assignee', operator: 'contains', value: 'ada' },
        { id: 'r-label', field: 'label', operator: 'includes', value: 'bug' },
      ],
    },
  ],
};

const noop = () => {};

function ReadOnlyScenario() {
  const results = filterIssues(savedFilter);

  return (
    <main style={pageStyle}>
      <StoryIntro title="Read-only saved view">
        Viewing a saved filter without allowing edits. The <code>readOnly</code> prop disables every
        control, hides all action buttons / the DSL editor, and turns off drag-and-drop — across
        both adapters. This is the "look at a shared query" mode (issue #22).
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
          <strong style={{ fontSize: '0.95rem' }}>shadcn · readOnly</strong>
          <ShadcnFilterBuilder schema={issueSchema} value={savedFilter} onChange={noop} readOnly />
        </section>
        <section style={panelStyle}>
          <strong style={{ fontSize: '0.95rem' }}>Ant Design · readOnly</strong>
          <AntdFilterBuilder schema={issueSchema} value={savedFilter} onChange={noop} readOnly />
        </section>
      </div>

      <code style={codeStyle}>{formatDSL(savedFilter)}</code>
      <IssueResults rows={results} />
    </main>
  );
}

const meta = {
  title: 'Scenarios/Read-only View',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <ReadOnlyScenario />,
};
