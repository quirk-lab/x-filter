# @x-filter/antd

## 0.2.0

### Minor Changes

- Initial public release of X-Filter — a schema-driven filter query builder for React.

  ## Packages

  - **@x-filter/core** — Tree model, immutable mutations, validation, DSL parser/formatter, and query exporters (SQL, JsonLogic, MongoDB, Elasticsearch). Zero runtime dependencies.
  - **@x-filter/react** — Headless React hooks: state management, view models, DSL editor, URL sync, presets, undo/redo, and ARIA tree keyboard navigation.
  - **@x-filter/antd** — Ant Design UI adapter with DnD, DSL editor, and keyboard navigation.
  - **@x-filter/shadcn** — shadcn/Tailwind UI adapter with DnD, DSL editor, and keyboard navigation.

  ## Key features

  - **DSL editor** — Single-line token-based DSL with autocomplete and parse errors (unique among filter builders)
  - **IC mode** — Inline-combinator tree type for Notion-style filters (unique)
  - **Composable hooks** — Separate hooks for URL sync, presets, history, keyboard nav
  - **Adapter parity** — Both Ant Design and shadcn share identical prop contracts
  - **Accessibility** — Full ARIA tree with roving tabindex out of the box
  - **Query exporters** — SQL, JsonLogic, MongoDB, Elasticsearch
  - **TypeScript-first** — Full type inference for fields and operators

### Patch Changes

- Updated dependencies []:
  - @x-filter/core@0.2.0
  - @x-filter/react@0.2.0
