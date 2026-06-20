# Changelog

## Unreleased

### Breaking
- Removed `useFilterDsl` from `@x-filter/react`. Use `useDslEditor` instead;
  `resetDraft` is now available on `useDslEditor`.
- `useDslEditor` now returns `completions: []` when the `cursor` option is
  omitted, instead of falling back to `draftDSL.length`. Pass an explicit
  `cursor` to receive completions.

### Added
- `useDslEditor` now exposes `resetDraft()` to discard the current draft and
  return to `formatDSL(filter)`.

### Performance
- `useDslEditor` skips `getDslCompletions` tokenization when `cursor` is
  `undefined`.

### Docs
- Retired `useFilterDsl` from `specs/004-ui-modules/prd.md` and
  `docs/plans/2026-05-28-antd-shadcn-deep-support-design.md`.
- Added ADR 0001 recording the merge decision.

## 0.0.0 — Monorepo Skeleton (2025-10-11)

- Introduced pnpm-based workspace with `packages/core`, `packages/utils`, `packages/react`, and `apps/playground`
- Added shared tooling: TypeScript project references, ESLint, Prettier, Husky hooks, Jest projects (≥95% coverage)
- Wired CI pipeline with lint, typecheck, test, build, visual regression, accessibility, and coverage artifact publishing
- Delivered playground demo with five scenarios exercising core logic, formatter utilities, and headless components
