# Parallel mutation functions with abstract MutationAdapter

## Context

x-filter supports two filter representations: standard (`FilterGroup`, combinator as group property) and IC (`FilterGroupIC`, combinator as inline array tokens). Standard mode exposes 7 mutation functions; IC mode only 2. We need to complete the IC mutation API.

The two modes have parameter differences that prevent a single unified API: `addRuleIC` takes a `defaultCombinator`, `updateGroupIC` cannot accept `combinator` (IC groups have no such property), and `moveRuleIC` needs combinator placement logic.

## Decision

Keep **parallel function names** (`addRule` / `addRuleIC`, `updateGroup` / `updateGroupIC`, etc.) rather than unifying into FilterAny functions. Introduce an abstract `MutationAdapter` interface that both modes implement. Contract tests run the same logical scenarios (asserted via item-id lists, not raw array structure) against both adapter implementations.

Shared tree-mutation primitives (`updateGroupInTree`, `updateRuleInTree`, `removeConditionFromTree`) are extracted into `tree-mutations.ts` as FilterAny versions that skip string combinators. Both `mutations.ts`, `ic.ts`, and `negate.ts` import from it. `negateRule` / `negateGroup` are generalized to FilterAny—no IC variants needed.

## Rejected: unified FilterAny functions

A single set of functions that auto-detect the mode was rejected because parameter differences would cause hidden behavior: `addRule`'s `defaultCombinator` would be silently ignored in standard mode, and `updateGroup`'s `combinator` would trigger batch replacement in IC mode. Explicit parallel functions make the mode-specific semantics visible at the call site.
