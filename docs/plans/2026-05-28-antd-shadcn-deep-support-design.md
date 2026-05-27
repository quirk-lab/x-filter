# Antd and Shadcn Deep Support Design

Date: 2026-05-28

## Goal

Deeply support both Ant Design and shadcn UI for `x-filter` by shipping:

- Real, styled UI adapters for Ant Design v5 and shadcn/Tailwind.
- A shared headless view-model layer in `@x-filter/react`.
- Optional full `FilterBuilder` components for quick adoption.
- Atomic components and slots for advanced customization.

This design intentionally supports both default UI integration and headless extensibility.

## Decisions

- Use a **view-model + adapters** architecture.
- Keep `@x-filter/core` framework-agnostic.
- Put shared interaction state, ARIA metadata, and adapter contracts in `@x-filter/react`.
- Implement styled adapters in `@x-filter/antd` and `@x-filter/shadcn`.
- Provide both atomic components and optional complete `FilterBuilder` components.
- Keep DnD dependencies in UI packages only; `@x-filter/react` exposes the reorder contract.
- Support customization through `slots`, `render*` hooks, `classNames`, and labels.

## Architecture

### `@x-filter/core`

Responsibilities remain unchanged:

- Filter tree model.
- Mutations.
- Validation.
- DSL parsing/formatting/completion.
- JSON and SQL serialization.

No UI, React, DnD, or component-library concepts should enter this package.

### `@x-filter/react`

The React package becomes the shared behavior layer:

- Existing hooks remain:
  - `useFilterBuilder`
  - `useFilterDsl`
  - `useFilterUrlSync`
  - `useReorderContract`
- Add `useFilterViewModel`.
- Add shared adapter contracts:
  - `FilterBuilderSlots`
  - `FilterBuilderClassNames`
  - `FilterBuilderLabels`
  - `FilterBuilderActions`
  - rule/group view-model types

`useFilterViewModel` converts `Filter + FieldSchema + validation/errors` into renderable groups, rules, operations, and ARIA props. UI packages consume this instead of reimplementing behavior.

### `@x-filter/antd`

The Ant Design package provides real Ant Design v5 components:

- `AntdFilterBuilder`
- `AntdFilterGroup`
- `AntdFilterRule`
- `AntdFieldSelector`
- `AntdOperatorSelector`
- `AntdValueEditor`
- `AntdCombinatorSelector`
- `AntdNotToggle`
- `AntdDslEditor`
- `AntdCompletionMenu`

Likely Ant Design primitives:

- `Select`
- `Input`
- `InputNumber`
- `DatePicker`
- `Checkbox`
- `Button`
- `Card`
- `Space`
- `Dropdown`
- `Alert`

### `@x-filter/shadcn`

The shadcn package provides equivalent components using shadcn/Tailwind conventions:

- `ShadcnFilterBuilder`
- `ShadcnFilterGroup`
- `ShadcnFilterRule`
- `ShadcnFieldSelector`
- `ShadcnOperatorSelector`
- `ShadcnValueEditor`
- `ShadcnCombinatorSelector`
- `ShadcnNotToggle`
- `ShadcnDslEditor`
- `ShadcnCompletionMenu`

The package assumes consumers have a shadcn/Tailwind setup. Implementation should avoid hiding that requirement.

## Public API Shape

### Full Builder

```tsx
<AntdFilterBuilder
  schema={schema}
  value={filter}
  onChange={setFilter}
  dsl
  dnd
  slots={{ ValueEditor: MyValueEditor }}
/>
```

The shadcn equivalent should use the same prop names:

```tsx
<ShadcnFilterBuilder
  schema={schema}
  value={filter}
  onChange={setFilter}
  dsl
  dnd
  classNames={{ rule: 'rounded-lg border' }}
/>
```

### Customization

Supported customization surfaces:

- `slots`: replace internal component implementations.
- `renderRuleActions`, `renderGroupActions`, or equivalent render props for targeted overrides.
- `classNames`: shadcn-friendly styling hooks.
- `labels`: user-facing copy and aria-label customization.

Consumers can bypass UI packages entirely by using `@x-filter/react` hooks.

## Interaction Model

- The filter tree is the source of truth.
- Tree edits write directly to `Filter`.
- DSL edits stay in `draftDSL`.
- DSL commits update the tree only after successful parse.
- DSL failures keep the previous tree unchanged and expose parse errors.
- Completion is schema-driven:
  - field suggestions
  - operator suggestions
  - value suggestions
- DnD maps UI drag events to the shared operation:

```ts
{
  type: 'rule' | 'group';
  id: string;
  targetGroupId: string;
  targetIndex: number;
}
```

- URL sync remains opt-in. UI packages may expose examples or a thin prop, but must not bind to a router.

## Error Handling

- Invalid DSL displays parse errors under the DSL editor.
- Invalid schema references display disabled/error component states, not crashes.
- Unknown field types fall back to text input.
- Invalid DnD drops are blocked with `canDrop`.
- Move failures are caught at UI boundaries and surfaced as user-visible errors.
- Validation errors can be generated internally from `validate(filter, schema)` or supplied by consumers.

## Accessibility

Required accessibility behavior:

- All rule/group controls have stable labels.
- Completion UI follows combobox/listbox/option semantics.
- Keyboard support covers:
  - add rule/group
  - delete rule/group
  - switch combinator
  - toggle NOT
  - edit and commit DSL
  - navigate completions
  - move items without mouse-only DnD
- DnD needs keyboard fallback operations.
- UI packages should run `jest-axe` checks for primary states.

## Testing Strategy

### `@x-filter/react`

- Unit-test view-model output.
- Unit-test action handlers and ARIA metadata.
- Keep hook tests for controlled/uncontrolled behavior, DSL, URL sync, and reorder contract.

### UI Packages

- Run a shared behavior test suite against both Ant Design and shadcn adapters.
- Test field/operator/value editing.
- Test add/remove/update group and rule.
- Test DSL success/failure flow.
- Test DnD operations at the adapter boundary.
- Add `jest-axe` checks for builder, rule, group, DSL editor, and completion menu.

### Demo Coverage

Storybook should show:

- Basic tree builder.
- Inline DSL editor.
- DnD reorder.
- Error states.
- Custom slots.
- Ant Design and shadcn parity examples.

## Non-Goals

- No GitHub/GitLab-specific filter semantics.
- No router-specific URL binding.
- No DnD dependency in `@x-filter/react`.
- No visual design system beyond each target component ecosystem.
- No forced use of the full builder; atomic components remain public.

## Rollout

1. Define shared adapter contracts in `@x-filter/react`.
2. Implement `useFilterViewModel`.
3. Build Ant Design atomic components and full builder.
4. Build shadcn atomic components and full builder.
5. Add shared adapter behavior tests.
6. Add DSL completion UI and keyboard behavior.
7. Add DnD integration in both UI packages.
8. Add Storybook demos and documentation.

