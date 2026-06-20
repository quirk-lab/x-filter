# ADR 0001: Merge useFilterDsl into useDslEditor

- **Status:** Accepted
- **Date:** 2026-06-20

## Context

The `004-ui-modules` PRD promised `useFilterDsl` as the headless DSL draft hook.
Later, `useDslEditor` was introduced to add completion support, but it did not
replace `useFilterDsl`. The two hooks coexisted with near-identical state
management (`prevFilterRef` resync, `tryParseDSL` on commit, `[code] message`
parse-error formatting).

An audit found that `useFilterDsl` had zero real consumers: only its own test
file, the `index.ts` re-export, and `types.ts` referenced it. Every real
consumer (shadcn `DslEditor`, antd `DslEditor`, the README example) used
`useDslEditor`. The only feature unique to `useFilterDsl` was `resetDraft`.

## Decision

Delete `useFilterDsl`. Port `resetDraft` into `useDslEditor`, where it resets
the draft to `formatDSL(filter)` using the `filter` prop (the same source of
truth as the external-resync effect) and does not touch `prevFilterRef`.

Lazily skip completion computation when `cursor === undefined` so that
simple-draft consumers do not pay the per-keystroke `getDslCompletions`
tokenize cost. Remove the unreachable `formatParseError` fallback branch.

Update `specs/004-ui-modules/prd.md`, `specs/004-ui-modules/tasks.md` (T003),
and `docs/plans/2026-05-28-antd-shadcn-deep-support-design.md` to retire the
`useFilterDsl` promise.

## Consequences

- **Breaking:** `useFilterDsl` export removed. `useDslEditor` returns
  `completions: []` when `cursor` is omitted (previously fell back to
  `draftDSL.length`).
- `useDslEditor` gains `resetDraft`.
- The shadcn and antd `DslEditor` components require zero changes (they already
  pass an explicit `cursor` state and do not call `resetDraft`).
- T003 promised to freeze the react-headless-api contract; this merge fulfills
  that obligation by consolidating the DSL API to `useDslEditor` alone.
- The pre-existing "commit then parent reconstructs filter object → draft
  re-formats" behavior is intentionally left unchanged; it is out of scope for
  this merge and would require a deep-equality comparison plus a
  `formatDSL` idempotency guarantee.
