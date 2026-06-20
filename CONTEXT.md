# X-Filter

A schema-driven filter query builder library. Provides a tree-based filter model, DSL engine, and atomic UI components for building filter experiences in React applications.

## Language

**Condition**:
A single atomic expression in the DSL: `field operator value` (e.g. `status:active`). Corresponds to `ASTCondition` in the AST layer.
_Avoid_: Using "condition" to mean a child node in prose. The code field on `FilterGroup` / `FilterGroupIC` is `children`.

**AST**:
The intermediate tree representation produced by parsing DSL text. Nodes: `ASTCondition`, `ASTGroup`, `ASTBinary`, `ASTNot`. Carries source positions (`start`/`end`). Bidirectionally convertible with Filter via `astToFilter` / `filterToAst`.

**Filter**:
The complete query tree. Its root is a `FilterGroup`. Consumers build, pass, and persist a Filter — the whole tree, not a single node.
_Avoid_: Treating Filter as a synonym for FilterGroup.

**IC (Infix Combinator)**:
An alternative representation of `FilterGroup` where combinators are inline separators in the children array (e.g. `[ruleA, 'and', ruleB, 'or', ruleC]`) rather than a property on the group. Closer to DSL syntax, suited for inline editing.
_Avoid_: Calling it "infix format" or "inline combinator" — stick to IC.

**Group**:
A branch node in the Filter tree. In the standard representation (`FilterGroup`), holds a `combinator` field and a `children` list. In the IC representation (`FilterGroupIC`), combinators are inline separators in the `children` list. Both forms support optional negation.

**Rule**:
A leaf node in the Filter tree. Expresses a single predicate: `field operator value`, with optional negation.
_Avoid_: "condition", "clause", "expression"

**Combinator**:
The logic connector (`and` / `or`) between children inside a Group.
_Avoid_: "logic operator", "connector" — Combinator is distinct from Operator.

**Operator**:
A comparison descriptor defined per field via `FieldSchema.operators` (an `OperatorDef` with name, label, and arity). A Rule references an Operator by name string (e.g. `equals`, `contains`, `gt`).
_Avoid_: Using "operator" to mean Combinator.

**DSL**:
A text query syntax for expressing Filters inline. Supports field names, operators, values, parenthesized grouping, and combinators. Bidirectionally convertible with the tree representation.
_Avoid_: "query string", "filter expression", "filter syntax"

**FieldSchema**:
Metadata describing a filterable field: name, display label, type, available operators, and candidate values. The core input that drives the entire system.
_Avoid_: "field definition", "field config"

**Headless**:
The `@x-filter/react` layer. Provides state management and behavior logic (hooks) with no visual elements. Consumers use it to build custom UI.
_Avoid_: "logic layer", "core hooks"

**Atomic Components**:
The `@x-filter/shadcn` / `@x-filter/antd` layer. Composable minimum UI units (FieldSelector, OperatorSelector, ValueEditor, RuleRow, GroupBlock, etc.) built on top of Headless hooks.

**Headless Orchestrator (编排器)**:
The framework-agnostic FilterBuilder orchestration logic that lives in `@x-filter/react`. It consumes `useFilterBuilder` / `useFilterViewModel` / `useReorderContract` and owns action dispatch, DnD wiring, the atomic-rule/atomic-group heuristics, and `renderRule`/`renderGroup`/`renderNode` dispatch — exposed as pure functions plus render-prop hooks (`useFilterBuilderOrchestrator`, `useDslEditorInteraction`). It may render native HTML elements as unstyled semantic structure but MUST NOT import `antd`, `shadcn`, `@dnd-kit`, or emit className-styled components. UI packages reduce their `FilterBuilder` composite to wiring UI primitives onto the orchestrator's render-props.
_Avoid_: Conflating the **Composite** (`ShadcnFilterBuilder` / `AntdFilterBuilder` — an optional convenience layer) with the **Atomic Components** (the primary public API).

**Completion**:
Context-aware autocomplete for DSL input. Based on cursor position and `FieldSchema`, suggests field names, operators, or candidate values.
_Avoid_: "autocomplete", "suggestion", "intellisense"

**ViewModel**:
A UI-enriched projection of Filter data. Resolves `FieldSchema` references, attaches validation errors and accessibility labels, and tracks nesting depth. Produced by Headless hooks, consumed by Atomic Components.

**增量构造 (incremental construction)**:
Reusing ViewModel nodes whose source `Filter` node is `===` to the previous render, so only the mutated spine of the tree allocates new ViewModels. Relies on the structural sharing already produced by core mutations.
_Avoid_: Conflating with 增量渲染 — a structurally-shared ViewModel tree does not by itself prevent re-rendering.

**增量渲染 (incremental rendering)**:
Ensuring only the `<Rule>` / `<Group>` components whose ViewModel is non-`===` actually re-render. Requires the component layer to opt out of redundant renders via `React.memo` + referentially-stable props; 增量构造 is the precondition that makes those props stable.

**Negate**:
Logical inversion applied to a Rule or Group. A negated Group flips the combined truth value of all its children. Represented by the `not` field on `FilterRule`, `FilterGroup`, and `FilterGroupIC`.

**SQL**:
A compilation target for Filters. `toSQL(filter, options)` produces a parameterized SQL query (`{ sql, params }`). Supports standard and IC representations.

**Mutation**:
A pure function that transforms a Filter tree into a new Filter tree. Mutations are immutable — the input is never modified, and unchanged subtrees keep their reference identity (structural sharing).

**Item index**:
The zero-based position of a node among its sibling rules/groups, counting only rules and groups — never IC combinator tokens. Used as the `position` parameter in `moveRule` / `moveRuleIC` so standard and IC modes share the same move semantics.
_Avoid_: "array index", "raw index" — these include combinator tokens in IC mode.

**MutationAdapter**:
An interface (`standardMutationAdapter` / `icMutationAdapter`) that normalizes the parameter differences between standard and IC mutation functions, so mode-agnostic code (and contract tests) can run the same logical scenarios against both representations. `updateGroup` is excluded — its semantics differ fundamentally between modes.