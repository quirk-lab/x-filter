import type { Meta, StoryObj } from '@storybook/react';
import type { FieldSchema, Filter } from '@x-filter/core';
import { formatDSL } from '@x-filter/core';
import { useFilterUrlSync } from '@x-filter/react';
import { ShadcnFilterBuilder } from '@x-filter/shadcn';
import { type CSSProperties, useEffect, useRef, useState } from 'react';

const schema: FieldSchema[] = [
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    defaultOperator: 'equals',
    defaultValue: 'open',
    operators: [
      { name: 'equals', label: 'equals', arity: 'binary' },
      { name: 'notEquals', label: 'does not equal', arity: 'binary' },
    ],
    values: [
      { value: 'open', label: 'Open' },
      { value: 'in progress', label: 'In progress' },
      { value: 'closed', label: 'Closed' },
    ],
  },
  {
    name: 'priority',
    label: 'Priority',
    type: 'number',
    defaultOperator: 'gte',
    defaultValue: 3,
    operators: [
      { name: 'gte', label: 'is at least', arity: 'binary' },
      { name: 'between', label: 'is between', arity: 'ternary' },
    ],
  },
];

function makeFilter(): Filter {
  return {
    id: 'root',
    combinator: 'and',
    children: [
      { id: 'status-open', field: 'status', operator: 'equals', value: 'open' },
      { id: 'priority-high', field: 'priority', operator: 'gte', value: 3 },
    ],
  };
}

const pageStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  padding: '2rem',
  maxWidth: '56rem',
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
} satisfies CSSProperties;

const codeStyle = {
  display: 'block',
  borderRadius: '10px',
  background: '#0f172a',
  color: '#dbeafe',
  padding: '0.75rem',
  fontSize: '0.85rem',
  wordBreak: 'break-all',
} satisfies CSSProperties;

function UrlSyncStory() {
  const { getFilterFromUrl, setFilterToUrl, error } = useFilterUrlSync({ mode: 'dsl' });
  const [filter, setFilter] = useState<Filter>(makeFilter);
  const [search, setSearch] = useState('');
  const restored = useRef(false);

  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const fromUrl = getFilterFromUrl();
    if (fromUrl) setFilter(fromUrl);
    setSearch(window.location.search);
  }, [getFilterFromUrl]);

  const sync = (next: Filter) => {
    setFilter(next);
    setFilterToUrl(next);
    setSearch(window.location.search);
  };

  return (
    <main style={pageStyle}>
      <header>
        <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem' }}>URL Sync</h1>
        <p style={{ margin: 0, color: '#475569', lineHeight: 1.6 }}>
          The filter below is mirrored to the page URL as a DSL string via{' '}
          <code>useFilterUrlSync</code>. Editing updates the URL with{' '}
          <code>history.replaceState</code>; reloading restores it from the URL.
        </p>
      </header>

      <ShadcnFilterBuilder dsl onChange={sync} schema={schema} value={filter} />

      <section>
        <h2 style={{ fontSize: '1rem', margin: '0 0 0.5rem' }}>DSL written to URL</h2>
        <code style={codeStyle}>{`?filter=${encodeURIComponent(formatDSL(filter))}`}</code>
      </section>

      <section>
        <h2 style={{ fontSize: '1rem', margin: '0 0 0.5rem' }}>window.location.search</h2>
        <code style={codeStyle}>{search || '(empty — edit a rule to populate)'}</code>
      </section>

      {error ? (
        <p role="alert" style={{ color: '#b91c1c' }}>
          URL parse error: {error}
        </p>
      ) : null}
    </main>
  );
}

const meta = {
  title: 'Hooks/URL Sync',
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <UrlSyncStory />,
};
