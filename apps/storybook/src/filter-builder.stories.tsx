import type { Meta, StoryObj } from '@storybook/react';
import { AntdFilterBuilder } from '@x-filter/antd';
import type { FieldSchema, Filter } from '@x-filter/core';
import { formatDSL } from '@x-filter/core';
import type { FilterBuilderClassNames, FilterBuilderSlots } from '@x-filter/react';
import { ShadcnFilterBuilder } from '@x-filter/shadcn';
import type { ComponentType, CSSProperties, ReactNode } from 'react';
import { useState } from 'react';

type BuilderProps = {
  schema: FieldSchema[];
  value: Filter;
  onChange: (filter: Filter) => void;
  dsl?: boolean;
  dnd?: boolean;
  slots?: FilterBuilderSlots;
  classNames?: FilterBuilderClassNames;
};

type BuilderAdapter = {
  name: string;
  Builder: ComponentType<BuilderProps>;
};

const schema: FieldSchema[] = [
  {
    name: 'status',
    label: 'Status',
    type: 'select',
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
    name: 'assignee',
    label: 'Assignee',
    type: 'text',
    operators: [
      { name: 'contains', label: 'contains', arity: 'binary' },
      { name: 'equals', label: 'equals', arity: 'binary' },
    ],
    defaultOperator: 'contains',
  },
  {
    name: 'priority',
    label: 'Priority',
    type: 'number',
    operators: [
      { name: 'gte', label: 'is at least', arity: 'binary' },
      { name: 'lte', label: 'is at most', arity: 'binary' },
      { name: 'between', label: 'is between', arity: 'ternary' },
    ],
  },
  {
    name: 'createdAt',
    label: 'Created date',
    type: 'date',
    operators: [
      { name: 'after', label: 'is after', arity: 'binary' },
      { name: 'before', label: 'is before', arity: 'binary' },
    ],
  },
  {
    name: 'tags',
    label: 'Tags',
    type: 'multiSelect',
    operators: [
      { name: 'includes', label: 'includes', arity: 'binary' },
      { name: 'excludes', label: 'excludes', arity: 'binary' },
    ],
    values: [
      { value: 'bug', label: 'Bug' },
      { value: 'customer', label: 'Customer' },
      { value: 'enterprise', label: 'Enterprise' },
    ],
  },
  {
    name: 'isEscalated',
    label: 'Escalated',
    type: 'boolean',
    operators: [{ name: 'equals', label: 'is', arity: 'binary' }],
  },
];

const adapters: BuilderAdapter[] = [
  { name: 'Ant Design', Builder: AntdFilterBuilder },
  { name: 'shadcn', Builder: ShadcnFilterBuilder },
];

const storyPageStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  padding: '2rem',
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
} satisfies CSSProperties;

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
  gap: '1rem',
  alignItems: 'start',
} satisfies CSSProperties;

const panelStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  border: '1px solid #e2e8f0',
  borderRadius: '16px',
  background: '#fff',
  padding: '1rem',
  boxShadow: '0 18px 48px rgb(15 23 42 / 8%)',
} satisfies CSSProperties;

const stateStyle = {
  margin: 0,
  maxHeight: '18rem',
  overflow: 'auto',
  borderRadius: '12px',
  background: '#0f172a',
  color: '#dbeafe',
  padding: '1rem',
  fontSize: '0.8rem',
} satisfies CSSProperties;

const customClassNames: FilterBuilderClassNames = {
  root: 'storybook-filter-root',
  group: 'storybook-filter-group',
  rule: 'storybook-filter-rule',
  actions: 'storybook-filter-actions',
  dslEditor: 'storybook-dsl-editor',
  completionMenu: 'storybook-completion-menu',
};

function makeBasicFilter(): Filter {
  return {
    id: 'root',
    combinator: 'and',
    conditions: [
      { id: 'status-open', field: 'status', operator: 'equals', value: 'open' },
      {
        id: 'priority-or-owner',
        combinator: 'or',
        conditions: [
          { id: 'priority-high', field: 'priority', operator: 'gte', value: 3 },
          { id: 'assignee-ada', field: 'assignee', operator: 'contains', value: 'Ada' },
        ],
      },
    ],
  };
}

