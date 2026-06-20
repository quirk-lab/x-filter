# Remove Dead @x-filter/utils Package Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Delete the unused `@x-filter/utils` package and synchronize all configuration/contract references in a single atomic commit.

**Architecture:** `@x-filter/utils` exports `isNil`/`isDefined` but no package source imports them. The deletion is a single atomic change spanning 6 touchpoints: the package directory, `tsconfig.json` project references, `jest.config.js` projects, `pnpm-lock.yaml`, `.github/CODEOWNERS`, and the `package-structure.md` contract (bumped to v1.1.0 with a changelog entry). No replacement shared-utility layer is created — future shared helpers will be inlined and a `@x-filter/shared` package will only be created when real duplication pain emerges.

**Tech Stack:** pnpm 9.x workspaces, TypeScript project references, Jest projects, Biome, GitHub Actions, tsup.

---

## Background Context (read before starting)

- **Why this is safe:** `grep -r "from '@x-filter/utils'"` across `packages/*/src` and `apps/*/src` returns **zero** hits. The only references to `@x-filter/utils` are in docs/specs and the package's own README/tests.
- **Why this is not just `rm -rf`:** Four config files reference `utils` and will break CI if not updated in the same commit:
  1. `tsconfig.json` line 5 — TypeScript project reference (`tsc --build` fails with "Referenced project not found")
  2. `jest.config.js` line 53 — Jest project (`jest` fails with "Could not find project root")
  3. `pnpm-lock.yaml` — workspace link record (`pnpm install --frozen-lockfile` may fail on inconsistency)
  4. `.github/CODEOWNERS` line 6 — stale ownership rule (non-blocking but must be cleaned)
- **Contract drift being corrected:** `specs/002-monorepo-init/contracts/package-structure.md` §7 declares `core → utils only`, but `packages/core/package.json` has **no `dependencies` field at all**. Task T014 in `specs/002-monorepo-init/tasks.md` is marked `[x]` but was never actually done. The contract has been wrong since inception; this plan corrects it and version-bumps the contract to 1.1.0 with a changelog entry.
- **No ADR needed:** Deleting dead code is reversible (`git revert`); the contract changelog is the only留痕 required.
- **No CONTEXT.md needed:** No new domain terms are introduced.

## Decisions Locked (from grilling session)

| # | Decision | Rationale |
|---|---|---|
| 1 | Source has no implicit deps; 4 config deps must be cleaned | "Implicit dep" = config-level, not just import-level |
| 2 | Single atomic commit | Deletion is one semantic unit; splitting creates confusing intermediate states |
| 3 | Contract bumped to v1.1.0 with changelog | Contract changes must be versioned; future readers can trace why utils disappeared |
| 4 | No shared layer reserved; inline-first | YAGNI — utils existed for whole project lifetime with zero calls; rebuild `@x-filter/shared` only when real pain accumulates |

---

## Task 1: Verify the precondition (no source imports)

**Files:**
- Read-only: whole repo

**Step 1: Confirm zero source imports of `@x-filter/utils`**

Run:
```bash
cd /Users/zhouyang/orca/workspaces/x-filter/arch-6-dead-utils
grep -rn "from ['\"]@x-filter/utils['\"]" packages/*/src apps/*/src 2>/dev/null
grep -rn "require(['\"]@x-filter/utils['\"])" packages/*/src apps/*/src 2>/dev/null
```
Expected: **no output** (zero matches). If ANY match appears, STOP — the package is not dead; re-evaluate before proceeding.

**Step 2: Confirm `isNil`/`isDefined` are not used outside utils**

Run:
```bash
grep -rn "isNil\|isDefined" packages/*/src apps/*/src 2>/dev/null | grep -v "packages/utils/"
```
Expected: **no output**. If matches appear in other packages, those are local re-implementations (safe) but worth noting — they confirm no hidden dependency on the utils export.

**Step 3: Do NOT commit**

This is a verification step only. No changes made.

---

## Task 2: Capture baseline CI status (proof of green before change)

**Files:**
- Read-only: whole repo

**Step 1: Run the three CI-equivalent local commands and record results**

Run:
```bash
cd /Users/zhouyang/orca/workspaces/x-filter/arch-6-dead-utils
pnpm build 2>&1 | tail -20
pnpm typecheck 2>&1 | tail -20
pnpm test 2>&1 | tail -30
```
Expected: all three pass. Note the test count (e.g. "X tests passed") — after deletion the count should drop by the 7 utils tests (3 isNil + 4 isDefined = 7 `it` blocks, but jest reports suites/tests; record exact numbers).

**Step 2: Do NOT commit**

Baseline capture only.

