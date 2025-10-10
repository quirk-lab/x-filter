# @x-filter/react

Headless React bindings for the query builder domain. Components expose render props and hooks so UI
layers can remain framework-agnostic while reusing core logic.

## Usage

```tsx
import { QueryBuilder } from '@x-filter/react';

const fields = [
  { key: 'status', label: 'Status', type: 'string' },
  { key: 'priority', label: 'Priority', type: 'number' }
];

<QueryBuilder name="issues" fields={fields}>
  {(api) => (
    <div>
      <button onClick={() => api.addRule({ field: 'status', operator: 'equals', value: 'open' })}>
        Add Status
      </button>
      <pre>{api.serialize()}</pre>
    </div>
  )}
</QueryBuilder>;
```

## Edge Cases & Guidance

- Hooks maintain immutable rule updates; use the returned `reset` helper when syncing remote state.
- Render props run every time the rule list changes; memoise expensive UI segments as needed.
- Ensure parent apps provide the required peer dependency versions of `react` and `react-dom`.
- Provide descriptive labels/aria attributes in consuming UIs—components are unstyled by design but
  must remain accessible.
