# x-filter

A headless filter builder library: composable condition trees, DSL editing, and multi-adapter UI rendering.

## Language

**Filter**:
The root condition tree representing a query. A `Filter` is a `FilterGroup`.
_Avoid_: Query, predicate

**FilterGroup** (standard mode):
A group of conditions combined by a single shared combinator stored as a group property.
_Avoid_: FilterGroupIC (when referring to standard mode)

**FilterGroupIC** (IC mode):
A group where combinators are inline tokens interleaved between conditions in the `conditions` array (odd indices). Each adjacent pair can have a different combinator.
_Avoid_: FilterGroup (when referring to IC mode)

**FilterRule**:
A single field-operator-value condition. The leaf node of a filter tree.

**Combinator**:
The logical operator (`and` | `or`) between conditions. In standard mode it is a group-level property (one value per group). In IC mode it is an inline token between each adjacent pair (potentially different per pair).

**Condition**:
Either a `FilterRule` or a nested group (`FilterGroup` / `FilterGroupIC`). In IC mode the `conditions` array also interleaves combinator tokens; combinators are not conditions.

**Item index**:
The zero-based position of a condition among its sibling conditions, counting only rules and groups—never combinators. Used as the `position` parameter in move operations so that standard and IC modes share the same semantics.
_Avoid_: Array index, raw index (when describing logical position)

**Mutation**:
A pure function that transforms a filter tree into a new filter tree. Mutations are immutable—the input filter is never modified.

**MutationAdapter**:
An interface that normalizes the parameter differences between standard and IC mutation functions so that contract tests can run the same logical scenarios against both modes.
