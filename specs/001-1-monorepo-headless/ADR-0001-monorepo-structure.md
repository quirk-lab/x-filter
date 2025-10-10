# ADR 0001: Monorepo Structure & Tooling

## Context

We are building a headless UI component ecosystem that shares core query logic, formatter utilities,
and React bindings. A single monorepo simplifies cross-package changes, enforces shared quality
controls, and enables a runnable playground demo.

## Decision

- Adopt pnpm workspaces with `packages/*` and `apps/playground`
- Use TypeScript project references to enable incremental builds and typed exports
- Standardise on Jest for testing with ≥95% coverage thresholds per package
- Use Vite for the playground to provide a fast developer experience
- Enforce linting/formatting via ESLint + Prettier and Husky Git hooks
- Publish CI workflow (Node 18/20 matrix) covering lint, typecheck, tests, visual regression,
  accessibility checks, coverage uploads, and build verification
- Require CODEOWNERS and branch protection for two-maintainer approvals

## Alternatives Considered

- **Multiple repositories**: rejected due to coordination overhead and drift risk across packages
- **Nx/Turbo monorepo tooling**: unnecessary for current scope; pnpm workspaces are sufficient
- **Storybook for demos**: deferred to future phases; playground provides faster bootstrap for now

## Consequences

- Developers have a single workspace to manage dependencies and run quality gates
- Shared tooling reduces setup drift but requires disciplined dependency upgrades coordinated across
  packages
- Visual regression and accessibility gates catch regressions early at the cost of slightly longer CI
  runs (acceptable trade-off for a consumer library)