---

## Task 3: Delete the `packages/utils/` directory

**Files:**
- Delete: `packages/utils/` (entire directory: `src/index.ts`, `src/__tests__/index.spec.ts`, `package.json`, `tsconfig.json`, `tsup.config.ts`, `README.md`)

**Step 1: Remove the directory**

Run:
```bash
cd /Users/zhouyang/orca/workspaces/x-filter/arch-6-dead-utils
git rm -rf packages/utils
```
Expected: output listing the removed files. Verify with `git status` — `packages/utils/` files should appear under "deleted:".

**Step 2: Verify directory is gone**

Run:
```bash
ls packages/utils 2>&1
```
Expected: `No such file or directory` (or similar).

**Step 3: Do NOT commit yet**

Remaining config cleanup must happen in the same commit (decision 2A: single atomic commit).

---

## Task 4: Remove `utils` from `tsconfig.json` project references

**Files:**
- Modify: `tsconfig.json:5`

**Step 1: Edit `tsconfig.json`**

Remove the line `{ "path": "./packages/utils" },`. The file should become:

```json
{
  "files": [],
  "references": [
    { "path": "./packages/core" },
    { "path": "./packages/react" },
    { "path": "./packages/antd" },
    { "path": "./packages/shadcn" },
    { "path": "./apps/playground" },
    { "path": "./apps/web" }
  ]
}
```

**Step 2: Verify the edit**

Run:
```bash
grep -n "utils" tsconfig.json
```
Expected: **no output**.

**Step 3: Do NOT commit yet**

---

## Task 5: Remove `utils` from `jest.config.js` projects

**Files:**
- Modify: `jest.config.js:53`

**Step 1: Edit `jest.config.js`**

Remove the line `makeProject('utils'),` from the `projects` array. The array should become:

```javascript
  projects: [
    makeProject('core'),
    makeProject('react'),
    makeProject('playground'),
    makeProject('antd'),
    makeProject('shadcn'),
    makeProject('web'),
  ],
```

**Step 2: Verify the edit**

Run:
```bash
grep -n "utils" jest.config.js
```
Expected: **no output**.

**Step 3: Do NOT commit yet**

---

## Task 6: Remove `packages/utils/` from `.github/CODEOWNERS`

**Files:**
- Modify: `.github/CODEOWNERS:6`

**Step 1: Edit `.github/CODEOWNERS`**

Remove the line `packages/utils/ @x-filter/core-maintainers`. The file should become:

```
# Require review from maintainers for every change
* @x-filter/maintainers

# Feature packages
packages/core/ @x-filter/core-maintainers
packages/react/ @x-filter/react-maintainers
apps/playground/ @x-filter/react-maintainers
```

**Step 2: Verify the edit**

Run:
```bash
grep -n "utils" .github/CODEOWNERS
```
Expected: **no output**.

**Step 3: Do NOT commit yet**

---

## Task 7: Update `package-structure.md` contract to v1.1.0

**Files:**
- Modify: `specs/002-monorepo-init/contracts/package-structure.md` (header version, §7 dependency table, new §9 changelog)

**Step 1: Bump version in header**

Change line 5 from:
```
**Version**: 1.0.0
```
to:
```
**Version**: 1.1.0
```

**Step 2: Rewrite §7 "外部依赖层级" table**

Find the table in §7 (around lines 255-262) and replace it. The current table:

```
| Package | Allowed Dependencies |
|---------|---------------------|
| utils | 无框架依赖 |
| core | utils only |
| react | core + React (peer) |
| shadcn | react + Tailwind/Shadcn (peer) |
| antd | react + Antd (peer) |
| apps | 任意 @x-filter/* 包 |
```

Replace with:

```
| Package | Allowed Dependencies |
|---------|---------------------|
| core | 无内部依赖 |
| react | core + React (peer) |
| shadcn | react + Tailwind/Shadcn (peer) |
| antd | react + Antd (peer) |
| apps | 任意 @x-filter/* 包 |
```

Rationale: `core` never actually depended on `utils` (T014 was marked complete but never executed — `packages/core/package.json` has no `dependencies` field). This corrects the contract to match reality.

**Step 3: Add a changelog section at the end of the document**

Append a new §9 at the end of the file (after §8 "Git Conventions"):

