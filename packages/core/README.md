# @x-filter/core

Core query builder primitives for the X-Filter headless UI library. The package exposes type-safe
constructs for defining fields and manipulating rules without any UI dependencies.

## Usage

```ts
import {
  createQueryDefinition,
  addRule,
  serializeQuery
} from '@x-filter/core';

const definition = createQueryDefinition('issues', [
  { key: 'status', label: 'Status', type: 'string' },
  { key: 'priority', label: 'Priority', type: 'number' }
]);

const updated = addRule(definition, { field: 'status', operator: 'equals', value: 'open' });
const payload = serializeQuery(updated);
```

## Edge Cases & Guidance

- Unknown fields throw by default; pass `{ allowUnknownFields: true }` when interop with downstream
  systems that enrich rules.
- Attach validators created via `createValidator` to enforce policy (e.g., disallow `status=closed`).
- `replaceRules` copies incoming rules to avoid accidental mutation; prefer it when syncing with
  remote state.
- `serializeQuery` produces stable JSON suitable for signatures or caching—metadata is included even
  if empty to ease signature generation.
