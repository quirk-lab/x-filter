# X-Filter

[![npm version](https://img.shields.io/npm/v/@x-filter/core.svg)](https://www.npmjs.com/package/@x-filter/core)
[![CI](https://img.shields.io/github/checks/quirk-lab/x-filter/main)](https://github.com/quirk-lab/x-filter/actions)
[![license](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)
[![docs](https://img.shields.io/badge/docs-x--filter.vercel.app-blue)](https://x-filter.vercel.app)

> Schema-driven filter query builder for React — headless core, composable hooks, and product-native adapters for Ant Design and shadcn.

[中文文档](./README.zh-CN.md) | [Documentation](https://x-filter.vercel.app) | [Playground](https://x-filter.vercel.app/playground) | [Changelog](https://x-filter.vercel.app/changelog)

## Features

- **Schema-driven:** Define your fields once; operators, values, and validation derive from the schema.
- **Headless core:** `@x-filter/core` is pure TypeScript with zero runtime dependencies — tree model, mutations, validation, DSL, and query exporters.
- **Composable hooks:** `@x-filter/react` provides `useFilterBuilder`, `useFilterViewModel`, `useFilterUrlSync`, `useFilterHistory` (undo/redo), `useFilterPresets`, `useFilterKeyboardNav`, and more.
- **Two UI adapters:** Ship with `@x-filter/antd` and `@x-filter/shadcn` — both share the same prop contract, so you can swap adapters without changing schema or state.
- **DSL editor:** A single-line token-based DSL input with autocomplete, parse errors, and round-trip conversion to/from the filter tree.
- **Query exporters:** Compile the same `Filter` into SQL (parameterized), JsonLogic, MongoDB query, or Elasticsearch query — all from sub-path imports.
- **IC mode:** Optional inline-combinator tree type (`FilterGroupIC`) for Notion-style builders where combinators sit between rules.
- **Accessibility:** Every builder is an ARIA `tree` with roving tabindex — full keyboard navigation out of the box.
- **i18n:** Built-in `en-US`, `zh-CN`, `ja-JP` locale packs; pass any to the `labels` prop.
- **Responsive:** Mobile-first layout with touch-friendly DnD (44px targets, `TouchSensor` with delay activation).
- **Clone / Lock / Presets:** Clone rules, lock groups from edits, and save/restore filter presets via `useFilterPresets`.
- **Import:** Parse JSON filters or DSL strings into the tree via `parseFilterInput` and the import dialog.

## Packages

| Package | Description | Install |
| --- | --- | --- |
| [`@x-filter/core`](./packages/core) | Tree model, mutations, validation, DSL, query exporters | `pnpm add @x-filter/core` |
| [`@x-filter/react`](./packages/react) | Headless React hooks (state, view model, URL sync, history, presets, keyboard nav) | `pnpm add @x-filter/react` |
| [`@x-filter/shadcn`](./packages/shadcn) | shadcn/Tailwind UI adapter with DnD, DSL editor, import dialog | `pnpm add @x-filter/shadcn` |
| [`@x-filter/antd`](./packages/antd) | Ant Design UI adapter with DnD, DSL editor, import dialog | `pnpm add @x-filter/antd` |

UI adapters depend on `@x-filter/react` which depends on `@x-filter/core`. Install the adapter that matches your design system — the other two come in automatically.

## Quick start

```bash
pnpm add @x-filter/core @x-filter/react @x-filter/antd
```

```tsx
import { useState } from 'react';
import type { FieldSchema, Filter } from '@x-filter/core';
import { AntdFilterBuilder } from '@x-filter/antd';

const schema: FieldSchema[] = [
  { name: 'status', label: 'Status', type: 'select', values: [
    { value: 'open', label: 'Open' },
    { value: 'closed', label: 'Closed' },
  ]},
  { name: 'amount', label: 'Amount', type: 'number', defaultOperator: 'gt' },
];

const initialFilter: Filter = {
  id: 'root', combinator: 'and', children: [],
};

export function Filters() {
  const [filter, setFilter] = useState(initialFilter);
  return <AntdFilterBuilder schema={schema} value={filter} onChange={setFilter} />;
}
```

Validate before sending to your API:

```ts
import { validate } from '@x-filter/core';

const result = validate(filter, schema);
if (!result.valid) {
  console.error(result.errors);
}
```

Export to SQL, JsonLogic, MongoDB, or Elasticsearch:

```ts
import { toSQL } from '@x-filter/core/sql';
import { toJsonLogic, toMongoQuery, toElasticQuery } from '@x-filter/core';

toSQL(filter);           // { sql: 'WHERE ...', params: [...] }
toJsonLogic(filter);     // { and: [{ in: [...] }, ...] }
toMongoQuery(filter);    // { $and: [{ status: { $in: [...] } }, ...] }
toElasticQuery(filter);  // { bool: { must: [...] } }
```

## Why X-Filter?

**vs. React Query Builder:** X-Filter ships a DSL editor, IC (inline-combinator) tree mode, JsonLogic/MongoDB/Elasticsearch exporters, and a headless hooks layer — so you can build a fully custom adapter without fighting the framework.

**vs. building from scratch:** The core handles tree mutations, validation, immutable updates, ID generation, clone/lock, keyboard navigation, and URL sync — so you focus on your UI, not filter data plumbing.

**Adapter parity:** Both `@x-filter/antd` and `@x-filter/shadcn` share the same prop contract (`schema`, `value`, `onChange`, `dsl`, `dnd`, `labels`, `readOnly`, `mode`). Swap adapters by changing one import.

## Documentation

- [Getting Started](https://x-filter.vercel.app/docs/getting-started)
- [Adapters](https://x-filter.vercel.app/docs/adapters)
- [DSL & SQL](https://x-filter.vercel.app/docs/dsl-sql)
- [API Reference](https://x-filter.vercel.app/docs/api)
- [Deployment](https://x-filter.vercel.app/docs/deployment)
- [Playground](https://x-filter.vercel.app/playground)
- [Changelog](https://x-filter.vercel.app/changelog)

## Requirements

- React 18+
- TypeScript 5.6+
- pnpm 9+ (for monorepo development)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup, code style, testing, and pull request process.

## License

[MIT](./LICENSE) © [quirk-lab](https://github.com/quirk-lab)
