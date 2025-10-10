---
description: "Task list for Monorepo Foundation for Headless UI Library"
---

# Tasks: Monorepo Foundation for Headless UI Library

**Input**: Design documents from `/specs/001-1-monorepo-headless/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: Automated tests are mandatory per constitution. Maintain ≥95% line and branch coverage per package in this phase. Write tests first for each story.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions
- Monorepo layout with `packages/*` and `apps/*`
- Root engineering files live at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 [US1] Create root `pnpm-workspace.yaml` with workspaces: `packages/*`, `apps/*` (repo root)
- [ ] T002 [US1] Initialize root `package.json` (name, `private:true`, scripts placeholder, `packageManager` pnpm) at `/Users/zhouyang/Coding/x-filter/package.json`
- [ ] T003 [P] [US1] Add root TypeScript base config at `/Users/zhouyang/Coding/x-filter/tsconfig.base.json` (module: ESM, strict, composite defaults)
- [ ] T004 [P] [US1] Add ESLint config `/Users/zhouyang/Coding/x-filter/.eslintrc.json` and ignore `/Users/zhouyang/Coding/x-filter/.eslintignore`
- [ ] T005 [P] [US1] Add Prettier config `/Users/zhouyang/Coding/x-filter/.prettierrc` and ignore `/Users/zhouyang/Coding/x-filter/.prettierignore`
- [ ] T006 [US1] Add Jest root config at `/Users/zhouyang/Coding/x-filter/jest.config.js` with `projects` pointing to each package/app
- [ ] T007 [US1] Initialize Husky: add `prepare` script in root and create hooks `/Users/zhouyang/Coding/x-filter/.husky/pre-commit` (format+lint) and `/Users/zhouyang/Coding/x-filter/.husky/pre-push` (typecheck+test)
- [ ] T008 [P] [US1] Create root `.gitignore` and `.editorconfig` with conventional entries
- [ ] T009 [US1] Create CI workflow at `/Users/zhouyang/Coding/x-filter/.github/workflows/ci.yml` (Node 18/20 matrix: install→lint→typecheck→test→build; cache artifacts)
- [ ] T044 [US1] Add CODEOWNERS at `/Users/zhouyang/Coding/x-filter/.github/CODEOWNERS` requiring two maintainer reviews for protected branches
- [ ] T045 [US1] Document branch protection rules at `/Users/zhouyang/Coding/x-filter/docs/branch-protection.md` (2 approvals, required checks, linear history)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T010 [US1] Scaffold workspace folders: `packages/core`, `packages/utils`, `packages/react`, `apps/playground`
- [ ] T011 [P] [US1] Create `packages/core/package.json` (name `@x-filter/core`, `private:true`, ESM exports, `types`, scripts: build/test/lint/format/typecheck)
- [ ] T012 [P] [US1] Create `packages/utils/package.json` (name `@x-filter/utils`, `private:true`, ESM exports, `types`, scripts aligned)
- [ ] T013 [P] [US1] Create `packages/react/package.json` (name `@x-filter/react`, `private:true`, ESM exports, `types`, scripts aligned)
- [ ] T014 [US1] Create `apps/playground/package.json` (name `@x-filter/playground`, `private:true`, scripts: dev/build/test/lint/format/typecheck)
- [ ] T015 [P] [US1] Add per-package `tsconfig.json` with `composite:true`, `extends: ../../tsconfig.base.json`
- [ ] T016 [US1] Establish TypeScript project references: root → packages; `apps/playground` → `@x-filter/core`, `@x-filter/utils`, `@x-filter/react`
- [ ] T017 [US1] Wire workspace dependencies using `workspace:*`: `@x-filter/react` → `@x-filter/core`, `@x-filter/utils`; `@x-filter/utils` → `@x-filter/core`; avoid cycles
- [ ] T018 [US1] Root scripts: `build`, `test`, `lint`, `format`, `typecheck`, `dev` (delegates to `apps/playground`)
- [ ] T019 [US1] CI: add cycle detection; enforce coverage thresholds ≥95% per package; upload coverage artifacts for dashboard; include visual regression and accessibility checks

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Monorepo Maintainer Bootstraps Workspace (Priority: P1) 🎯 MVP

**Goal**: A working monorepo with shared configs and runnable playground; one-click build/test/lint at root

**Independent Test**: From a clean clone: `pnpm i` then `pnpm -w build/test/lint` pass; `pnpm -w run dev` starts playground successfully

### Tests for User Story 1 (MANDATORY) ✅

- [ ] T020 [P] [US1] Root smoke test file at `apps/playground/src/__tests__/bootstrap.spec.ts` asserting app mounts and imports workspace packages

### Implementation for User Story 1

- [ ] T021 [P] [US1] Create placeholder sources:
  - `packages/core/src/index.ts`
  - `packages/utils/src/index.ts`
  - `packages/react/src/index.ts`
- [ ] T022 [US1] Configure `apps/playground` minimal React 18 app files:
  - `apps/playground/index.html`
  - `apps/playground/src/main.tsx`
  - `apps/playground/src/App.tsx`
  - Add Vite config `apps/playground/vite.config.ts` (for dev/build)
- [ ] T023 [US1] Ensure root Jest `projects` detect each package/app; add per-package `jest.config.js` if needed
- [ ] T024 [US1] Document quickstart at `/Users/zhouyang/Coding/x-filter/specs/001-1-monorepo-headless/quickstart.md` (install, build, test, dev)

**Checkpoint**: User Story 1 independently functional and testable

---

## Phase 4: User Story 2 - Core Library Author Implements Query Logic (Priority: P1)

**Goal**: Core package exposes query builder domain types and stubbed APIs (no real logic)

**Independent Test**: Unit tests validate type-safe construction returns structured objects; coverage ≥20% for `@x-filter/core`

### Tests for User Story 2 (MANDATORY) ✅

- [ ] T025 [P] [US2] Add sample tests `packages/core/src/__tests__/query-builder.spec.ts` covering type-safe builder stubs

### Implementation for User Story 2

- [ ] T026 [US2] Implement placeholder domain types `packages/core/src/query-types.ts` (QueryDefinition, Field, Operator, Rule)
- [ ] T027 [US2] Implement stubbed builder API `packages/core/src/query-builder.ts` (createQuery, addRule, serialize) with TODOs
- [ ] T028 [P] [US2] Export public surface from `packages/core/src/index.ts`
- [ ] T029 [US2] Add README usage examples `packages/core/README.md` reflecting API and edge cases (placeholders)

**Checkpoint**: User Story 2 independently functional and testable

---

## Phase 5: User Story 3 - Component Developer Delivers Headless UI and Playground Demos (Priority: P2)

**Goal**: Headless React package exposes component/hook signatures and playground demonstrates usage

**Independent Test**: Component behavior tests verify signatures and interactions; playground renders demos; coverage ≥20% for `@x-filter/react`

### Tests for User Story 3 (MANDATORY) ✅

- [ ] T030 [P] [US3] Add sample tests `packages/react/src/__tests__/headless-hooks.spec.tsx` validating hooks signatures and state transitions (stubbed)
- [ ] T031 [P] [US3] Add sample tests `apps/playground/src/__tests__/demos.spec.tsx` asserting demo renders and responds to basic interactions
- [ ] T046 [P] [US3] Add utils package tests `packages/utils/src/__tests__/formatters.spec.ts` covering formatter type contracts and stub behavior
- [ ] T047 [US3] Set up DOM snapshot-based visual regression for headless components and wire into CI checks
- [ ] T048 [US3] Add accessibility checks for demos/components (lint rules or runtime checks) and wire into CI

### Implementation for User Story 3

- [ ] T032 [US3] Define headless hooks `packages/react/src/hooks/useQueryBuilder.ts` (types-only interactions with core)
- [ ] T033 [US3] Define headless components signatures `packages/react/src/components/QueryBuilder.tsx` (props/events/state contracts only)
- [ ] T034 [US3] Export public surface from `packages/react/src/index.ts`
- [ ] T035 [US3] Implement utils placeholders `packages/utils/src/formatters.ts` and `packages/utils/src/exporters.ts` (types + stubs)
- [ ] T036 [US3] Wire playground demos `apps/playground/src/demos/QueryBuilderDemo.tsx` consuming `@x-filter/core`, `@x-filter/utils`, `@x-filter/react`

**Checkpoint**: All user stories independently functional

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T037 [P] Documentation updates in `specs/001-1-monorepo-headless/quickstart.md` and package READMEs (reference pages include examples and edge cases)
- [ ] T038 Code cleanup and refactoring
- [ ] T039 Performance optimization across all stories (build times, local dev startup)
- [ ] T040 [P] Additional unit, integration, and visual regression tests in `packages/*/src/__tests__/` and `apps/playground/src/__tests__/`
- [ ] T041 Security hardening (dependency audits, lockfile hygiene)
- [ ] T042 Run quickstart.md validation and update release checklist
- [ ] T043 Ensure coverage dashboards are published in CI (upload HTML reports) and thresholds (≥95%) enforced
- [ ] T049 Create `CHANGELOG.md` with an initial entry documenting the monorepo skeleton and packages
- [ ] T050 Create package-level reference docs stubs with runnable examples and edge-case notes in `packages/*/README.md`
- [ ] T051 Add ADR document at `docs/adr/0001-monorepo-structure.md` capturing workspace, tooling, and CI decisions
- [ ] T052 Ensure a minimum of 5 playground demo scenarios in `apps/playground/src/demos/`
- [ ] T053 Add `RELEASE.md` describing semantic versioning policy and rollback procedures

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories then proceed in priority order (P1 → P1 → P2) or in parallel where no file conflicts exist
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Independent of US1 outputs except workspace existence
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Consumes US2 exports; otherwise independent

### Within Each User Story

- Tests MUST be written and FAIL before implementation (baseline phase; thresholds temporary at 20%)
- Models/types before services/components
- Components before playground demos
- Story complete before moving to next priority

### Parallel Opportunities

- [P] marked tasks in Setup and Foundational can run concurrently (different files)
- Within US2: types (T026) and index export (T028) can proceed in parallel after file scaffolds
- Within US3: tests (T030, T031) and utils placeholders (T035) can proceed in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all mandatory tests for User Story 1 together:
Task: "Root smoke test at apps/playground/src/__tests__/bootstrap.spec.ts"

# Launch all models/placeholders for User Story 1 together:
Task: "Create package sources in packages/*/src/index.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Demo via playground

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Demo (MVP)
3. Add User Story 2 → Test independently → Demo
4. Add User Story 3 → Test independently → Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- Each user story is independently completable and testable
- Verify tests fail before implementing
- Track coverage after each story; block merges if metrics dip below ≥20% (this phase only)
- Commit after each task or logical group
- Avoid: vague tasks, same-file conflicts, cross-story dependencies that break independence