function makeDslFilter(): Filter {
  return {
    id: 'root',
    combinator: 'and',
    conditions: [
      { id: 'status-progress', field: 'status', operator: 'equals', value: 'in progress' },
      { id: 'tag-customer', field: 'tags', operator: 'includes', value: 'customer' },
      { id: 'created-recently', field: 'createdAt', operator: 'after', value: '2026-01-01' },
    ],
  };
}

function makeDndFilter(): Filter {
  return {
    id: 'root',
    combinator: 'and',
    conditions: [
      { id: 'rule-1', field: 'status', operator: 'equals', value: 'open' },
      { id: 'rule-2', field: 'assignee', operator: 'contains', value: 'Grace' },
      { id: 'rule-3', field: 'priority', operator: 'gte', value: 2 },
    ],
  };
}

function makeInvalidFilter(): Filter {
  return {
    id: 'root',
    combinator: 'and',
    conditions: [
      { id: 'unknown-field', field: 'archivedAt', operator: 'before', value: '2025-01-01' },
      { id: 'unknown-operator', field: 'status', operator: 'startsWith', value: 'open' },
    ],
  };
}

function makeSlotFilter(): Filter {
  return {
    id: 'root',
    combinator: 'and',
    conditions: [
      { id: 'slot-assignee', field: 'assignee', operator: 'contains', value: 'Lin' },
      { id: 'slot-status', field: 'status', operator: 'equals', value: 'open' },
    ],
  };
}

function StoryIntro({ title, children }: { title: string; children: ReactNode }) {
  return (
    <header style={{ maxWidth: '56rem' }}>
      <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem' }}>{title}</h1>
      <p style={{ margin: 0, color: '#475569', lineHeight: 1.6 }}>{children}</p>
    </header>
  );
}

function FilterState({ filter }: { filter: Filter }) {
  return (
    <details>
      <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Current filter state</summary>
      <pre style={stateStyle}>{JSON.stringify(filter, null, 2)}</pre>
      <code
        style={{
          display: 'block',
          marginTop: '0.75rem',
          borderRadius: '10px',
          background: '#eff6ff',
          color: '#1d4ed8',
          padding: '0.75rem',
        }}
      >
        {formatDSL(filter)}
      </code>
    </details>
  );
}

function AdapterPanel({
  adapter,
  initialFilter,
  builderProps,
  note,
}: {
  adapter: BuilderAdapter;
  initialFilter: () => Filter;
  builderProps?: Partial<Omit<BuilderProps, 'schema' | 'value' | 'onChange'>>;
  note?: ReactNode;
}) {
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const { Builder } = adapter;

  return (
    <section style={panelStyle}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1rem' }}>{adapter.name}</h2>
        {note ? <p style={{ margin: '0.25rem 0 0', color: '#64748b' }}>{note}</p> : null}
      </div>
      <Builder
        classNames={customClassNames}
        schema={schema}
        value={filter}
        onChange={setFilter}
        {...builderProps}
      />
      <FilterState filter={filter} />
    </section>
  );
}

function PairDemo({
  title,
  description,
  initialFilter,
  builderProps,
  note,
}: {
  title: string;
  description: ReactNode;
  initialFilter: () => Filter;
  builderProps?: Partial<Omit<BuilderProps, 'schema' | 'value' | 'onChange'>>;
  note?: ReactNode;
}) {
  return (
    <main style={storyPageStyle}>
      <StoryIntro title={title}>{description}</StoryIntro>
      <div style={gridStyle}>
        {adapters.map((adapter) => (
          <AdapterPanel
            key={adapter.name}
            adapter={adapter}
            builderProps={builderProps}
            initialFilter={initialFilter}
            note={note}
          />
        ))}
      </div>
    </main>
  );
}

