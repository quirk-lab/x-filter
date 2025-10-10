# @x-filter/utils

Utility helpers for formatter registration and export pipelines that sit on top of `@x-filter/core`.

## Usage

```ts
import { createQueryDefinition } from '@x-filter/core';
import {
  clearFormatters,
  formatRule,
  registerFormatter,
  exportToDelimitedText
} from '@x-filter/utils';

clearFormatters();
registerFormatter({
  id: 'status-text',
  label: 'Status rule to sentence',
  appliesTo: (rule) => rule.field === 'status',
  format: (rule) => `status ${rule.operator} ${rule.value}`
});

const definition = createQueryDefinition('issues', [
  { key: 'status', label: 'Status', type: 'string' }
]);
const exportResult = exportToDelimitedText({
  ...definition,
  rules: [{ field: 'status', operator: 'equals', value: 'open' }]
});

console.log(exportResult.payload);
```

## Edge Cases & Guidance

- Registry rejects duplicate formatter IDs; call `clearFormatters()` in tests or demo environments to
  avoid cross-run bleed.
- `formatRule` falls back to a basic string representation when no formatter matches—surface this
  state to users to encourage formatter coverage.
- `exportToDelimitedText` uses `,` as the default delimiter; override via `{ delimiter: ';' }` when
  targeting CSV-like consumers.
- `exportToJson` performs a simple JSON serialization suitable for round-tripping with the core
  builders. Custom exporters can wrap the exported payload for storage or integration APIs.
