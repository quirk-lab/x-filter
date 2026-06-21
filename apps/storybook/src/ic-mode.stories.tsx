import type { Meta, StoryObj } from '@storybook/react';
import type { Filter, FilterIC } from '@x-filter/core';
import { convertFromIC, convertToIC, formatDSL } from '@x-filter/core';
import { ShadcnFilterBuilder } from '@x-filter/shadcn';
import { useState } from 'react';
import { codeStyle, issueSchema, pageStyle, panelStyle, StoryIntro } from './scenario-data';

const baseFilter: Filter = {
  id: 'root',
  combinator: 'and',
  children: [
    { id: 'r-status', field: 'status', operator: 'equals', value: 'open' },
    { id: 'r-label', field: 'labels', operator: 'includes', value: 'bug' },
    { id: 'r-comments', field: 'comments', operator: 'gte', value: 5 },
  ],
};

function ComparisonScenario() {
  const [standard, setStandard] = useState<Filter>(baseFilter);
  const [ic, setIc] = useState<FilterIC>(() => convertToIC(baseFilter));

  return (
    <main style={pageStyle}>
      <StoryIntro title="Standard mode vs Inline-Combinator (IC) mode">
        The same query rendered two ways. Standard mode nests groups with a single combinator
        selector each; IC mode interleaves an editable AND/OR token between every pair of rules (the
        #15 feature). Both edit independently below.
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
          <strong style={{ fontSize: '0.95rem' }}>Standard mode</strong>
          <ShadcnFilterBuilder schema={issueSchema} value={standard} onChange={setStandard} />
          <code style={codeStyle}>{formatDSL(standard) || '(no conditions)'}</code>
        </section>

        <section style={panelStyle}>
          <strong style={{ fontSize: '0.95rem' }}>IC mode (inline combinators)</strong>
          <ShadcnFilterBuilder
            mode="ic"
            schema={issueSchema}
            value={ic}
            onChange={(next) => setIc(next as unknown as FilterIC)}
          />
          <code style={codeStyle}>{formatDSL(convertFromIC(ic)) || '(no conditions)'}</code>
        </section>
      </div>
    </main>
  );
}

const meta = {
  title: 'Scenarios/IC Mode',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <ComparisonScenario />,
};
