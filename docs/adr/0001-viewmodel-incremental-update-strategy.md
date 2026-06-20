# ADR 0001 — ViewModel 增量更新策略

- **Status:** Accepted
- **Date:** 2026-06-20
- **Supersedes:** none

## Context

`useFilterViewModel` projects a `Filter` tree into a `ViewModel` tree
(resolved field/operator, aria labels, validation errors, depth). Its
`useMemo` dependency is the whole `filter` object reference, so any mutation
rebuilds the entire ViewModel tree. The original proposal offered two
candidates:

- **Structural sharing**: each ViewModel carries a source reference; reuse
  nodes whose source is `===`.
- **Per-node hook + Context**: `useRuleViewModel(ruleId)` memoizes each node
  independently.

A load-bearing fact surfaced during review: the core mutators in
`packages/core/src/mutations.ts` (`updateGroupInTree`, `updateRuleInTree`,
`removeConditionFromTree`) **already perform structural sharing** — they
return `root` unchanged when a subtree is untouched, so unchanged
`FilterRule` / `FilterGroup` references retain `===` identity across a
mutation. The ViewModel layer was discarding this already-paid-for identity.

## Decision

Adopt **option A: an identity-aware single `useMemo`** in
`useFilterViewModel`, and **reject option B (per-node hook + Context)**.

Concretely:

1. **Identity-aware ViewModel builder.** Inside the existing `useMemo`, keep
   a per-hook-instance `WeakMap<FilterRule | FilterGroup, ViewModel>` (via
   `useRef`). When recursing, if the source node is `===` to a previously
   cached entry, reuse the cached ViewModel instead of allocating.
2. **Identity-aware `validate`.** `validate` carries forward the previous
   `errors[ruleId]` array reference for `===` source rules, mirroring the
   structural-sharing pattern in `mutations.ts`. The ViewModel cache key is
   the pair `(source ===, errors[ruleId] ===)`. Without this, error
   propagation would force a full ViewModel rebuild and break `React.memo` on
   `<Rule>`.
3. **`React.memo` on the atomic `<Rule>` components.** The ViewModel-layer fix
   is not visible without the render-layer fix. The atomic rule components
   (`ShadcnFilterRule`, `AntdFilterRule`) are wrapped in `React.memo`; their
   props (`rule` ViewModel, `schema`, `className`, `onChange`, `onRemove`) are
   all referentially stable for an unchanged rule thanks to the identity cache
   plus `useFilterBuilder`'s `useCallback`-stabilized actions. **`<Group>` memo
   is deferred:** the atomic group components receive a `children` prop that is
   regenerated as fresh JSX on every parent render, which defeats shallow
   `React.memo`. Making group memo effective requires restructuring the render
   pipeline to lift children out of the memoized chrome (e.g. a
   `GroupChrome` + slot pattern); that is a larger refactor outside this ADR's
   scope. The rule row is the hot path (n rules vs few groups), so deferring
   group memo loses little.
4. **`useRef` for the cache, never module-level.** A module-level `WeakMap`
   would leak across `<FilterBuilder>` instances and across abandoned
   concurrent renders. `useRef` scopes the cache to one hook instance and
   releases it on unmount.
5. **`startTransition` is an optional caller optimization**, not part of the
   API contract.

## Consequences

- **Positive:** ~35 lines of change, zero API change to `useFilterViewModel`
  / `useFilterBuilder` / ViewModel types. Reuses the core layer's existing
  structural sharing. Concurrency-safe by construction (single pure
  snapshot — no tearing risk, unlike a `useSyncExternalStore` subscription
  model). Net positive at any filter scale.
- **Negative:** The `useMemo` still walks the full tree with `===` checks on
  every `filter` reference change — O(n) even when only one node changed.
  Accepted: n is bounded by human authoring capacity, and the per-node cost
  is nanoseconds.
- **Rejected alternative (B):** per-node `useRuleViewModel(ruleId)` +
  Context/subscription. Higher refactor cost; Context value changes
  broadcast to all consumers unless paired with `useSyncExternalStore`,
  which introduces tearing concerns that A avoids for free. Only justified
  when A's O(n) walk is itself the profiler-confirmed bottleneck — for
  human-authored filter trees, effectively never.
- **Future scale path:** hundreds-of-rules scale is handled by **list
  virtualization** (windowing DOM nodes), which is orthogonal to this
  decision and would get its own ADR if pursued.
