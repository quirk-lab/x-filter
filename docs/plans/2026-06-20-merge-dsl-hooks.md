# Merge DSL Hooks Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Delete the unused `useFilterDsl` hook, fold its only unique feature (`resetDraft`) into `useDslEditor`, and lazily skip completion computation when `cursor` is not provided — leaving one DSL hook with no real-consumer breakage.

**Architecture:** `useDslEditor` becomes the sole headless DSL hook. `resetDraft` is ported from `useFilterDsl` using the `filter` prop (not `prevFilterRef`) so it shares the same source of truth as the external-resync effect. Completions return `[]` when `cursor === undefined`, letting simple-draft consumers skip the per-keystroke `getDslCompletions` tokenize cost. The dead `formatParseError` fallback branch is removed. Spec/plan/ADR docs are updated to retire the `useFilterDsl` promise.

**Tech Stack:** TypeScript, React 18 hooks, Jest + @testing-library/react `renderHook`, ts-jest ESM, Biome, pnpm workspace.

---

## Context for the implementer

### What exists today

- `packages/react/src/use-filter-dsl.ts` — exports `useFilterDsl`. Manages `draftDSL` + `parseError`, supports `resetDraft`. **Zero real consumers** (only its own test file + `index.ts` re-export + `types.ts` type defs reference it).
- `packages/react/src/use-dsl-editor.ts` — exports `useDslEditor`. Manages `draftDSL` + `parseError` + `completions`. Consumed by `packages/shadcn/src/components/dsl-editor.tsx`, `packages/antd/src/components/dsl-editor.tsx`, and the README example.
- Both hooks share the same `prevFilterRef` resync pattern and the same `[${e.code}] ${e.message}` join for parse errors. `useDslEditor` additionally has a dead `formatParseError` fallback string (`'Failed to parse DSL expression'`) that can never trigger because `tryParseDSL` only returns `ok: false` when `errors` is non-empty.
- `specs/004-ui-modules/prd.md` line 228 and `docs/plans/2026-05-28-antd-shadcn-deep-support-design.md` line 46 still promise `useFilterDsl`. `specs/004-ui-modules/tasks.md` T003 (freeze `useFilterDsl` API contract) was never completed — the `contracts/react-headless-api.md` file does not exist.

### Decisions locked during the grill session

1. Keep the name `useDslEditor` (real consumers stay untouched); delete `useFilterDsl` outright with a CHANGELOG breaking note.
2. Keep the method name `commit` (not `commitDSL`).
3. `resetDraft` uses the `filter` prop and does **not** touch `prevFilterRef` — `prevFilterRef`'s sole job is detecting external changes.
4. Do **not** fix the pre-existing "commit then parent reconstructs filter → draft re-formats" behavior; out of scope.
5. Completions are lazily skipped when `cursor === undefined` (returns `[]`). This is a behavior change: previously `cursor === undefined` fell back to `draftDSL.length` and still computed completions. No real consumer relies on the old fallback (shadcn/antd always pass a `cursor` state; the README example is a simple-draft shape). Recorded as breaking in CHANGELOG.
6. Remove the dead `formatParseError` fallback branch.
7. Write a short ADR explaining why a spec-promised API was retired.

### Test commands

- Single spec file (coverage auto-disabled): `pnpm exec jest packages/react/src/__tests__/use-dsl-editor.spec.tsx --runInBand`
- Single test by name: `pnpm exec jest packages/react/src/__tests__/use-dsl-editor.spec.tsx -t "resetDraft" --runInBand`
- Full suite: `pnpm test`
- Typecheck: `pnpm typecheck`
- Lint: `pnpm exec biome check .`
- Build: `pnpm -r run build`

### Adapter call sites (must stay green, zero edits expected)

- `packages/shadcn/src/components/dsl-editor.tsx:74` — `useDslEditor({ filter, schema, onCommit, cursor })` (cursor is state, always defined once user interacts).
- `packages/shadcn/src/components/dsl-editor.tsx:146` — `editor.commit`.
- `packages/antd/src/components/dsl-editor.tsx:74` / `:146` — same shape.

---

### Task 1: Add `resetDraft` to `useDslEditor` (TDD)

