import { AntdFilterBuilder } from '@x-filter/antd';
import type { FieldSchema, Filter } from '@x-filter/core';
import { formatDSL } from '@x-filter/core';
import { useFilterViewModel } from '@x-filter/react';
import { ShadcnFilterBuilder } from '@x-filter/shadcn';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import { UrlSyncDemo } from './UrlSyncDemo';

const schema: FieldSchema[] = [
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    defaultOperator: 'equals',
    defaultValue: 'open',
    operators: [
      { name: 'equals', label: 'equals', arity: 'binary' },
      { name: 'notEquals', label: 'not equals', arity: 'binary' },
    ],
    values: [
      { value: 'open', label: 'Open' },
      { value: 'closed', label: 'Closed' },
      { value: 'pending', label: 'Pending' },
    ],
  },
  {
    name: 'priority',
    label: 'Priority',
    type: 'number',
    defaultOperator: 'gt',
    defaultValue: 2,
    operators: [
      { name: 'equals', label: 'equals', arity: 'binary' },
      { name: 'gt', label: 'greater than', arity: 'binary' },
      { name: 'between', label: 'between', arity: 'ternary' },
    ],
  },
  {
    name: 'assignee',
    label: 'Assignee',
    type: 'text',
    defaultOperator: 'contains',
    defaultValue: 'alex',
    operators: [
      { name: 'contains', label: 'contains', arity: 'binary' },
      { name: 'equals', label: 'equals', arity: 'binary' },
      { name: 'isEmpty', label: 'is empty', arity: 'unary' },
    ],
  },
];

function createInitialFilter(): Filter {
  return {
    id: 'root',
    combinator: 'and',
    children: [
      {
        id: 'rule-status',
        field: 'status',
        operator: 'equals',
        value: 'open',
      },
      {
        id: 'rule-priority',
        field: 'priority',
        operator: 'gt',
        value: 2,
      },
    ],
  };
}

const styles = {
  page: {
    minHeight: '100vh',
    padding: '2rem',
    background: '#f8fafc',
    color: '#0f172a',
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  header: {
    maxWidth: '1180px',
    margin: '0 auto 1.5rem',
  },
  lead: {
    maxWidth: '760px',
    color: '#475569',
    lineHeight: 1.6,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: '1.5rem',
    maxWidth: '1180px',
    margin: '0 auto',
    alignItems: 'start',
  },
  card: {
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '1.25rem',
    background: '#ffffff',
    boxShadow: '0 18px 45px rgba(15, 23, 42, 0.08)',
  },
  cardHeader: {
    marginTop: 0,
    marginBottom: '0.25rem',
  },
  muted: {
    marginTop: 0,
    color: '#64748b',
    fontSize: '0.95rem',
  },
  builderShell: {
    marginTop: '1rem',
  },
  pre: {
    overflow: 'auto',
    maxHeight: '320px',
    margin: 0,
    padding: '1rem',
    borderRadius: '12px',
    background: '#0f172a',
    color: '#e2e8f0',
    fontSize: '0.82rem',
  },
  code: {
    display: 'block',
    overflowX: 'auto',
    padding: '0.75rem',
    borderRadius: '10px',
    background: '#f1f5f9',
    color: '#334155',
  },
  stack: {
    display: 'grid',
    gap: '1rem',
    marginTop: '1rem',
  },
  diagnostics: {
    maxWidth: '1180px',
    margin: '1.5rem auto 0',
  },
  list: {
    marginBottom: 0,
    paddingLeft: '1.2rem',
    color: '#475569',
  },
} satisfies Record<string, CSSProperties>;

function StatePanel({ title, filter }: { title: string; filter: Filter }) {
  return (
    <div style={styles.stack}>
      <section>
        <h3>{title} DSL</h3>
        <code style={styles.code}>{formatDSL(filter)}</code>
      </section>
      <section>
        <h3>{title} JSON State</h3>
        <pre style={styles.pre}>{JSON.stringify(filter, null, 2)}</pre>
      </section>
    </div>
  );
}

function App() {
  const [antdFilter, setAntdFilter] = useState<Filter>(() => createInitialFilter());
  const [shadcnFilter, setShadcnFilter] = useState<Filter>(() => createInitialFilter());
  const antdViewModel = useFilterViewModel({ filter: antdFilter, schema });

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <h1>X-Filter Playground</h1>
        <p style={styles.lead}>
          This app renders both UI adapters against the same schema and initial filter shape. Ant
          Design has DSL and DnD enabled, while the shadcn adapter demonstrates the same controlled
          filter contract.
        </p>
      </header>

      <div style={styles.grid}>
        <section style={styles.card}>
          <h2 style={styles.cardHeader}>Ant Design Adapter</h2>
          <p style={styles.muted}>Controlled builder with DSL editor and DnD controls enabled.</p>
          <div style={styles.builderShell}>
            <AntdFilterBuilder
              dnd
              dsl
              schema={schema}
              value={antdFilter}
              onChange={setAntdFilter}
            />
          </div>
          <StatePanel filter={antdFilter} title="Antd" />
        </section>

        <section style={styles.card}>
          <h2 style={styles.cardHeader}>shadcn Adapter</h2>
          <p style={styles.muted}>
            Controlled builder using the same schema and equivalent initial filter state.
          </p>
          <div style={styles.builderShell}>
            <ShadcnFilterBuilder
              dsl
              schema={schema}
              value={shadcnFilter}
              onChange={setShadcnFilter}
            />
          </div>
          <StatePanel filter={shadcnFilter} title="Shadcn" />
        </section>
      </div>

      <UrlSyncDemo
        initialFilter={createInitialFilter()}
        schema={schema}
        styles={{
          card: { ...styles.card, ...styles.diagnostics },
          cardHeader: styles.cardHeader,
          muted: styles.muted,
          builderShell: styles.builderShell,
          code: styles.code,
        }}
      />

      <section style={{ ...styles.card, ...styles.diagnostics }}>
        <h2 style={styles.cardHeader}>Core → React → Adapter Chain</h2>
        <p style={styles.muted}>
          The adapters mutate core filter state, this playground formats that state with core DSL
          helpers, and the React view model resolves render metadata.
        </p>
        <ul style={styles.list}>
          <li>@x-filter/core: `Filter`, schema types, mutations, and `formatDSL`.</li>
          <li>
            @x-filter/react: `useFilterViewModel` reports {antdViewModel.root.children.length} root
            children.
          </li>
          <li>@x-filter/antd: `AntdFilterBuilder` renders DSL, DnD, and atomic controls.</li>
          <li>@x-filter/shadcn: `ShadcnFilterBuilder` renders the same builder contract.</li>
        </ul>
      </section>
    </main>
  );
}

export default App;