```markdown
---

## 9. 变更记录

### v1.1.0 — 2026-06-20

- **移除 `@x-filter/utils` 包层级。** 该包导出 `isNil`/`isDefined`，但全仓零源码导入，属死代码。同步删除 `packages/utils/` 目录及 `tsconfig.json` 项目引用、`jest.config.js` project、`CODEOWNERS` 规则。
- **修正 `core` 依赖声明。** 原契约 §7 声明 `core → utils only`，但 `packages/core/package.json` 从未声明该依赖（T014 标记完成但实际未执行）。现改为 `core → 无内部依赖`，契约与代码对齐。
- **不预留共享工具层。** 未来跨包共享的工具函数先内联，待真实重复痛点积累后再建 `@x-filter/shared`，避免重蹈"预留即死代码"的覆辙。
```

**Step 4: Verify the edits**

Run:
```bash
grep -n "utils" specs/002-monorepo-init/contracts/package-structure.md
```
Expected: matches ONLY in the new §9 changelog text (3 lines mentioning `utils` as historical record). There should be **no** `utils` in §7 dependency table or anywhere else outside §9.

**Step 5: Do NOT commit yet**

---

## Task 8: Regenerate `pnpm-lock.yaml`

**Files:**
- Modify: `pnpm-lock.yaml` (auto-generated)

**Step 1: Re-run pnpm install to update the lockfile**

Run:
```bash
cd /Users/zhouyang/orca/workspaces/x-filter/arch-6-dead-utils
pnpm install
```
Expected: pnpm detects `packages/utils` is gone, updates the lockfile. Watch for output mentioning removed dependencies. Exit code 0.

**Step 2: Verify the lockfile no longer references utils as a workspace package**

Run:
```bash
grep -n "@x-filter/utils" pnpm-lock.yaml
```
Expected: **no output** (the workspace entry for `@x-filter/utils` should be gone). If hits remain, run `pnpm install --force` and re-check.

**Step 3: Do NOT commit yet**

---

## Task 9: Verify CI-equivalent commands pass post-change

**Files:**
- Read-only: whole repo

**Step 1: Run build**

Run:
```bash
cd /Users/zhouyang/orca/workspaces/x-filter/arch-6-dead-utils
pnpm build 2>&1 | tail -20
```
Expected: PASS. `pnpm -r run build` now iterates only core/react/shadcn/antd + apps. No "utils" in output.

**Step 2: Run typecheck**

Run:
```bash
pnpm typecheck 2>&1 | tail -20
```
Expected: PASS. No "Referenced project not found" error. This is the critical check — if it fails, `tsconfig.json` edit in Task 4 was incomplete.

**Step 3: Run tests**

Run:
```bash
pnpm test 2>&1 | tail -30
```
Expected: PASS. Test count should be **lower** than baseline (Task 2) by exactly the number of utils tests (the 7 `it` blocks from `packages/utils/src/__tests__/index.spec.ts`). No "Could not find project root" error. This is the critical check — if it fails, `jest.config.js` edit in Task 5 was incomplete.

**Step 4: Run lint**

Run:
```bash
pnpm lint 2>&1 | tail -10
```
Expected: PASS. Biome does not error on the removed directory.

**Step 5: Do NOT commit yet**

If ANY of steps 1-4 fail, STOP and diagnose before proceeding. Do not commit red CI.

---

## Task 10: Commit the atomic change

**Files:**
- All changes from Tasks 3-8

**Step 1: Review the full diff**

Run:
```bash
cd /Users/zhouyang/orca/workspaces/x-filter/arch-6-dead-utils
git status
git diff --stat
```
Expected: deleted `packages/utils/**` files, modified `tsconfig.json`, `jest.config.js`, `.github/CODEOWNERS`, `specs/002-monorepo-init/contracts/package-structure.md`, `pnpm-lock.yaml`. No other files.

**Step 2: Stage all changes**

Run:
```bash
git add -A
```

**Step 3: Verify staged changes match expectation**

Run:
```bash
git diff --cached --stat
```
Expected: exactly the 6 touchpoints (utils dir deletion + 5 modified files). If anything unexpected appears, unstage and investigate.

**Step 4: Commit**

Run:
```bash
git commit -m "$(cat <<'EOF'
chore: remove dead @x-filter/utils package

@x-filter/utils exported isNil/isDefined but no package source imported
them. Remove the package and synchronize all config references in one
atomic change:

- Delete packages/utils/ (src, package.json, tsconfig, tsup, README)
- Remove tsconfig.json project reference
- Remove jest.config.js project entry
- Remove .github/CODEOWNERS rule
- Regenerate pnpm-lock.yaml
- Bump package-structure.md contract to v1.1.0 with changelog:
  - Drop utils from §7 dependency table
  - Correct core's allowed deps to "无内部依赖" (T014 was marked done
    but never executed; core/package.json has no dependencies field)

No replacement shared-utility layer is created. Future cross-package
helpers will be inlined until real duplication pain justifies a
@x-filter/shared package.

Generated with [Devin](https://devin.ai)

Co-Authored-By: Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>
EOF
)"
```
Expected: commit succeeds. If pre-commit hooks (husky/lint-staged) modify files, re-stage and re-commit.