**Files:**
- Modify: `packages/react/src/types.ts:53-59` (add `resetDraft` to `UseDslEditorReturn`)
- Modify: `packages/react/src/__tests__/use-dsl-editor.spec.tsx` (append three tests)
- Modify: `packages/react/src/use-dsl-editor.ts` (implement `resetDraft`)

**Step 1: Update the return type**

In `packages/react/src/types.ts`, add `resetDraft` to `UseDslEditorReturn` after `commit`:

```ts
export interface UseDslEditorReturn {
  draftDSL: string;
  setDraftDSL: (dsl: string) => void;
  parseError: string | null;
  completions: CompletionItem[];
  commit: () => boolean;
  resetDraft: () => void;
}
```

**Step 2: Write the three failing tests**

Append to the `describe('useDslEditor', ...)` block in `packages/react/src/__tests__/use-dsl-editor.spec.tsx` (before the closing `});` of the describe):

```tsx
  it('resetDraft resets to current filter DSL and clears parseError', () => {
    const filter = makeFilter();
    const onCommit = jest.fn();
    const { result } = renderHook(() => useDslEditor({ filter, schema, onCommit }));

    const originalDSL = result.current.draftDSL;

    act(() => {
      result.current.setDraftDSL('something:different:value');
    });
    expect(result.current.draftDSL).toBe('something:different:value');

    act(() => {
      result.current.resetDraft();
    });

    expect(result.current.draftDSL).toBe(originalDSL);
    expect(result.current.parseError).toBeNull();
  });

  it('resetDraft clears a previous parseError', () => {
    const filter = makeFilter();
    const onCommit = jest.fn();
    const { result } = renderHook(() => useDslEditor({ filter, schema, onCommit }));

    act(() => {
      result.current.setDraftDSL('@@@ invalid');
    });
    act(() => {
      result.current.commit();
    });
    expect(result.current.parseError).not.toBeNull();

    act(() => {
      result.current.resetDraft();
    });
    expect(result.current.parseError).toBeNull();
  });

  it('resetDraft does not prevent subsequent external filter resync', () => {
    const filter = makeFilter();
    const nextFilter = makeFilter('priority', 'gt', 10);
    const onCommit = jest.fn();
    const { result, rerender } = renderHook(
      ({ currentFilter }) => useDslEditor({ filter: currentFilter, schema, onCommit }),
      { initialProps: { currentFilter: filter } }
    );

    act(() => {
      result.current.setDraftDSL('something:different:value');
    });
    act(() => {
      result.current.resetDraft();
    });
    expect(result.current.draftDSL).toBe(formatDSL(filter));

    rerender({ currentFilter: nextFilter });
    expect(result.current.draftDSL).toBe(formatDSL(nextFilter));
  });
```

**Step 3: Run the new tests to verify they fail**

Run: `pnpm exec jest packages/react/src/__tests__/use-dsl-editor.spec.tsx -t "resetDraft" --runInBand`
Expected: FAIL — `result.current.resetDraft is not a function` (type error at runtime because the hook does not yet return `resetDraft`).

**Step 4: Implement `resetDraft` in `useDslEditor`**

In `packages/react/src/use-dsl-editor.ts`, add a `resetDraft` callback (place it after the `commit` callback, before the `return` statement):

```ts
  const resetDraft = useCallback(() => {
    setDraftDSLState(formatDSL(filter));
    setParseError(null);
  }, [filter]);
```

Then add `resetDraft` to the returned object, after `commit`:

```ts
  return {
    draftDSL,
    setDraftDSL,
    parseError,
    completions,
    commit,
    resetDraft,
  };
```

**Step 5: Run the new tests to verify they pass**

Run: `pnpm exec jest packages/react/src/__tests__/use-dsl-editor.spec.tsx -t "resetDraft" --runInBand`
Expected: PASS — 3 tests pass.

**Step 6: Commit**

```bash
git add packages/react/src/types.ts packages/react/src/use-dsl-editor.ts packages/react/src/__tests__/use-dsl-editor.spec.tsx
git commit -m "feat(react): add resetDraft to useDslEditor"
```

---

### Task 2: Lazy completions when `cursor === undefined` (TDD)

