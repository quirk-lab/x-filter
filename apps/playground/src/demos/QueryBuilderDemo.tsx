import { useCallback, useState } from 'react';
import type { QueryField, QueryRule } from '@x-filter/core';
import { QueryBuilder, useQueryBuilder } from '@x-filter/react';
import { clearFormatters, formatRule, registerFormatter } from '@x-filter/utils';

const commonFields: QueryField[] = [
  { key: 'status', label: 'Status', type: 'string', options: ['open', 'closed', 'pending'] },
  { key: 'priority', label: 'Priority', type: 'number', options: [1, 2, 3, 4, 5] },
  { key: 'isArchived', label: 'Archived', type: 'boolean' },
  { key: 'createdAt', label: 'Created At', type: 'date' }
];

const ensureFormatters = (() => {
  let initialised = false;
  return () => {
    if (initialised) {
      return;
    }

    clearFormatters();
    registerFormatter({
      id: 'status-text',
      label: 'Status Text',
      appliesTo: (rule) => rule.field === 'status',
      format: (rule) => `status ${rule.operator} \"${rule.value}\"`
    });
    registerFormatter({
      id: 'priority-number',
      label: 'Priority Number',
      appliesTo: (rule) => rule.field === 'priority',
      format: (rule) => `priority ${rule.operator} ${rule.value}`
    });
    initialised = true;
  };
})();

ensureFormatters();

type DemoScenario = {
  id: string;
  title: string;
  description: string;
  element: () => JSX.Element;
};

const RuleList = ({ rules }: { rules: QueryRule[] }) => (
  <ul data-testid="rule-list">
    {rules.map((rule, index) => (
      <li key={`${rule.field}-${index}`}>
        {formatRule(rule, { name: 'demo', fields: commonFields, rules })}
      </li>
    ))}
  </ul>
);

const BasicQueryDemo = () => (
  <QueryBuilder name="basic" fields={commonFields} onChange={() => {}}>
    {(api) => (
      <div>
        <button
          onClick={() =>
            api.addRule({ field: 'status', operator: 'equals', value: 'open' })
          }
        >
          Add Status Rule
        </button>
        <RuleList rules={api.state.rules} />
      </div>
    )}
  </QueryBuilder>
);

const RangeRuleDemo = () => (
  <QueryBuilder name="range" fields={commonFields} onChange={() => {}}>
    {(api) => (
      <div>
        <button
          onClick={() =>
            api.replaceRules([
              { field: 'priority', operator: '>=', value: 3 },
              { field: 'priority', operator: '<=', value: 5 }
            ])
          }
        >
          Apply Priority Window
        </button>
        <RuleList rules={api.state.rules} />
      </div>
    )}
  </QueryBuilder>
);

const BooleanRuleDemo = () => (
  <QueryBuilder name="boolean" fields={commonFields} onChange={() => {}}>
    {(api) => (
      <div>
        <label>
          <input
            type="checkbox"
            onChange={(event) =>
              api.replaceRules([
                { field: 'isArchived', operator: 'equals', value: event.target.checked }
              ])
            }
          />
          Archived Only
        </label>
        <RuleList rules={api.state.rules} />
      </div>
    )}
  </QueryBuilder>
);

const MultiRuleDemo = () => (
  <QueryBuilder name="multi" fields={commonFields} onChange={() => {}}>
    {(api) => (
      <div>
        <button
          onClick={() =>
            api.addRule({ field: 'createdAt', operator: 'after', value: '2024-01-01' })
          }
        >
          Add Date Rule
        </button>
        <button
          onClick={() =>
            api.addRule({ field: 'status', operator: 'in', value: ['open', 'pending'] })
          }
        >
          Add Status Set
        </button>
        <RuleList rules={api.state.rules} />
      </div>
    )}
  </QueryBuilder>
);

const ResetAndSerializeDemo = () => {
  const [serialised, setSerialised] = useState('');
  const api = useQueryBuilder({ name: 'serialize', fields: commonFields });
  const handleSerialize = useCallback(() => setSerialised(api.serialize()), [api]);

  return (
    <div>
      <div>
        <button
          onClick={() =>
            api.replaceRules([
              { field: 'status', operator: 'equals', value: 'closed' },
              { field: 'priority', operator: '>=', value: 2 }
            ])
          }
        >
          Seed Rules
        </button>
        <button onClick={api.reset}>Reset</button>
        <button onClick={handleSerialize}>Serialize</button>
      </div>
      <RuleList rules={api.state.rules} />
      <pre aria-label="serialized-output">{serialised}</pre>
    </div>
  );
};

export const scenarios: DemoScenario[] = [
  {
    id: 'basic',
    title: 'One-click Status Filter',
    description: 'Adds a simple status rule to verify basic rule addition flows.',
    element: BasicQueryDemo
  },
  {
    id: 'range',
    title: 'Numeric Priority Window',
    description: 'Applies two rules to emulate range selection behaviour.',
    element: RangeRuleDemo
  },
  {
    id: 'boolean',
    title: 'Archived Toggle',
    description: 'Verifies boolean interactions with formatter fallbacks.',
    element: BooleanRuleDemo
  },
  {
    id: 'multi',
    title: 'Combination Builder',
    description: 'Allows stacking multiple rule types to exercise append logic.',
    element: MultiRuleDemo
  },
  {
    id: 'serialize',
    title: 'Reset and Serialize',
    description: 'Ensures serialization output matches expectations after interactions.',
    element: ResetAndSerializeDemo
  }
];

export const QueryBuilderDemoGallery = () => (
  <div>
    {scenarios.map(({ id, element: Element }) => (
      <section key={id}>
        <Element />
      </section>
    ))}
  </div>
);
