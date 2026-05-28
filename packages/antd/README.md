# @x-filter/antd

Ant Design adapter for the headless `@x-filter/react` filter builder.

## Install

`antd`, `react`, and `react-dom` are peer dependencies and must be installed by
the consuming app.

```bash
pnpm add @x-filter/antd @x-filter/core antd react react-dom
```

## Basic Usage

```tsx
import type { FieldSchema, Filter } from '@x-filter/core';
import { formatDSL } from '@x-filter/core';
import { AntdFilterBuilder } from '@x-filter/antd';
import { useState } from 'react';

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

const initialFilter: Filter = {
  id: 'root',
  combinator: 'and',
  conditions: [
    { id: 'rule-status', field: 'status', operator: 'equals', value: 'open' },
  ],
};

export function AntdExample() {
  const [filter, setFilter] = useState<Filter>(initialFilter);

  return (
    <>
      <AntdFilterBuilder
        dnd
        dsl
        schema={schema}
        value={filter}
        onChange={setFilter}
      />
      <pre>{formatDSL(filter)}</pre>
    </>
  );
}
```

## Component API

`AntdFilterBuilder` accepts:

- `schema`: field definitions and allowed operators.
- `value` / `onChange`: controlled filter state.
- `defaultValue`: uncontrolled initial filter state.
- `labels`: copy overrides for actions and DSL input labels.
- `classNames`: CSS hooks for root, group, rule, atomic controls, actions, DSL,
  and completion menu.
- `slots`: replacement render functions for `Root`, `Group`, `Rule`,
  `FieldSelector`, `OperatorSelector`, and `ValueEditor`.
- `dsl`: enables the Ant Design DSL textarea with completions and parse errors.
- `dnd`: enables drag sorting plus keyboard-accessible move buttons.

## Atomic Components and Slots

The adapter exports the full composed builder plus atomic pieces:

- `AntdFilterBuilder`, `AntdDslEditor`, `AntdFilterGroup`, `AntdFilterRule`.
- `AntdFieldSelector`, `AntdOperatorSelector`, `AntdValueEditor`.
- `AntdCombinatorSelector`, `AntdNotToggle`, `AntdCompletionMenu`.
- `SortableFilterContext`, `SortableFilterItem` for adapter-level DnD wiring.

Use `slots` when you want the adapter to keep state, DSL, DnD, and ARIA wiring
but replace one visual piece:

```tsx
<AntdFilterBuilder
  schema={schema}
  slots={{
    ValueEditor: ({ rule, actions }) => (
      <input
        aria-label="Custom value"
        value={String(rule.rule.value ?? '')}
        onChange={(event) =>
          actions.updateRule(rule.id, { value: event.target.value })
        }
      />
    ),
  }}
/>
```

## DSL

Set `dsl` to render `AntdDslEditor` above the builder. The editor formats the
current filter with `formatDSL`, suggests completions from the provided schema,
and calls `onChange` only after a successful parse.

## DnD

Set `dnd` to enable `@dnd-kit` sortable rows inside each group. The builder also
renders explicit `Move <id> up/down` buttons so reordering remains available to
keyboard and assistive technology users.

## Accessibility and Keyboard Notes

- Groups and rules receive ARIA labels from `useFilterViewModel`.
- DSL parse failures are rendered with Ant Design `Alert`.
- Completion menus use `role="listbox"` and support `ArrowUp`, `ArrowDown`,
  `Enter`, and `Escape` in the DSL textarea.
- DnD should not be the only reordering path; keep the built-in move buttons or
  provide equivalent controls in custom slots.