This task changes behavior: `cursor === undefined` now returns `[]` instead of falling back to `draftDSL.length`. Two existing tests rely on the old fallback and must be updated to pass an explicit cursor.

**Files:**
- Modify: `packages/react/src/__tests__/use-dsl-editor.spec.tsx:50-73` and `:146-162` (update existing tests + add one new test)
- Modify: `packages/react/src/use-dsl-editor.ts:32-40` (lazy completions)

**Step 1: Add the new failing test for lazy completions**

Append inside the `describe` block:

```tsx
  it('returns empty completions when cursor is undefined', () => {
    const filter = makeFilter();
    const onCommit = jest.fn();
    const { result } = renderHook(() => useDslEditor({ filter, schema, onCommit }));

    act(() => {
      result.current.setDraftDSL('sta');
    });
    expect(result.current.completions).toEqual([]);
  });
```

**Step 2: Update the existing "returns completions for field, operator, and value contexts" test**

Replace the test at `packages/react/src/__tests__/use-dsl-editor.spec.tsx` (the block starting `it('returns completions for field, operator, and value contexts', ...`) with this version that passes an explicit cursor via `rerender` (mirrors how the real adapter updates cursor state on each change):

```tsx
  it('returns completions for field, operator, and value contexts', () => {
    const filter = makeFilter();
    const onCommit = jest.fn();
    const { result, rerender } = renderHook(
      ({ cursor }) => useDslEditor({ filter, schema, onCommit, cursor }),
      { initialProps: { cursor: 0 } }
    );

    act(() => {
      result.current.setDraftDSL('sta');
    });
    rerender({ cursor: 3 });
    expect(result.current.completions).toEqual([
      expect.objectContaining({ kind: 'field', value: 'status' }),
    ]);

    act(() => {
      result.current.setDraftDSL('status:');
    });
    rerender({ cursor: 7 });
    expect(completionValues(result.current.completions)).toEqual(['equals', 'notEquals']);
    expect(completionKinds(result.current.completions)).toEqual(['operator', 'operator']);

    act(() => {
      result.current.setDraftDSL('status:equals:');
    });
    rerender({ cursor: 14 });
    expect(completionValues(result.current.completions)).toEqual(['open', 'closed']);
    expect(completionKinds(result.current.completions)).toEqual(['value', 'value']);
  });
```

**Step 3: Update the existing "cursor affects completion context" test**

Replace the test starting `it('cursor affects completion context', ...)` with this version (initial cursor is now an explicit end-of-draft position instead of `undefined`):

```tsx
  it('cursor affects completion context', () => {
    const filter = makeFilter();
    const onCommit = jest.fn();
    const { result, rerender } = renderHook(
      ({ cursor }) => useDslEditor({ filter, schema, onCommit, cursor }),
      { initialProps: { cursor: 24 } }
    );

    act(() => {
      result.current.setDraftDSL('status:equals:open AND pri');
    });
    expect(completionValues(result.current.completions)).toEqual(['priority']);

    rerender({ cursor: 'status:'.length });
    expect(completionValues(result.current.completions)).toEqual(['equals', 'notEquals']);
  });
```

**Step 4: Run the test file to verify the new test fails and the updated tests still pass**

Run: `pnpm exec jest packages/react/src/__tests__/use-dsl-editor.spec.tsx --runInBand`
Expected: The new "returns empty completions when cursor is undefined" test FAILS (completions is `[{kind:'field',value:'status'}]`, not `[]`). The two updated tests PASS (they pass explicit cursors, which already work under the old implementation).

**Step 5: Implement lazy completions in `useDslEditor`**

In `packages/react/src/use-dsl-editor.ts`, replace the `completions` `useMemo` block (currently lines 32-40):

```ts
  const completions = useMemo(
    () =>
      cursor === undefined
        ? []
        : getDslCompletions({
            input: draftDSL,
            cursor,
            schema,
          }),
    [cursor, draftDSL, schema]
  );
```

**Step 6: Run the full test file to verify all tests pass**

Run: `pnpm exec jest packages/react/src/__tests__/use-dsl-editor.spec.tsx --runInBand`
Expected: PASS — all tests including the new lazy-completions test.

**Step 7: Commit**