**Step 5: Verify the commit**

Run:
```bash
git log -1 --stat
```
Expected: the new commit with all 6 touchpoints listed.

---

## Task 11: Final post-commit verification

**Files:**
- Read-only: whole repo

**Step 1: Re-run all CI commands on the committed state**

Run:
```bash
cd /Users/zhouyang/orca/workspaces/x-filter/arch-6-dead-utils
pnpm build && pnpm typecheck && pnpm test && pnpm lint
```
Expected: all pass. This confirms the committed state is green, not just the working tree.

**Step 2: Confirm no stray references remain**

Run:
```bash
grep -rn "@x-filter/utils" packages/ apps/ tsconfig.json jest.config.js .github/CODEOWNERS pnpm-lock.yaml 2>/dev/null
```
Expected: **no output**. The only acceptable remaining mentions of `utils` are in `specs/` historical docs and `README.md` (root) — see Task 12.

**Step 3: Confirm contract version**

Run:
```bash
grep "Version" specs/002-monorepo-init/contracts/package-structure.md
```
Expected: `**Version**: 1.1.0`.

---

## Task 12 (optional): Clean up non-blocking doc references

**Files:**
- Modify: `README.md:9,64-66` (root)
- Modify: `specs/002-monorepo-init/quickstart.md:65,189,197,206`
- Modify: `specs/002-monorepo-init/spec.md:120`
- Modify: `specs/002-monorepo-init/plan.md:90,100`
- Modify: `specs/002-monorepo-init/data-model.md:17,23,52,67,278`
- Modify: `specs/002-monorepo-init/research.md:188`
- Modify: `specs/002-monorepo-init/tasks.md:47`
- Modify: `specs/001-1-monorepo-headless/tasks.md:51,55,56,133`

**Decision required:** These are historical spec/tutorial documents. Two valid stances:

- **Leave them alone:** Specs are historical artifacts of their feature; editing them rewrites history. The contract changelog (Task 7) is the authoritative correction.
- **Annotate them:** Add a banner like `> ⚠️ Superseded by package-structure.md v1.1.0 — @x-filter/utils was removed.` at the top of each affected spec doc.

**Recommendation:** Leave `specs/` alone (historical record) but **do update root `README.md`** since it is live project documentation, not a historical spec. Specifically:

- Line 9: remove `├── utils/      # @x-filter/utils - 底层工具函数`
- Lines 64-66: remove the `utils (无依赖)` / `core (依赖 utils)` lines from the dependency diagram; update to:
  ```
  core (无内部依赖)
    ↓
  react (依赖 core)
    ↓
  shadcn/antd (依赖 react)
    ↓
  apps (依赖 UI 包)
  ```

**Step 1: Edit root `README.md`**

Apply the two edits above.

**Step 2: Verify**

Run:
```bash
grep -n "utils" README.md
```
Expected: **no output**.

**Step 3: Commit (separate from the atomic deletion commit)**

Run:
```bash
git add README.md
git commit -m "$(cat <<'EOF'
docs: remove utils from root README package structure

Follow-up to the @x-filter/utils removal. Root README is live docs
(not historical spec) so it should reflect the current package layout.

Generated with [Devin](https://devin.ai)

Co-Authored-By: Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>
EOF
)"
```

**Step 4: Do NOT edit `specs/` files**

They are historical artifacts. The contract changelog is the authoritative correction.

---

## Verification Summary

After all tasks complete, the end state should satisfy:

| Check | Command | Expected |
|---|---|---|
| No source imports | `grep -rn "from ['\"]@x-filter/utils['\"]" packages/ apps/` | empty |
| No config references | `grep -rn "@x-filter/utils" tsconfig.json jest.config.js .github/CODEOWNERS pnpm-lock.yaml` | empty |
| Contract version | `grep "Version" specs/002-monorepo-init/contracts/package-structure.md` | `1.1.0` |
| Contract §7 has no utils row | `grep -A8 "外部依赖层级" specs/002-monorepo-init/contracts/package-structure.md \| grep utils` | empty (utils only mentioned in §9 changelog) |
| Build green | `pnpm build` | exit 0 |
| Typecheck green | `pnpm typecheck` | exit 0 |
| Tests green | `pnpm test` | exit 0, test count = baseline − 7 |
| Lint green | `pnpm lint` | exit 0 |
| Atomic commit exists | `git log -1 --stat` | shows the 6 touchpoints |
