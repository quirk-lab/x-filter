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

**Completion**:
Context-aware autocomplete for DSL input. Based on cursor position and `FieldSchema`, suggests field names, operators, or candidate values.
_Avoid_: "autocomplete", "suggestion", "intellisense"

**ViewModel**:
A UI-enriched projection of Filter data. Resolves `FieldSchema` references, attaches validation errors and accessibility labels, and tracks nesting depth. Produced by Headless hooks, consumed by Atomic Components.

**Negate**:
Logical inversion applied to a Rule or Group. A negated Group flips the combined truth value of all its children. Represented by the `not` field on `FilterRule`, `FilterGroup`, and `FilterGroupIC`.

**SQL**:
A compilation target for Filters. `toSQL(filter, options)` produces a parameterized SQL query (`{ sql, params }`). Supports standard and IC representations.