```bash
git add packages/react/src/use-dsl-editor.ts packages/react/src/__tests__/use-dsl-editor.spec.tsx
git commit -m "perf(react): skip completions when cursor is undefined

BREAKING CHANGE: useDslEditor now returns completions: [] when the cursor
option is omitted, instead of falling back to draftDSL.length. Pass an
explicit cursor to receive completions."
```

---

### Task 3: Remove the dead `formatParseError` fallback branch

`tryParseDSL` only returns `{ ok: false, errors }` when `errors` is non-empty (the parser always pushes at least `EMPTY_EXPRESSION` when the AST is empty). The `errors.length === 0` fallback string in `formatParseError` is unreachable dead code.

**Files:**
- Modify: `packages/react/src/use-dsl-editor.ts:5-8`

**Step 1: Simplify `formatParseError`**

Replace the `formatParseError` helper at the top of `packages/react/src/use-dsl-editor.ts`:

```ts
const formatParseError = (errors: { code: string; message: string }[]): string =>
  errors.map((error) => `[${error.code}] ${error.message}`).join('; ');
```

**Step 2: Run the test file to verify no regression**

Run: `pnpm exec jest packages/react/src/__tests__/use-dsl-editor.spec.tsx --runInBand`
Expected: PASS — the invalid-commit test still expects a string containing `[EXPECTED_COLON]`, which the simplified formatter still produces.

**Step 3: Commit**

```bash
git add packages/react/src/use-dsl-editor.ts
git commit -m "refactor(react): remove dead formatParseError fallback branch"
```

---

### Task 4: Port coverage gaps, then delete `useFilterDsl`

Before deleting `useFilterDsl` and its test file, port the two test cases from `use-filter-dsl.spec.tsx` that have no equivalent in `use-dsl-editor.spec.tsx`. These cover existing `commit` / resync behavior (not new code), so they are coverage safety nets — they should pass immediately against the current `useDslEditor` implementation. Then delete `useFilterDsl` and clean up every reference including the adapter re-exports.

**Files:**
- Modify: `packages/react/src/__tests__/use-dsl-editor.spec.tsx` (append two coverage tests)
- Delete: `packages/react/src/use-filter-dsl.ts`
- Delete: `packages/react/src/__tests__/use-filter-dsl.spec.tsx`
- Modify: `packages/react/src/types.ts:32-44` (remove `UseFilterDslOptions` and `UseFilterDslReturn`)
- Modify: `packages/react/src/index.ts:17-18,47` (remove `useFilterDsl` exports)
- Modify: `packages/shadcn/src/index.tsx:43` (remove `UseFilterDslReturn` re-export)
- Modify: `packages/antd/src/index.tsx:34` (remove `UseFilterDslReturn` re-export)

**Step 1: Append the two coverage-gap tests**

Append inside the `describe('useDslEditor', ...)` block in `packages/react/src/__tests__/use-dsl-editor.spec.tsx` (before the closing `});`):

```tsx
  it('commit with empty expression sets parseError', () => {
    const emptyFilter: Filter = { id: 'root', combinator: 'and', conditions: [] };
    const onCommit = jest.fn();
    const { result } = renderHook(() => useDslEditor({ filter: emptyFilter, schema, onCommit }));

    act(() => {
      result.current.setDraftDSL('');
    });

    let success = true;
    act(() => {
      success = result.current.commit();
    });

    expect(success).toBe(false);
    expect(result.current.parseError).toBeTruthy();
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('successful commit prevents re-sync on same filter reference', () => {
    const filter = makeFilter();
    const onCommit = jest.fn();
    const { result, rerender } = renderHook(
      ({ currentFilter }) => useDslEditor({ filter: currentFilter, schema, onCommit }),
      { initialProps: { currentFilter: filter } }
    );

    act(() => {
      result.current.setDraftDSL('priority:gt:18');
    });
    act(() => {
      result.current.commit();
    });

    const dslAfterCommit = result.current.draftDSL;

    rerender({ currentFilter: filter });

    expect(result.current.draftDSL).toBe(dslAfterCommit);
  });
```

**Step 2: Run the test file to verify the two new tests pass (coverage safety net)**

Run: `pnpm exec jest packages/react/src/__tests__/use-dsl-editor.spec.tsx --runInBand`
Expected: PASS — both new tests pass against the current `useDslEditor` (they exercise existing `commit` / `prevFilterRef` behavior, not new code).

