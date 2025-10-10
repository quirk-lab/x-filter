# Quickstart: Monorepo Foundation for Headless UI Library

This guide validates the workspace skeleton and ensures the playground demo runs end-to-end.

## Prerequisites

- Node.js 20.x (18.x supported in CI matrix)
- pnpm 9.x (`corepack enable` recommended)

## Install

```bash
pnpm install
```

## Quality Gates (must stay green)

```bash
pnpm lint
pnpm format --check
pnpm typecheck
pnpm test
pnpm build
```

All commands run across workspaces and enforce ≥95% coverage thresholds with visual regression and
accessibility checks wired into the Jest projects.

## Playground Demo

```bash
pnpm dev
```

Visit `http://localhost:5173` and exercise the five demo scenarios. Add, reset, and serialize rules to
confirm package interop.

## Release Hygiene

- Update `CHANGELOG.md` with noteworthy changes before merging
- Keep package README reference sections current with examples and edge-case notes
- Ensure coverage report artifacts upload in CI for dashboard visibility
