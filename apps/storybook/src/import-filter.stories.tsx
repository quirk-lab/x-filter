import type { Meta, StoryObj } from '@storybook/react';
import type { Filter } from '@x-filter/core';
import { formatDSL } from '@x-filter/core';
import { ShadcnFilterBuilder, ShadcnImportFilterDialog } from '@x-filter/shadcn';
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
  children: [{ id: 'r-status', field: 'status', operator: 'equals', value: 'open' }],
};

function ImportScenario() {
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const results = filterIssues(filter);

  return (
    <main style={pageStyle}>
      <StoryIntro title="Import filter (DSL / JSON)">
        Paste a filter as DSL or JSON, preview it, then load it into the builder. Try{' '}
        <code>status:equals:open AND label:includes:bug</code> in DSL mode (issue #24).
      </StoryIntro>

      <section style={panelStyle}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <ShadcnImportFilterDialog schema={issueSchema} onImport={setFilter} />
        </div>
        <ShadcnFilterBuilder schema={issueSchema} value={filter} onChange={setFilter} />
        <code style={codeStyle}>{formatDSL(filter) || '(no conditions)'}</code>
      </section>

      <IssueResults rows={results} />
    </main>
  );
}

const meta = {
  title: 'Scenarios/Import',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <ImportScenario />,
};