**Step 3: Delete the hook and its test file**

```bash
rm packages/react/src/use-filter-dsl.ts
rm packages/react/src/__tests__/use-filter-dsl.spec.tsx
```

**Step 4: Remove the `UseFilterDsl*` types from `types.ts`**

In `packages/react/src/types.ts`, delete these two interfaces (currently lines 32-44):

```ts
export interface UseFilterDslOptions {
  filter: Filter;
  schema: FieldSchema[];
  onCommit: (filter: Filter) => void;
}

export interface UseFilterDslReturn {
  draftDSL: string;
  setDraftDSL: (dsl: string) => void;
  parseError: string | null;
  commitDSL: () => boolean;
  resetDraft: () => void;
}
```

**Step 5: Remove `useFilterDsl` exports from `packages/react/src/index.ts`**

- Remove `UseFilterDslOptions,` and `UseFilterDslReturn,` from the `export type { ... }` block (currently lines 17-18).
- Remove the line `export { useFilterDsl } from './use-filter-dsl';` (currently line 47).

**Step 6: Remove `UseFilterDslReturn` re-exports from adapter packages**

In `packages/shadcn/src/index.tsx`, remove the line `  UseFilterDslReturn,` (currently line 43, inside the `export type { ... } from '@x-filter/react'` block).

In `packages/antd/src/index.tsx`, remove the line `  UseFilterDslReturn,` (currently line 34, inside the `export type { ... } from '@x-filter/react'` block).

**Step 7: Verify typecheck and tests pass**

Run: `pnpm typecheck`
Expected: PASS — no references to `useFilterDsl` or `UseFilterDsl*` remain anywhere.

Run: `pnpm exec jest packages/react packages/shadcn packages/antd --runInBand`
Expected: PASS — the deleted test file is gone; remaining react/adapter tests pass.

Run: `grep -rn "UseFilterDsl\|useFilterDsl" packages/ apps/ --include="*.ts" --include="*.tsx" | grep -v node_modules`
Expected: no matches.

**Step 8: Commit**

```bash
git add packages/react/src/__tests__/use-dsl-editor.spec.tsx packages/react/src/use-filter-dsl.ts packages/react/src/__tests__/use-filter-dsl.spec.tsx packages/react/src/types.ts packages/react/src/index.ts packages/shadcn/src/index.tsx packages/antd/src/index.tsx
git commit -m "feat(react)!: remove useFilterDsl hook

BREAKING CHANGE: useFilterDsl is removed. Its resetDraft capability now
lives on useDslEditor. Migrate by switching to useDslEditor({ filter,
schema, onCommit }) and using editor.commit / editor.resetDraft instead
of commitDSL / resetDraft."
```

---

### Task 5: Update spec, plan, and README docs to retire the `useFilterDsl` promise

**Files:**
- Modify: `specs/004-ui-modules/prd.md:228`
- Modify: `specs/004-ui-modules/tasks.md:22` (T003)
- Modify: `docs/plans/2026-05-28-antd-shadcn-deep-support-design.md:46`
- Modify: `packages/react/README.md:75-111` (DSL Editor example — pass cursor so completions render)

**Step 1: Update the PRD API list**

In `specs/004-ui-modules/prd.md`, replace line 228:

```markdown
  - `useDslEditor({ filter, schema, onCommit, cursor? })`
```

**Step 2: Update T003 in the tasks file**

In `specs/004-ui-modules/tasks.md`, replace the T003 line (line 22) with:

```markdown
- [x] T003 [US-1] `useFilterDsl` 合并至 `useDslEditor`（见 ADR 0001）；headless API 契约由 `useDslEditor`/`useFilterBuilder`/`useFilterUrlSync`/`useReorderContract` 组成
```

**Step 3: Update the deep-support plan**

In `docs/plans/2026-05-28-antd-shadcn-deep-support-design.md`, replace the `useFilterDsl` line (line 46) with:

```markdown
  - `useDslEditor`
```

**Step 4: Update the README DSL Editor example to pass a cursor**

