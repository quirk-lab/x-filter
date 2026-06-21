import type { Meta, StoryObj } from '@storybook/react';
import type { Filter } from '@x-filter/core';
import { formatDSL } from '@x-filter/core';
import { ShadcnDslTokenInput } from '@x-filter/shadcn';
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
    { id: 'r-label', field: 'labels', operator: 'includes', value: 'bug' },
  ],
};

function GitHubScenario() {
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const results = filterIssues(filter);
  const dsl = formatDSL(filter);
  const shareUrl = `https://example.com/issues?q=${encodeURIComponent(dsl)}`;

  return (
    <main style={pageStyle}>
      <StoryIntro title="GitHub-style issue search bar">
        A single-line, tokenized search bar (the #14 DSL token input). Type{' '}
        <code>field:operator:value</code>, accept completions, and the issue list filters live. The
        committed expression doubles as a shareable URL query (the #17 URL-sync pattern).
      </StoryIntro>

      <section style={panelStyle}>
        <strong style={{ fontSize: '0.95rem' }}>🔍 Search issues</strong>
        <ShadcnDslTokenInput filter={filter} schema={issueSchema} onCommit={setFilter} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Shareable link</span>
          <code style={codeStyle}>{shareUrl}</code>
        </div>
      </section>

      <IssueResults rows={results} />
    </main>
  );
}

const meta = {
  title: 'Scenarios/GitHub Issue Filter',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <GitHubScenario />,
};
