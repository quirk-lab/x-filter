import type { Meta, StoryObj } from '@storybook/react';
import type { Filter } from '@x-filter/core';
import { useFilterValidation } from '@x-filter/react';
import { ShadcnFilterBuilder } from '@x-filter/shadcn';
import { useState } from 'react';
import { issueSchema, pageStyle, panelStyle, StoryIntro } from './scenario-data';

const invalidFilter: Filter = {
  id: 'root',
  combinator: 'and',
  children: [
    { id: 'r-valid', field: 'status', operator: 'equals', value: 'open' },
    { id: 'r-bad-field', field: 'archivedAt', operator: 'before', value: '2026-01-01' },
    { id: 'r-bad-operator', field: 'status', operator: 'startsWith', value: 'open' },
    { id: 'r-missing-value', field: 'comments', operator: 'gte', value: null },
  ],
};

function ValidationScenario() {
  const [filter, setFilter] = useState<Filter>(invalidFilter);
  const validation = useFilterValidation({ filter, schema: issueSchema });
  const errorCount = Object.values(validation.errors).reduce((sum, list) => sum + list.length, 0);

  return (
    <main style={pageStyle}>
      <StoryIntro title="Inline validation">
        The builder is seeded with an unknown field, an unsupported operator, and a missing value.
        Errors from <code>useFilterValidation</code> are threaded into the builder, which renders an
        inline red border and message beside each offending input (the #13 feature). Fix a row and
        its error clears.
      </StoryIntro>

      <section style={panelStyle}>
        <div
          aria-live="polite"
          style={{
            alignSelf: 'flex-start',
            borderRadius: '999px',
            padding: '0.25rem 0.75rem',
            fontSize: '0.82rem',
            fontWeight: 600,
            background: validation.valid ? '#dcfce7' : '#fee2e2',
            color: validation.valid ? '#15803d' : '#b91c1c',
          }}
        >
          {validation.valid ? 'All rules valid' : `${errorCount} validation error(s)`}
        </div>
        <ShadcnFilterBuilder
          schema={issueSchema}
          value={filter}
          onChange={setFilter}
          errors={validation.errors}
        />
      </section>
    </main>
  );
}

const meta = {
  title: 'Scenarios/Validation',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <ValidationScenario />,
};