function SingleAdapterDemo({
  adapter,
  title,
  description,
  initialFilter,
  builderProps,
}: {
  adapter: BuilderAdapter;
  title: string;
  description: ReactNode;
  initialFilter: () => Filter;
  builderProps?: Partial<Omit<BuilderProps, 'schema' | 'value' | 'onChange'>>;
}) {
  return (
    <main style={storyPageStyle}>
      <StoryIntro title={title}>{description}</StoryIntro>
      <AdapterPanel adapter={adapter} builderProps={builderProps} initialFilter={initialFilter} />
    </main>
  );
}

const errorSlots: FilterBuilderSlots = {
  Rule: ({ rule, actions }) => {
    const issues = [
      !rule.field ? `Unknown field "${rule.rule.field}"` : null,
      rule.field && !rule.operator ? `Unsupported operator "${rule.rule.operator}"` : null,
    ].filter(Boolean);

    return (
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '0.75rem',
          border: `1px solid ${issues.length > 0 ? '#fecaca' : '#bbf7d0'}`,
          borderRadius: '12px',
          background: issues.length > 0 ? '#fff1f2' : '#f0fdf4',
          padding: '0.75rem',
        }}
      >
        <strong>{rule.id}</strong>
        {issues.length > 0 ? (
          <span style={{ color: '#be123c' }}>{issues.join(' · ')}</span>
        ) : (
          <span style={{ color: '#15803d' }}>Rule is valid</span>
        )}
        <button
          type="button"
          onClick={() =>
            actions.updateRule(rule.id, {
              field: 'status',
              operator: 'equals',
              value: 'open',
            })
          }
        >
          Repair rule
        </button>
      </div>
    );
  },
};

const customSlots: FilterBuilderSlots = {
  Root: ({ children }) => (
    <div
      style={{
        border: '2px dashed #93c5fd',
        borderRadius: '18px',
        background: '#eff6ff',
        padding: '1rem',
      }}
    >
      <strong style={{ display: 'block', marginBottom: '0.75rem' }}>Custom Root slot</strong>
      {children}
    </div>
  ),
  ValueEditor: ({ rule, actions }) => (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Story value</span>
      <input
        style={{
          minWidth: '10rem',
          border: '1px solid #93c5fd',
          borderRadius: '8px',
          padding: '0.45rem 0.6rem',
        }}
        value={String(rule.rule.value ?? '')}
        onChange={(event) => actions.updateRule(rule.id, { value: event.currentTarget.value })}
      />
    </label>
  ),
};

const meta = {
  title: 'Adapters/Filter Builder',
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const AntDesignBasicTree: Story = {
  render: () => (
    <SingleAdapterDemo
      adapter={adapters[0]}
      description="A controlled Ant Design filter tree with nested groups and realistic field types."
      initialFilter={makeBasicFilter}
      title="Ant Design basic tree"
    />
  ),
};

export const ShadcnBasicTree: Story = {
  render: () => (
    <SingleAdapterDemo
      adapter={adapters[1]}
      description="The matching shadcn adapter rendering the same tree data and schema."
      initialFilter={makeBasicFilter}
      title="shadcn basic tree"
    />
  ),
};

export const DslInline: Story = {
  render: () => (
    <PairDemo
      builderProps={{ dsl: true }}
      description="Both adapters expose the inline DSL editor, completions, and builder tree together."
      initialFilter={makeDslFilter}
      title="Inline DSL parity"
    />
  ),
};

export const DnD: Story = {
  render: () => (
    <PairDemo
      builderProps={{ dnd: true }}
      description="Keyboard move controls and sortable handles are enabled for both UI adapters."
      initialFilter={makeDndFilter}
      note="Use the Move buttons to reorder rules without relying on pointer drag in docs mode."
      title="Drag-and-drop parity"
    />
  ),
};

export const ErrorState: Story = {
  render: () => (
    <PairDemo
      builderProps={{ slots: errorSlots }}
      description="Invalid field and operator data is surfaced through a shared Rule slot for both adapters."
      initialFilter={makeInvalidFilter}
      title="Error state"
    />
  ),
};

export const CustomSlot: Story = {
  render: () => (
    <PairDemo
      builderProps={{ slots: customSlots }}
      description="Root and ValueEditor slots customize layout and editing while preserving adapter behavior."
      initialFilter={makeSlotFilter}
      title="Custom slot parity"
    />
  ),
};
