# Implementation Plan: Monorepo Foundation for Headless UI Library

**Branch**: `001-1-monorepo-headless` | **Date**: 2025-10-11 | **Spec**: /Users/zhouyang/Coding/x-filter/specs/001-1-monorepo-headless/spec.md
**Input**: Feature specification from `/specs/001-1-monorepo-headless/spec.md`

## Summary

Establish a pnpm-based TypeScript monorepo skeleton that delivers a runnable
playground app and placeholder packages for `core`, `utils`, and `react`
(headless components). Scope is structure, shared engineering configuration,
CI gates, and minimal demo wiring only—no production feature code. Outcome is a
workspace that builds, tests, lint-checks, and runs a minimal demo via local
workspace linking with consistent scripts and guardrails.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20.x (CI matrix: 18.x, 20.x)  
**Primary Dependencies**: pnpm workspaces; React 18 (playground only); Vite (playground dev/build); Jest; ESLint; Prettier; Husky  
**Storage**: N/A  
**Testing**: Jest (projects per package); minimal placeholder tests initially  
**Target Platform**: Node (tooling), modern browsers (playground)  
**Project Type**: Monorepo with workspaces (packages + apps)  
**Performance Goals**: Fast local bootstrap; full workspace build < 60s on fresh setup  
**Constraints**: ESM outputs for all packages; type declarations emitted; no cyclic deps; workspace:* deps only  
**Scale/Scope**: Initial skeleton only; no production features; single demo app

## Constitution Check

1. Public API changes documented with runnable examples and migration notes (Consumer-Ready API Contracts).  
   Status: PASS (placeholder APIs include usage snippets and MD docs where applicable for demo).
2. Quality plan enforces linting, static analysis, and dual maintainer reviews (Rigorous Code Quality Controls).  
   Status: PASS (ESLint/Prettier/Husky hooks + CI gates; 2 approvals policy).
3. Coverage strategy keeps line and branch metrics ≥95% with failing-first tests (Comprehensive Test Coverage).  
   Status: PASS — CI thresholds set to ≥95% per package with required tests added in this phase.
4. Documentation deliverables (reference docs, changelog entries, quickstarts) scheduled alongside implementation (Documentation-First Delivery).  
   Status: PASS (Quickstart, package reference stubs with examples/edge cases, and initial CHANGELOG entry for the skeleton).
5. Release plan defines semantic version impact, cross-project smoke tests, and rollback preparation (Predictable Release Discipline).  
   Status: PASS (no publish in this phase; establish semver policy in RELEASE.md and smoke tests; rollback plan documented for later phases).

## Project Structure

### Documentation (this feature)

```
specs/001-1-monorepo-headless/
├── plan.md              # This file
├── research.md          # Phase 0 (to be created)
├── data-model.md        # Phase 1 (to be created)
├── quickstart.md        # Phase 1 (to be created)
├── contracts/           # Phase 1 (if needed later)
└── tasks.md             # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

```
# Monorepo layout
packages/
├── core/                # Query Builder placeholder API (types, empty impl, examples)
├── utils/               # Export converters + Formatter types (empty impl)
└── react/               # Headless components + hooks signatures (props/returns only)

apps/
└── playground/          # Minimal demo app consuming core, utils, react

# Root engineering setup
pnpm-workspace.yaml
package.json             # scripts aligned across workspace
.eslintrc.* / eslint config
.prettierrc.* / prettier config
jest.config.*            # projects targeting each package/app
 tsconfig.base.json
```

**Structure Decision**: Monorepo with `packages/*` and `apps/*` using pnpm workspaces.
Each package is private (`private: true`), publishes ESM outputs and `.d.ts`, and
is consumed by the playground via workspace linking. No cross-package relative
imports; only `workspace:*` semver references. Cycles are disallowed and checked in CI.

## Complexity Tracking

None at this phase; quality bars align with constitution (coverage ≥95%, docs-first, CI gates enforced).

## Complexity Tracking: Guardrails

- Husky hooks: `pre-commit` runs format + lint; `pre-push` runs typecheck + test.  
- CI matrix Node 18/20: install → lint → typecheck → test → build; cache build/test outputs.  
- Package rules: `@x-filter/*` names; `private: true`; aligned `exports/types/main`; `workspace:*` deps only; cycle detection.

## Implementation Notes (Non-goals acknowledged)

- Out of scope: production features, deployment, mobile, multi-tenant, SSR/routing, release pipeline.  
- Demo content is intentionally minimal; serves environment validation only.  
- No Dockerfile/Storybook/long-form docs; include a minimal CHANGELOG entry for the skeleton.

``` 
Scripts (root & packages)
- build: tsc build + d.ts output
- test: jest --passWithNoTests=false
- lint: eslint .
- format: prettier --check / --write
- typecheck: tsc -p .
- dev (playground only): start local app consuming workspace packages
```

Acceptance Alignment:
- `pnpm i` then `pnpm -w build/test/lint` all pass.
- `pnpm -w run dev` launches playground with minimal interactive validation.
- Commits must pass hooks; CI must be green; no formatting drift.
 - Visual regression checks and accessibility checks run in CI.
 - Initial CHANGELOG entry committed with this skeleton.

``` 
Risk Register (initial)
- Tooling version drift across packages → mitigate with root shared configs
- Potential cyclic deps as packages grow → mitigate with CI cycle check
   - Coverage compliance enforced at ≥95% with CI thresholds
```
