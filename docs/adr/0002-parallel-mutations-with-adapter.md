# Parallel mutation functions with abstract MutationAdapter

## Context

x-filter supports two filter representations: standard (`FilterGroup`, combinator as group property) and IC (`FilterGroupIC`, combinator as inline array tokens). Standard mode exposes 7 mutation functions; IC mode only 2 (`addRuleIC`, `removeRuleIC`). We need to complete the IC mutation API.

The two modes have parameter differences that prevent a single unified API: `addRuleIC` takes a `defaultCombinator`, `updateGroupIC` cannot accept `combinator` (IC groups have no such property), and `moveRuleIC` needs combinator placement logic.

## Decision

Keep **parallel function names** (`addRule` / `addRuleIC`, `updateGroup` / `updateGroupIC`, etc.) rather than unifying into FilterAny functions. Introduce an abstract `MutationAdapter` interface that both modes implement (`standardMutationAdapter`, `icMutationAdapter`). Contract tests run the same logical scenarios (asserted via item-id lists, not raw array structure) against both implementations.

Add the missing IC functions: `updateRuleIC`, `updateGroupIC`, `addGroupIC`, `removeGroupIC`, `moveRuleIC`. `moveRuleIC` uses **item-index** position semantics (counting only rules/groups, not combinators) so it matches the standard `moveRule`.

`negateRule` / `negateGroup` are generalized to `FilterAny` (via overloads) — no `negateRuleIC` / `negateGroupIC` variants needed, since negate only toggles the `not` flag on a node.

### Built on the ADR 0001 tree-walker primitives

The shared traversal/transform layer is the `walk` / `mapTree` / `updateById` / `findById` primitives from **ADR 0001**, which already operate over `FilterAny` and skip inline combinator strings. The IC mutations and the generalized negate are implemented directly on those primitives.

No separate `tree-mutations.ts` (`updateGroupInTreeAny` / `updateRuleInTreeAny` / `removeConditionFromTreeAny` / …) layer is introduced: `updateById` subsumes the by-id update helpers, `findById` subsumes the by-id finders, and `mapTree` subsumes the structural transforms. The only genuinely IC-specific concern is combinator cleanup (drop an adjacent combinator on remove, place one on insert), which lives in small IC-local helpers (`removeItemAtArrayIdx`, `insertRuleIC`).

## Rejected: unified FilterAny functions

A single set of functions that auto-detect the mode was rejected because parameter differences would cause hidden behavior: `addRule`'s `defaultCombinator` would be silently ignored in standard mode, and `updateGroup`'s `combinator` would trigger batch replacement in IC mode. Explicit parallel functions make the mode-specific semantics visible at the call site.

`updateGroup` is intentionally excluded from `MutationAdapter` — standard accepts `combinator`, IC does not; a union parameter would hide mode-specific behavior.

## Rejected: a parallel `tree-mutations.ts` primitive layer

The original PR (#9, arch-5) extracted FilterAny-aware `*Any` helpers into `tree-mutations.ts`. During integration this was found to duplicate the ADR 0001 `mapTree` / `updateById` / `findById` primitives, which already cover FilterAny and combinator-skipping. To avoid two overlapping traversal layers, the IC API was reimplemented on the ADR 0001 primitives and `tree-mutations.ts` was dropped.
