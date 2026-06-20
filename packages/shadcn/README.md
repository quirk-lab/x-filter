# @x-filter/shadcn

shadcn-style adapter for the headless `@x-filter/react` filter builder.

## Install

```bash
pnpm add @x-filter/shadcn @x-filter/core react react-dom
```

The consuming app is responsible for the usual shadcn/Tailwind environment:

- Tailwind CSS configured for your app.
- shadcn design tokens such as `bg-background`, `border-input`, `text-card-foreground`,
  `ring`, and `destructive`.
- Any global CSS variables used by your shadcn theme.

## Basic Usage

```tsx
import type { FieldSchema, Filter } from '@x-filter/core';
import { formatDSL } from '@x-filter/core';
import { ShadcnFilterBuilder } from '@x-filter/shadcn';
import { useState } from 'react';

const schema: FieldSchema[] = [
  {
    name: 'priority',
    label: 'Priority',
    type: 'number',
    defaultOperator: 'gt',
    defaultValue: 2,
    operators: [
      { name: 'equals', label: 'equals', arity: 'binary' },
      { name: 'gt', label: 'greater than', arity: 'binary' },
    ],
  },
];

const initialFilter: Filter = {
  id: 'root',
  combinator: 'and',
  children: [
    { id: 'rule-priority', field: 'priority', operator: 'gt', value: 2 },
  ],
};

export function ShadcnExample() {
  const [filter, setFilter] = useState<Filter>(initialFilter);

  return (
    <>
      <ShadcnFilterBuilder
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

`ShadcnFilterBuilder` accepts:

- `schema`: field definitions and allowed operators.
- `value` / `onChange`: controlled filter state.
- `defaultValue`: uncontrolled initial filter state.
- `labels`: copy overrides for actions and DSL input labels.
- `classNames`: Tailwind class hooks for root, group, rule, atomic controls,
  actions, DSL, and completion menu.
- `slots`: replacement render functions for `Root`, `Group`, `Rule`,
  `FieldSelector`, `OperatorSelector`, and `ValueEditor`.
- `dsl`: enables the shadcn-style DSL textarea with completions and parse errors.
- `dnd`: enables drag sorting plus keyboard-accessible move buttons.

## Atomic Components and Slots

The adapter exports the composed builder plus atomic components:

- `ShadcnFilterBuilder`, `ShadcnDslEditor`, `ShadcnFilterGroup`,
  `ShadcnFilterRule`.
- `ShadcnFieldSelector`, `ShadcnOperatorSelector`, `ShadcnValueEditor`.
- `ShadcnCombinatorSelector`, `ShadcnNotToggle`, `ShadcnCompletionMenu`.
- `Button`, `Input`, `Select`, `Checkbox`, `Card`, and `cn` primitives.
- `SortableFilterContext`, `SortableFilterItem` for adapter-level DnD wiring.

Use `slots` when you want the adapter to keep state, DSL, DnD, and ARIA wiring
but replace one visual piece:

```tsx
<ShadcnFilterBuilder
  schema={schema}
  slots={{
    Group: ({ group, children, actions }) => (
      <section aria-label={group.aria.label} className="rounded-xl border p-4">
        <button type="button" onClick={() => actions.addRule(group.id)}>
          Add custom rule
        </button>
        {children}
      </section>
    ),
  }}
/>
```

## DSL

Set `dsl` to render `ShadcnDslEditor` above the builder. The editor formats the
current filter with `formatDSL`, suggests completions from the provided schema,
and calls `onChange` only after a successful parse.

## DnD

Set `dnd` to enable `@dnd-kit` sortable rows inside each group. The builder also
renders explicit `Move <id> up/down` buttons so reordering remains available to
keyboard and assistive technology users.

## Accessibility and Keyboard Notes

- Groups and rules receive ARIA labels from `useFilterViewModel`.
- DSL parse failures render with `role="alert"`.
- Completion menus use `role="listbox"` and support `ArrowUp`, `ArrowDown`,
  `Enter`, and `Escape` in the DSL textarea.
- DnD should not be the only reordering path; keep the built-in move buttons or
  provide equivalent controls in custom slots.
