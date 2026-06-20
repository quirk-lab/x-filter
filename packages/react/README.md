# @x-filter/react

Headless React layer for `@x-filter/core`. This package owns React state,
view-model shaping, DSL editor state, and adapter contracts without rendering a
specific UI kit.

## Install

```bash
pnpm add @x-filter/react @x-filter/core react react-dom
```

## Concepts

- `useFilterBuilder` manages controlled or uncontrolled `Filter` state and wraps
  core mutations such as `addRule`, `updateRule`, `addGroup`, and `moveRule`.
- `useFilterViewModel` turns a core `Filter` plus `FieldSchema[]` into UI-ready
  rule/group nodes with resolved field metadata, operator metadata, validation
  errors, and ARIA labels.
- `useDslEditor` keeps a formatted DSL draft in sync with the current filter,
  exposes completions, parses on commit, and reports parse errors.
- `useReorderContract` exposes adapter-friendly reorder handlers used by DnD
  implementations.

## Minimal Builder

```tsx
import type { FieldSchema } from '@x-filter/core';
import { formatDSL } from '@x-filter/core';
import { useFilterBuilder, useFilterViewModel } from '@x-filter/react';

const schema: FieldSchema[] = [
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    defaultOperator: 'equals',
    defaultValue: 'open',
    operators: [{ name: 'equals', label: 'equals', arity: 'binary' }],
    values: [
      { value: 'open', label: 'Open' },
      { value: 'closed', label: 'Closed' },
    ],
  },
];

export function HeadlessFilter() {
  const builder = useFilterBuilder({ schema });
  const viewModel = useFilterViewModel({
    filter: builder.filter,
    schema: builder.schema,
  });

  return (
    <section aria-label={viewModel.root.aria.label}>
      <button
        type="button"
        onClick={() =>
          builder.addRule(builder.filter.id, {
            field: 'status',
            operator: 'equals',
            value: 'open',
          })
        }
      >
        Add status rule
      </button>
      <pre>{formatDSL(builder.filter)}</pre>
      <pre>{JSON.stringify(viewModel.root, null, 2)}</pre>
    </section>
  );
}
```

## DSL Editor

```tsx
import type { FieldSchema, Filter } from '@x-filter/core';
import { useDslEditor } from '@x-filter/react';
import { useState } from 'react';

export function DslTextarea({
  filter,
  schema,
  onCommit,
}: {
  filter: Filter;
  schema: FieldSchema[];
  onCommit: (filter: Filter) => void;
}) {
  const [cursor, setCursor] = useState<number | undefined>();
  const editor = useDslEditor({ filter, schema, onCommit, cursor });

  return (
    <div>
      <textarea
        aria-label="Filter DSL"
        value={editor.draftDSL}
        onChange={(event) => {
          editor.setDraftDSL(event.target.value);
          setCursor(event.target.selectionStart ?? event.target.value.length);
        }}
        onSelect={(event) =>
          setCursor((event.target as HTMLTextAreaElement).selectionStart ?? editor.draftDSL.length)
        }
      />
      <button type="button" onClick={editor.commit}>
        Apply DSL
      </button>
      {editor.parseError ? <p role="alert">{editor.parseError}</p> : null}
      <ul>
        {editor.completions.map((item) => (
          <li key={`${item.kind}-${item.value}`}>{item.label}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Adapter Consumption

UI adapters such as `@x-filter/antd` and `@x-filter/shadcn` consume this layer by
calling:

1. `useFilterBuilder({ schema, value, defaultValue, onChange })` for state and
   core mutation handlers.
2. `useFilterViewModel({ filter, schema, errors })` for renderable groups/rules.
3. `useDslEditor` when a `dsl` editor is enabled.
4. `useReorderContract` when a `dnd` experience is enabled.

Adapters should pass the same `schema`, `value`, and `onChange` contract through
to consumers, expose `slots` for replacing atomic pieces, and preserve the ARIA
metadata from the view model.