The current example in `packages/react/README.md` (lines 75-111) calls `useDslEditor({ filter, schema, onCommit })` without a `cursor`. After the lazy-completions change this returns `completions: []`. Update the example to track cursor state so completions render. Replace the entire `## DSL Editor` code block (lines 77-110) with:

```tsx
import type { FieldSchema, Filter } from '@x-filter/core';
import { useDslEditor } from '@x-filter/react';
import { useState } from 'react';

export function DslTextarea({
  filter,
  schema,
  onCommit,
}: {
  filter: Filter;
  schema: FieldSchema[];
  onCommit: (filter: Filter) => void;
}) {
  const [cursor, setCursor] = useState<number | undefined>();
  const editor = useDslEditor({ filter, schema, onCommit, cursor });

  return (
    <div>
      <textarea
        aria-label="Filter DSL"
        value={editor.draftDSL}
        onChange={(event) => {
          editor.setDraftDSL(event.target.value);
          setCursor(event.target.selectionStart ?? event.target.value.length);
        }}
        onSelect={(event) =>
          setCursor((event.target as HTMLTextAreaElement).selectionStart ?? editor.draftDSL.length)
        }
      />
      <button type="button" onClick={editor.commit}>
        Apply DSL
      </button>
      {editor.parseError ? <p role="alert">{editor.parseError}</p> : null}
      <ul>
        {editor.completions.map((item) => (
          <li key={`${item.kind}-${item.value}`}>{item.label}</li>
        ))}
      </ul>
    </div>
  );
}
```

**Step 5: Commit**

```bash
git add specs/004-ui-modules/prd.md specs/004-ui-modules/tasks.md docs/plans/2026-05-28-antd-shadcn-deep-support-design.md packages/react/README.md
git commit -m "docs: retire useFilterDsl and update README DSL example for lazy completions"
```

---

### Task 6: Create ADR 0001 and update CHANGELOG

**Files:**
- Create: `docs/adr/0001-merge-dsl-hooks.md`
- Modify: `CHANGELOG.md`

**Step 1: Create the ADR directory and file**

```bash
mkdir -p docs/adr
```

Write `docs/adr/0001-merge-dsl-hooks.md`:

```markdown
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
- T003's unfulfilled "freeze react-headless-api contract" obligation is
  satisfied by this merge: the headless DSL API is now `useDslEditor` alone.
- The pre-existing "commit then parent reconstructs filter object → draft
  re-formats" behavior is intentionally left unchanged; it is out of scope for
  this merge and would require a deep-equality comparison plus a
  `formatDSL` idempotency guarantee.
```

**Step 2: Update CHANGELOG**

Prepend a new section to `CHANGELOG.md` (above the existing `## 0.0.0` entry):

```markdown
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
```

**Step 3: Commit**

```bash
git add docs/adr/0001-merge-dsl-hooks.md CHANGELOG.md
git commit -m "docs: add ADR 0001 and CHANGELOG for DSL hook merge"
```

---

### Task 7: Full verification

**Step 1: Typecheck the whole workspace**

Run: `pnpm typecheck`
Expected: PASS across all packages.

**Step 2: Lint**

Run: `pnpm exec biome check .`
Expected: PASS (no new warnings/errors).

**Step 3: Run the full test suite**

Run: `pnpm test`
Expected: PASS across all projects (core, utils, react, playground, antd, shadcn, web). Coverage thresholds (branches 80, functions/lines/statements 90) met.

**Step 4: Build all packages**

Run: `pnpm -r run build`
Expected: PASS — `@x-filter/react` builds with only `useDslEditor` exported; no dangling `useFilterDsl` references.

**Step 5: Sanity-check adapter packages still reference the correct hook**

Run: `grep -rn "useFilterDsl" packages/ apps/` from the repo root.
Expected: no matches.

Run: `grep -rn "useDslEditor" packages/shadcn packages/antd`.
Expected: matches only in `packages/shadcn/src/components/dsl-editor.tsx` and `packages/antd/src/components/dsl-editor.tsx`, unchanged from before the merge.

**Step 6: Final commit if any verification step surfaced fixups**

If steps 1-4 required no fixes, there is nothing to commit. If any auto-fixes were applied (e.g. Biome formatting), stage and commit them:

```bash
git add -A
git commit -m "chore: verification fixups for DSL hook merge"
```
