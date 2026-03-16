import { formatDSL } from '@x-filter/core';
import { useFilterBuilder } from '@x-filter/react';

const schema = [
  {
    name: 'status',
    label: 'Status',
    type: 'select' as const,
    operators: [
      { name: 'equals', label: 'equals', arity: 'binary' as const },
      { name: 'notEquals', label: 'not equals', arity: 'binary' as const },
    ],
    values: [
      { value: 'open', label: 'Open' },
      { value: 'closed', label: 'Closed' },
    ],
  },
  {
    name: 'priority',
    label: 'Priority',
    type: 'number' as const,
    operators: [
      { name: 'equals', label: 'equals', arity: 'binary' as const },
      { name: 'gt', label: '>', arity: 'binary' as const },
    ],
  },
];

function App() {
  const { filter, addRule: addRuleFn } = useFilterBuilder({ schema });

  const handleAddRule = () => {
    addRuleFn(filter.id, { field: 'status', operator: 'equals', value: 'open' });
  };

  const currentDsl = formatDSL(filter);

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>X-Filter Playground</h1>
      <p>Filter Builder Demo</p>

      <div style={{ marginTop: '2rem' }}>
        <h2>Filter State</h2>
        <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '4px' }}>
          {JSON.stringify(filter, null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <h2>DSL Output</h2>
        <code style={{ background: '#f5f5f5', padding: '0.5rem' }}>{currentDsl}</code>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <button type="button" onClick={handleAddRule} style={{ padding: '0.5rem 1rem' }}>
          Add Rule
        </button>
      </div>

      <div
        style={{ marginTop: '2rem', padding: '1rem', background: '#e8f5e9', borderRadius: '4px' }}
      >
        <h3>Dependency Chain</h3>
        <ul>
          <li>@x-filter/core (types, mutations, DSL)</li>
          <li>@x-filter/react (headless hooks)</li>
          <li>@x-filter/shadcn (atomic components)</li>
          <li>@x-filter/antd (atomic components)</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
