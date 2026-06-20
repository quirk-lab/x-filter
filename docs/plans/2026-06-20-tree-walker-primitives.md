# Tree Walker Primitives Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extract two orthogonal tree primitives (`walk` + `mapTree`) to replace the four duplicated traversal implementations in core, fold `negate.ts` into `mutations.ts`, and rewrite `moveRule` as a single-pass transform.

**Architecture:** `walk(filter, visitor)` is read-only traversal (visitor sees nodes, not combinator strings). `mapTree(filter, { onGroup, onRule? })` is immutable transform with reference-equality short-circuit; `onGroup` is the primary entry point, `onRule` is optional sugar. IC combinator strings pass through untouched. IC `removeConditionICFromTree` keeps its splice logic but rides `mapTree`'s recursion via `onGroup`. `moveRule` becomes one `mapTree` pass using closure-captured state. `validate.ts` stays independent.

**Tech Stack:** TypeScript, Jest (ts-jest/esm), Biome (lint/format), pnpm workspace. Tests run via `pnpm test` at repo root; single package via `pnpm exec jest --selectProjects core --runInBand`.

**Reference docs:**
- ADR: `docs/adr/0001-tree-walker-primitives.md`
- Glossary: `CONTEXT.md`

**Key files (current state):**
- `packages/core/src/traverse.ts` — existing read-only `traverse`/`findById`/`findParent`/`getPath`/`flattenRules`
- `packages/core/src/mutations.ts` — `updateGroupInTree`/`updateRuleInTree`/`removeConditionFromTree`/`findRuleInTree`/`findGroupInTree`/`removeDuplicateRule` + public mutations
- `packages/core/src/negate.ts` — duplicate `updateRuleInTree`/`updateGroupInTree` + `negateRule`/`negateGroup`
- `packages/core/src/ic.ts` — `updateGroupICInTree`/`removeConditionICFromTree` + IC mutations
- `packages/core/src/types.ts` — `Filter`/`FilterGroup`/`FilterGroupIC`/`FilterIC`/`FilterAny`/`FilterRule`/`Combinator` + `isFilterGroup`/`isFilterRule`
- `packages/core/src/index.ts` — public exports

**Conventions observed:**
- Single quotes, 2-space indent, semicolons, trailing commas es5 (Biome)
- Tests in `packages/core/src/__tests__/*.spec.ts`
- Immutability + reference-equality short-circuit (`updated !== c`) is the established pattern
- Public API exported from `index.ts`; internal helpers unexported

**Critical constraints (from ADR):**
1. `walk` is read-only; visitor never sees combinator strings
2. `mapTree` callbacks MUST return a node (no undefined); reference equality drives short-circuit
3. id filtering lives in callbacks, not in `mapTree`; `updateById` is a thin helper
4. IC combinator strings pass through `mapTree` untouched
5. IC `removeConditionICFromTree` splice logic stays, rides `mapTree` via `onGroup`
6. `moveRule` = one `mapTree` pass with closure-captured rule/target/position; delete `removeDuplicateRule`
7. `validate.ts` NOT touched — keeps its own recursion
8. `serialize-json.ts` NOT touched — its "fold to JSON" traversal doesn't fit walk/mapTree (ADR constraint 7)
9. `negate.ts` deleted; `negateRule`/`negateGroup` move to `mutations.ts` as `updateById` wrappers

---

### Task 1: Add `walk` primitive to traverse.ts

Refactor the existing `traverse` to delegate to a new `walk` function. `walk` is the canonical read-only primitive; `traverse` becomes a thin wrapper for backward compat. Visitor sees nodes only (combinator strings skipped).

**Files:**
- Modify: `packages/core/src/traverse.ts`
- Test: `packages/core/src/__tests__/traverse.spec.ts`

**Step 1: Write failing test for `walk`**

Add to `packages/core/src/__tests__/traverse.spec.ts` (after existing `describe('traverse')` block, before `describe('flattenRules')`):

```ts
import { findById, findParent, flattenRules, getPath, traverse, walk } from '../traverse';
import type { FilterIC } from '../types';

describe('walk', () => {
  it('visits all nodes depth-first (standard mode)', () => {
    const visited: string[] = [];
    walk(filter, (node) => {
      visited.push(node.id);
    });
    expect(visited).toEqual(['root', 'r1', 'g1', 'r2', 'g2', 'r3']);
  });

  it('passes depth to visitor', () => {
    const depths: { id: string; depth: number }[] = [];
    walk(filter, (node, depth) => {
      depths.push({ id: node.id, depth });
    });
    expect(depths).toEqual([
      { id: 'root', depth: 0 },
      { id: 'r1', depth: 1 },
      { id: 'g1', depth: 1 },
      { id: 'r2', depth: 2 },
      { id: 'g2', depth: 2 },
      { id: 'r3', depth: 3 },
    ]);
  });

  it('skips combinator strings in IC mode', () => {
    const icFilter: FilterIC = {
      id: 'root',
      conditions: [
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
        'and',
        { id: 'r2', field: 'b', operator: 'eq', value: 2 },
      ],
    };
    const visited: string[] = [];
    walk(icFilter, (node) => {
      visited.push(node.id);
    });
    expect(visited).toEqual(['root', 'r1', 'r2']);
  });

  it('walks nested IC groups', () => {
    const icFilter: FilterIC = {
      id: 'root',
      conditions: [
        {
          id: 'g1',
          conditions: [
            { id: 'r1', field: 'a', operator: 'eq', value: 1 },
            'or',
            { id: 'r2', field: 'b', operator: 'eq', value: 2 },
          ],
        },
      ],
    };
    const visited: string[] = [];
    walk(icFilter, (node) => {
      visited.push(node.id);
    });
    expect(visited).toEqual(['root', 'g1', 'r1', 'r2']);
  });

  it('walks empty group', () => {
    const empty: Filter = { id: 'root', combinator: 'and', conditions: [] };
    const visited: string[] = [];
    walk(empty, (node) => visited.push(node.id));
    expect(visited).toEqual(['root']);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm exec jest --selectProjects core --runInBand src/__tests__/traverse.spec.ts`
Expected: FAIL — `walk` is not exported from `../traverse`

**Step 3: Implement `walk` and refactor `traverse`**

Replace the `traverse`/`traverseNode`/`TraverseCallback` section of `packages/core/src/traverse.ts` (lines 67-93) with:

```ts
export type WalkCallback = (node: AnyNode, depth: number) => void;

export function walk(filter: FilterAny, callback: WalkCallback): void {
  walkNode(filter, callback, 0);
}

function walkNode(node: AnyNode, callback: WalkCallback, depth: number): void {
  callback(node, depth);

  if (isGroupLike(node)) {
    const group = node as FilterGroup | FilterGroupIC;
    for (const c of group.conditions) {
      if (typeof c === 'string') continue;
      walkNode(c, callback, depth + 1);
    }
  }
}

/** @deprecated Use `walk` instead. */
export type TraverseCallback = WalkCallback;

export function traverse(filter: FilterAny, callback: TraverseCallback): void {
  walk(filter, callback);
}
```

Note: `AnyNode` and `isGroupLike` already defined at top of file. Keep `flattenRules` as-is (it already calls `traverse`, which now delegates to `walk`).

**Step 4: Run test to verify it passes**

Run: `pnpm exec jest --selectProjects core --runInBand src/__tests__/traverse.spec.ts`
Expected: PASS — all traverse + walk tests green

**Step 5: Export `walk` from index.ts**

In `packages/core/src/index.ts`, update the traverse export line:

```ts
export type { TraverseCallback, WalkCallback } from './traverse';
export { findById, findParent, flattenRules, getPath, traverse, walk } from './traverse';
```

**Step 6: Run full core test suite + typecheck**

Run: `pnpm exec jest --selectProjects core --runInBand && pnpm --filter @x-filter/core typecheck`
Expected: PASS — no regressions

**Step 7: Commit**

```bash
git add packages/core/src/traverse.ts packages/core/src/__tests__/traverse.spec.ts packages/core/src/index.ts
git commit -m "$(cat <<'EOF'
refactor(core): extract walk primitive in traverse.ts

Add read-only walk() as canonical tree traversal. traverse() becomes
a thin wrapper delegating to walk(). Visitor sees nodes only; IC
combinator strings are skipped.

Refs ADR 0001

Generated with [Devin](https://devin.ai)

Co-Authored-By: Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>
EOF
)"
```

---

### Task 2: Add `mapTree` primitive (new file tree-map.ts)

Create the immutable transform primitive. `onGroup` is primary entry (`(group) => group`), `onRule` optional sugar. Reference-equality short-circuit. IC combinator strings pass through untouched.

**Files:**
- Create: `packages/core/src/tree-map.ts`
- Create: `packages/core/src/__tests__/tree-map.spec.ts`

**Step 1: Write failing test for `mapTree`**

Create `packages/core/src/__tests__/tree-map.spec.ts`:

```ts
import { mapTree, updateById } from '../tree-map';
import type { Filter, FilterIC, FilterGroup, FilterRule } from '../types';

describe('mapTree', () => {
  const filter: Filter = {
    id: 'root',
    combinator: 'and',
    conditions: [
      { id: 'r1', field: 'name', operator: 'eq', value: 'John' },
      {
        id: 'g1',
        combinator: 'or',
        conditions: [{ id: 'r2', field: 'age', operator: 'gt', value: 18 }],
      },
    ],
  };

  it('onGroup: transforms matching group, preserves others by reference', () => {
    const result = mapTree(filter, {
      onGroup: (g) => (g.id === 'g1' ? { ...g, combinator: 'and' } : g),
    });
    expect((result.conditions[1] as FilterGroup).combinator).toBe('and');
    // root rebuilt because child changed
    expect(result).not.toBe(filter);
    // r1 untouched by reference
    expect(result.conditions[0]).toBe(filter.conditions[0]);
  });

  it('onGroup: returns same root by reference when nothing changes', () => {
    const result = mapTree(filter, {
      onGroup: (g) => g,
    });
    expect(result).toBe(filter);
  });

  it('onRule: transforms matching rule', () => {
    const result = mapTree(filter, {
      onRule: (r) => (r.id === 'r1' ? { ...r, value: 'Jane' } : r),
    });
    expect((result.conditions[0] as FilterRule).value).toBe('Jane');
    expect(result).not.toBe(filter);
  });

  it('onRule: returns same root by reference when nothing changes', () => {
    const result = mapTree(filter, {
      onRule: (r) => r,
    });
    expect(result).toBe(filter);
  });

  it('onGroup + onRule both applied', () => {
    const result = mapTree(filter, {
      onGroup: (g) => (g.id === 'g1' ? { ...g, combinator: 'and' } : g),
      onRule: (r) => (r.id === 'r1' ? { ...r, value: 'Jane' } : r),
    });
    expect((result.conditions[0] as FilterRule).value).toBe('Jane');
    expect((result.conditions[1] as FilterGroup).combinator).toBe('and');
  });

  it('IC mode: combinator strings pass through untouched', () => {
    const ic: FilterIC = {
      id: 'root',
      conditions: [
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
        'and',
        { id: 'r2', field: 'b', operator: 'eq', value: 2 },
      ],
    };
    const result = mapTree(ic, {
      onRule: (r) => (r.id === 'r1' ? { ...r, value: 99 } : r),
    });
    expect(result.conditions).toEqual([
      { id: 'r1', field: 'a', operator: 'eq', value: 99 },
      'and',
      { id: 'r2', field: 'b', operator: 'eq', value: 2 },
    ]);
  });

  it('IC mode: onGroup transforms nested IC group', () => {
    const ic: FilterIC = {
      id: 'root',
      conditions: [
        {
          id: 'g1',
          conditions: [
            { id: 'r1', field: 'a', operator: 'eq', value: 1 },
            'and',
            { id: 'r2', field: 'b', operator: 'eq', value: 2 },
          ],
        },
      ],
    };
    const result = mapTree(ic, {
      onGroup: (g) => (g.id === 'g1' ? { ...g, not: true } : g),
    });
    expect((result.conditions[0] as FilterIC).not).toBe(true);
  });

  it('IC mode: returns same root by reference when nothing changes', () => {
    const ic: FilterIC = {
      id: 'root',
      conditions: [
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
        'and',
        { id: 'r2', field: 'b', operator: 'eq', value: 2 },
      ],
    };
    const result = mapTree(ic, {
      onRule: (r) => r,
    });
    expect(result).toBe(ic);
  });
});

describe('updateById', () => {
  const filter: Filter = {
    id: 'root',
    combinator: 'and',
    conditions: [
      { id: 'r1', field: 'name', operator: 'eq', value: 'John' },
      {
        id: 'g1',
        combinator: 'or',
        conditions: [{ id: 'r2', field: 'age', operator: 'gt', value: 18 }],
      },
    ],
  };

  it('updates rule by id', () => {
    const result = updateById(filter, 'r1', (r) => ({ ...r, value: 'Jane' }));
    expect((result.conditions[0] as FilterRule).value).toBe('Jane');
  });

  it('updates group by id', () => {
    const result = updateById(filter, 'g1', (g) => ({ ...g, combinator: 'and' }));
    expect((result.conditions[1] as FilterGroup).combinator).toBe('and');
  });

  it('updates nested rule by id', () => {
    const result = updateById(filter, 'r2', (r) => ({ ...r, value: 21 }));
    const g1 = result.conditions[1] as FilterGroup;
    expect((g1.conditions[0] as FilterRule).value).toBe(21);
  });

  it('returns same root by reference when id not found', () => {
    const result = updateById(filter, 'nonexistent', (n) => n);
    expect(result).toBe(filter);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm exec jest --selectProjects core --runInBand src/__tests__/tree-map.spec.ts`
Expected: FAIL — module `../tree-map` not found

**Step 3: Implement `mapTree` and `updateById`**

Create `packages/core/src/tree-map.ts`:

```ts
import type { FilterAny, FilterGroup, FilterGroupIC, FilterRule } from './types';
import { isFilterGroup } from './types';
import { isFilterGroupIC } from './ic';

type AnyNode = FilterRule | FilterGroup | FilterGroupIC;

export interface MapTreeVisitor {
  /** Called for every group node. Must return a group (same ref = no change). */
  onGroup?: (group: FilterGroup | FilterGroupIC) => FilterGroup | FilterGroupIC;
  /** Called for every rule node. Must return a rule (same ref = no change). */
  onRule?: (rule: FilterRule) => FilterRule;
}

export function mapTree(filter: FilterAny, visitor: MapTreeVisitor): FilterAny {
  return mapNode(filter, visitor) as FilterAny;
}

function mapNode(node: AnyNode, visitor: MapTreeVisitor): AnyNode {
  if (isFilterGroup(node) || isFilterGroupIC(node)) {
    return mapGroupLike(node, visitor);
  }
  return visitor.onRule ? visitor.onRule(node as FilterRule) : node;
}

function mapGroupLike(
  group: FilterGroup | FilterGroupIC,
  visitor: MapTreeVisitor
): FilterGroup | FilterGroupIC {
  // onGroup transforms the SHELL only (combinator, not, etc). It should NOT
  // change the condition refs — if it needs to modify conditions (e.g. IC splice
  // for remove), it must keep the same rule/group object refs so mapTree's
  // recursion is idempotent. mapTree then recurses into those refs, applying
  // onRule/onGroup, and short-circuits via reference equality when nothing changes.
  const afterOnGroup = visitor.onGroup ? visitor.onGroup(group) : group;

  let changed = afterOnGroup !== group;

  const newConditions = afterOnGroup.conditions.map((c) => {
    if (typeof c === 'string') return c; // IC combinator passthrough
    const mapped = mapNode(c, visitor);
    if (mapped !== c) changed = true;
    return mapped;
  });

  if (!changed) return group; // short-circuit: return original ref
  return { ...afterOnGroup, conditions: newConditions };
}

/**
 * Thin helper: transform the node (rule or group) with matching id, leave others.
 * Returns same root ref by reference when id not found.
 */
export function updateById(
  filter: FilterAny,
  id: string,
  updater: (node: AnyNode) => AnyNode
): FilterAny {
  return mapTree(filter, {
    onGroup: (g) => (g.id === id ? updater(g) : g),
    onRule: (r) => (r.id === id ? updater(r) : r),
  }) as FilterAny;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm exec jest --selectProjects core --runInBand src/__tests__/tree-map.spec.ts`
Expected: PASS

**Step 5: Run full core suite to check no regressions**

Run: `pnpm exec jest --selectProjects core --runInBand`
Expected: PASS (tree-map is new, doesn't touch existing yet)

**Step 6: Export from index.ts**

In `packages/core/src/index.ts`, add after the traverse exports:

```ts
export type { MapTreeVisitor } from './tree-map';
export { mapTree, updateById } from './tree-map';
```

**Step 7: Typecheck + lint**

Run: `pnpm --filter @x-filter/core typecheck && pnpm --filter @x-filter/core lint`
Expected: PASS

**Step 8: Commit**

```bash
git add packages/core/src/tree-map.ts packages/core/src/__tests__/tree-map.spec.ts packages/core/src/index.ts
git commit -m "$(cat <<'EOF'
feat(core): add mapTree + updateById primitives

mapTree is the immutable transform primitive with reference-equality
short-circuit. onGroup is the primary entry; onRule optional sugar.
IC combinator strings pass through untouched. updateById is a thin
helper for id-targeted transforms.

Refs ADR 0001

Generated with [Devin](https://devin.ai)

Co-Authored-By: Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>
EOF
)"
```

---

### Task 3: Rewrite mutations.ts to use mapTree (standard mode)

Replace `updateGroupInTree`/`updateRuleInTree`/`removeConditionFromTree`/`findRuleInTree`/`findGroupInTree` with `mapTree`/`updateById`/`findById`/`findParent` from traverse + tree-map. Keep public API (`addRule`/`updateRule`/`removeRule`/`addGroup`/`removeGroup`/`updateGroup`/`moveRule`) signatures identical. Do NOT touch `moveRule` yet (Task 5).

**Files:**
- Modify: `packages/core/src/mutations.ts`
- Test: `packages/core/src/__tests__/mutations.spec.ts` (should pass unchanged)

**Step 1: Run existing mutation tests to establish baseline**

Run: `pnpm exec jest --selectProjects core --runInBand src/__tests__/mutations.spec.ts`
Expected: PASS (baseline green before refactor)

**Step 2: Rewrite mutations.ts (excluding moveRule)**

Replace the entire content of `packages/core/src/mutations.ts` with:

```ts
import { generateId, type IdGenerator } from './id';
import { findById, findParent } from './traverse';
import { mapTree, updateById } from './tree-map';
import type { Filter, FilterGroup, FilterRule } from './types';
import { isFilterGroup } from './types';

export interface MutationOptions {
  idGenerator?: IdGenerator;
}

export function addRule(
  filter: Filter,
  groupId: string,
  rule: Partial<FilterRule>,
  options?: MutationOptions
): Filter {
  const newRule: FilterRule = {
    id: rule.id ?? (options?.idGenerator ?? generateId)(),
    field: rule.field ?? '',
    operator: rule.operator ?? '',
    value: rule.value ?? null,
  };
  if (rule.not !== undefined) {
    newRule.not = rule.not;
  }

  const result = updateById(filter, groupId, (node) => {
    const g = node as FilterGroup;
    return { ...g, conditions: [...g.conditions, newRule] };
  });

  if (result === filter) {
    throw new Error(`Group not found: ${groupId}`);
  }
  return result as Filter;
}

export function updateRule(
  filter: Filter,
  ruleId: string,
  updates: Partial<Omit<FilterRule, 'id'>>
): Filter {
  return updateById(filter, ruleId, (r) => ({
    ...(r as FilterRule),
    ...updates,
  })) as Filter;
}

export function removeRule(filter: Filter, ruleId: string): Filter {
  return removeCondition(filter, ruleId);
}

function removeCondition(filter: Filter, conditionId: string): Filter {
  const result = mapTree(filter, {
    onGroup: (g) => {
      const idx = g.conditions.findIndex(
        (c) => typeof c !== 'string' && 'id' in c && c.id === conditionId
      );
      if (idx === -1) return g;
      return {
        ...g,
        conditions: g.conditions.filter((_, i) => i !== idx),
      };
    },
  });
  return result as Filter;
}

export function moveRule(
  filter: Filter,
  ruleId: string,
  targetGroupId: string,
  position: number
): Filter {
  // Placeholder: will be rewritten in Task 5. For now, keep original logic.
  return moveRuleLegacy(filter, ruleId, targetGroupId, position);
}

function moveRuleLegacy(
  filter: Filter,
  ruleId: string,
  targetGroupId: string,
  position: number
): Filter {
  const rule = findById(filter, ruleId) as FilterRule | undefined;
  if (!rule) {
    throw new Error(`Rule not found: ${ruleId}`);
  }

  const result = updateById(filter, targetGroupId, (node) => {
    const g = node as FilterGroup;
    const currentIdx = g.conditions.findIndex(
      (c) => typeof c !== 'string' && 'id' in c && c.id === ruleId
    );

    if (currentIdx !== -1) {
      const newConditions = [...g.conditions];
      newConditions.splice(currentIdx, 1);
      newConditions.splice(position, 0, rule);
      return { ...g, conditions: newConditions };
    }

    const newConditions = [...g.conditions];
    newConditions.splice(position, 0, rule);
    return { ...g, conditions: newConditions };
  });

  if (result === filter) {
    throw new Error(`Target group not found: ${targetGroupId}`);
  }

  const targetGroup = findById(result, targetGroupId) as FilterGroup | undefined;
  const ruleCountInTarget = targetGroup
    ? targetGroup.conditions.filter(
        (c) => typeof c !== 'string' && 'id' in c && c.id === ruleId
      ).length
    : 0;

  if (ruleCountInTarget > 1) {
    return result as Filter;
  }

  return removeDuplicateRule(result as Filter, ruleId, targetGroupId);
}

function removeDuplicateRule(
  root: FilterGroup,
  ruleId: string,
  keepInGroupId: string
): FilterGroup {
  let changed = false;
  let keptInCurrentGroup = false;
  const newConditions: FilterGroup['conditions'] = [];

  for (const c of root.conditions) {
    if (isFilterGroup(c)) {
      const updated = removeDuplicateRule(c, ruleId, keepInGroupId);
      if (updated !== c) {
        changed = true;
      }
      newConditions.push(updated);
      continue;
    }

    if (c.id !== ruleId) {
      newConditions.push(c);
      continue;
    }

    if (root.id === keepInGroupId && !keptInCurrentGroup) {
      keptInCurrentGroup = true;
      newConditions.push(c);
      continue;
    }

    changed = true;
  }

  return changed ? { ...root, conditions: newConditions } : root;
}

export function addGroup(
  filter: Filter,
  parentGroupId: string,
  group?: Partial<FilterGroup>,
  options?: MutationOptions
): Filter {
  const newGroup: FilterGroup = {
    id: group?.id ?? (options?.idGenerator ?? generateId)(),
    combinator: group?.combinator ?? 'and',
    conditions: group?.conditions ?? [],
  };
  if (group?.not !== undefined) {
    newGroup.not = group.not;
  }

  const result = updateById(filter, parentGroupId, (node) => {
    const g = node as FilterGroup;
    return { ...g, conditions: [...g.conditions, newGroup] };
  });

  if (result === filter) {
    throw new Error(`Parent group not found: ${parentGroupId}`);
  }
  return result as Filter;
}

export function removeGroup(filter: Filter, groupId: string): Filter {
  if (filter.id === groupId) {
    throw new Error('Cannot remove root group');
  }
  return removeCondition(filter, groupId);
}

export function updateGroup(
  filter: Filter,
  groupId: string,
  updates: Partial<Pick<FilterGroup, 'combinator' | 'not'>>
): Filter {
  return updateById(filter, groupId, (node) => {
    const g = node as FilterGroup;
    return { ...g, ...updates };
  }) as Filter;
}
```

Note: `findParent` import is unused for now (will be used in Task 5). Biome will warn. To avoid the warning, only import what's used. Replace the import line with `import { findById } from './traverse';` for now — we'll add `findParent` back in Task 5.

**Step 3: Run mutation tests to verify refactor preserves behavior**

Run: `pnpm exec jest --selectProjects core --runInBand src/__tests__/mutations.spec.ts`
Expected: PASS — all 30+ tests green, behavior unchanged

**Step 4: Run full core suite**

Run: `pnpm exec jest --selectProjects core --runInBand`
Expected: PASS

**Step 5: Typecheck + lint**

Run: `pnpm --filter @x-filter/core typecheck && pnpm --filter @x-filter/core lint`
Expected: PASS (fix any unused import warnings)

**Step 6: Commit**

```bash
git add packages/core/src/mutations.ts
git commit -m "$(cat <<'EOF'
refactor(core): rewrite mutations on mapTree/updateById

Replace updateGroupInTree/updateRuleInTree/removeConditionFromTree
with mapTree/updateById. moveRule keeps legacy impl pending Task 5.
Public API unchanged; all mutation tests pass unmodified.

Refs ADR 0001

Generated with [Devin](https://devin.ai)

Co-Authored-By: Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>
EOF
)"
```

---

### Task 4: Fold negate.ts into mutations.ts and delete negate.ts

`negateRule`/`negateGroup` become `updateById` one-liners in mutations.ts. Delete negate.ts. Update index.ts exports. Update negate.spec.ts import path. No external consumers (verified: react/shadcn/antd don't import negate).

**Files:**
- Modify: `packages/core/src/mutations.ts` (add negateRule/negateGroup)
- Delete: `packages/core/src/negate.ts`
- Modify: `packages/core/src/index.ts` (re-export from mutations)
- Modify: `packages/core/src/__tests__/negate.spec.ts` (import from mutations)

**Step 1: Add negate functions to mutations.ts**

In `packages/core/src/mutations.ts`, add at the end (after `updateGroup`):

```ts
export function negateRule(filter: Filter, ruleId: string): Filter {
  return updateById(filter, ruleId, (r) => {
    const rule = r as FilterRule;
    return { ...rule, not: !rule.not };
  }) as Filter;
}

export function negateGroup(filter: Filter, groupId: string): Filter {
  return updateById(filter, groupId, (g) => {
    const group = g as FilterGroup;
    return { ...group, not: !group.not };
  }) as Filter;
}
```

**Step 2: Update index.ts exports**

In `packages/core/src/index.ts`, remove the line:
```ts
export { negateGroup, negateRule } from './negate';
```

And add `negateGroup, negateRule` to the mutations export block:
```ts
export {
  addGroup,
  addRule,
  moveRule,
  negateGroup,
  negateRule,
  removeGroup,
  removeRule,
  updateGroup,
  updateRule,
} from './mutations';
```

**Step 3: Update negate.spec.ts import**

In `packages/core/src/__tests__/negate.spec.ts`, change line 1:
```ts
import { negateGroup, negateRule } from '../mutations';
```

**Step 4: Delete negate.ts**

Run: `rm packages/core/src/negate.ts`

**Step 5: Run negate + mutation + full core tests**

Run: `pnpm exec jest --selectProjects core --runInBand src/__tests__/negate.spec.ts src/__tests__/mutations.spec.ts`
Expected: PASS

Then: `pnpm exec jest --selectProjects core --runInBand`
Expected: PASS — no regressions

**Step 6: Typecheck + lint**

Run: `pnpm --filter @x-filter/core typecheck && pnpm --filter @x-filter/core lint`
Expected: PASS

**Step 7: Commit**

```bash
git add packages/core/src/mutations.ts packages/core/src/index.ts packages/core/src/__tests__/negate.spec.ts
git rm packages/core/src/negate.ts
git commit -m "$(cat <<'EOF'
refactor(core): fold negate.ts into mutations.ts

negateRule/negateGroup become updateById one-liners. Deletes
~65 lines of duplicated traversal. No external consumers affected.

Refs ADR 0001

Generated with [Devin](https://devin.ai)

Co-Authored-By: Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>
EOF
)"
```

---

### Task 5: Rewrite moveRule as single-pass mapTree

Replace the two-pass `moveRuleLegacy` + `removeDuplicateRule` with one `mapTree` pass using closure-captured rule/target/position. Source group removes the rule, target group inserts it — simultaneously, no intermediate invalid state.

**Files:**
- Modify: `packages/core/src/mutations.ts`
- Test: `packages/core/src/__tests__/mutations.spec.ts` (existing moveRule tests must pass; add edge case test)

**Step 1: Add failing edge-case test for deep cross-group move**

Add to the `describe('moveRule')` block in `packages/core/src/__tests__/mutations.spec.ts` (after the "moves rule from descendant group to ancestor group" test):

```ts
  it('moves rule between sibling groups at same depth without duplicates', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [
        {
          id: 'g1',
          combinator: 'or',
          conditions: [
            { id: 'r1', field: 'a', operator: 'eq', value: 1 },
            { id: 'r2', field: 'b', operator: 'eq', value: 2 },
          ],
        },
        {
          id: 'g2',
          combinator: 'and',
          conditions: [{ id: 'r3', field: 'c', operator: 'eq', value: 3 }],
        },
      ],
    };
    const result = moveRule(filter, 'r2', 'g2', 0);
    const g1 = result.conditions[0] as Filter;
    const g2 = result.conditions[1] as Filter;
    expect(g1.conditions).toHaveLength(1);
    expect((g1.conditions[0] as FilterRule).id).toBe('r1');
    expect(g2.conditions).toHaveLength(2);
    expect((g2.conditions[0] as FilterRule).id).toBe('r2');
    expect((g2.conditions[1] as FilterRule).id).toBe('r3');
    // No duplicate r2 anywhere in tree
    const r2Count = JSON.stringify(result).split('"id":"r2"').length - 1;
    expect(r2Count).toBe(1);
  });

  it('same-group move: position is post-removal index', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
        { id: 'r2', field: 'b', operator: 'eq', value: 2 },
        { id: 'r3', field: 'c', operator: 'eq', value: 3 },
      ],
    };
    // Move r1 to position 1 (after removal, positions are: r2@0, r3@1)
    // Inserting at 1 puts r1 between r2 and r3
    const result = moveRule(filter, 'r1', 'root', 1);
    expect((result.conditions[0] as FilterRule).id).toBe('r2');
    expect((result.conditions[1] as FilterRule).id).toBe('r1');
    expect((result.conditions[2] as FilterRule).id).toBe('r3');
  });

  it('moves root-level rule to nested group without duplicates', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
        {
          id: 'g1',
          combinator: 'or',
          conditions: [],
        },
      ],
    };
    const result = moveRule(filter, 'r1', 'g1', 0);
    // r1 removed from root
    expect(result.conditions).toHaveLength(1);
    expect((result.conditions[0] as FilterGroup).id).toBe('g1');
    const g1 = result.conditions[0] as Filter;
    expect(g1.conditions).toHaveLength(1);
    expect((g1.conditions[0] as FilterRule).id).toBe('r1');
    // No duplicate r1 anywhere in tree
    const r1Count = JSON.stringify(result).split('"id":"r1"').length - 1;
    expect(r1Count).toBe(1);
  });
```

**Step 2: Run to verify new tests pass with legacy impl (sanity)**

Run: `pnpm exec jest --selectProjects core --runInBand src/__tests__/mutations.spec.ts -t "moveRule"`
Expected: PASS (legacy should handle these — confirms test correctness)

**Step 3: Rewrite moveRule in mutations.ts**

In `packages/core/src/mutations.ts`, replace the `moveRule` function and delete `moveRuleLegacy` and `removeDuplicateRule`. Update the `findById` import to also import `findParent`:

```ts
import { findById, findParent } from './traverse';
```

New `moveRule`:

```ts
export function moveRule(
  filter: Filter,
  ruleId: string,
  targetGroupId: string,
  position: number
): Filter {
  const rule = findById(filter, ruleId) as FilterRule | undefined;
  if (!rule) {
    throw new Error(`Rule not found: ${ruleId}`);
  }

  const sourceParent = findParent(filter, ruleId) as FilterGroup | undefined;
  const isSameGroup = sourceParent?.id === targetGroupId;

  let targetFound = false;

  const result = mapTree(filter, {
    onGroup: (g) => {
      const group = g as FilterGroup;

      if (g.id === targetGroupId) {
        targetFound = true;
        if (isSameGroup) {
          // Same-group: remove then insert at post-removal position
          const newConditions = [...group.conditions];
          const currentIdx = newConditions.findIndex(
            (c) => typeof c !== 'string' && 'id' in c && c.id === ruleId
          );
          if (currentIdx !== -1) {
            newConditions.splice(currentIdx, 1);
          }
          newConditions.splice(position, 0, rule);
          return { ...group, conditions: newConditions };
        }
        // Cross-group: insert at position (rule not yet here)
        const newConditions = [...group.conditions];
        newConditions.splice(position, 0, rule);
        return { ...group, conditions: newConditions };
      }

      // Non-target group: remove the rule if present (source group cleanup)
      if (!isSameGroup && sourceParent && g.id === sourceParent.id) {
        const idx = group.conditions.findIndex(
          (c) => typeof c !== 'string' && 'id' in c && c.id === ruleId
        );
        if (idx !== -1) {
          return {
            ...group,
            conditions: group.conditions.filter((_, i) => i !== idx),
          };
        }
      }

      return g;
    },
  });

  if (!targetFound) {
    throw new Error(`Target group not found: ${targetGroupId}`);
  }

  return result as Filter;
}
```

Delete `moveRuleLegacy` and `removeDuplicateRule` functions entirely. Also remove the now-unused `isFilterGroup` import if no other code in mutations.ts uses it — check: `removeDuplicateRule` was the only user. Remove `import { isFilterGroup } from './types';` if unused after deletion.

**Step 4: Run moveRule tests**

Run: `pnpm exec jest --selectProjects core --runInBand src/__tests__/mutations.spec.ts -t "moveRule"`
Expected: PASS — all moveRule tests including new edge cases

**Step 5: Run full mutation + core suite**

Run: `pnpm exec jest --selectProjects core --runInBand src/__tests__/mutations.spec.ts && pnpm exec jest --selectProjects core --runInBand`
Expected: PASS

**Step 6: Typecheck + lint**

Run: `pnpm --filter @x-filter/core typecheck && pnpm --filter @x-filter/core lint`
Expected: PASS (remove unused imports if flagged)

**Step 7: Commit**

```bash
git add packages/core/src/mutations.ts packages/core/src/__tests__/mutations.spec.ts
git commit -m "$(cat <<'EOF'
refactor(core): rewrite moveRule as single-pass mapTree

Replace two-pass move+removeDuplicateRule with one mapTree pass.
Source group removes rule and target group inserts it in the same
traversal — no intermediate invalid state. Deletes removeDuplicateRule.
Same-group position semantics: post-removal index (unchanged).

Refs ADR 0001

Generated with [Devin](https://devin.ai)

Co-Authored-By: Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>
EOF
)"
```

---

### Task 6: Rewrite IC mutations to use mapTree

Replace `updateGroupICInTree` with `mapTree`. `removeConditionICFromTree` keeps its splice logic but rides `mapTree` via `onGroup`. IC combinator strings pass through untouched (mapTree handles this).

**Files:**
- Modify: `packages/core/src/ic.ts`
- Test: `packages/core/src/__tests__/ic.spec.ts` (should pass unchanged)

**Step 1: Run existing IC tests for baseline**

Run: `pnpm exec jest --selectProjects core --runInBand src/__tests__/ic.spec.ts`
Expected: PASS

**Step 2: Rewrite IC mutations**

In `packages/core/src/ic.ts`, replace `updateGroupICInTree` and `removeConditionICFromTree` (lines 110-167) with `mapTree`-based versions. The splice logic (remove node + adjacent combinator) is extracted into a pure helper `removeConditionICFromGroup` that operates on a single group — this keeps the cross-element splice isolated from `mapTree`'s per-element recursion. Add import at top:

```ts
import { mapTree } from './tree-map';
```

Replace the two functions with:

```ts
function removeConditionICFromGroup(
  group: FilterGroupIC,
  conditionId: string
): FilterGroupIC {
  const idx = group.conditions.findIndex(
    (c) => typeof c !== 'string' && 'id' in c && c.id === conditionId
  );
  if (idx === -1) return group;

  const newConditions = [...group.conditions];
  if (newConditions.length === 1) {
    newConditions.splice(idx, 1);
  } else if (idx === 0) {
    newConditions.splice(0, 2);
  } else {
    newConditions.splice(idx - 1, 2);
  }
  return { ...group, conditions: newConditions };
}

function removeConditionICFromTree(root: FilterGroupIC, conditionId: string): FilterGroupIC {
  return mapTree(root, {
    onGroup: (g) => {
      const group = g as FilterGroupIC;
      const removed = removeConditionICFromGroup(group, conditionId);
      return removed;
    },
  }) as FilterGroupIC;
}
```

Then update `addRuleIC` to use `mapTree` instead of `updateGroupICInTree`. Replace the `updateGroupICInTree` call in `addRuleIC` (around line 186) with:

```ts
  const result = mapTree(filter, {
    onGroup: (g) => {
      if (g.id !== groupId) return g;
      const group = g as FilterGroupIC;
      const nonCombinatorCount = group.conditions.filter((c) => typeof c !== 'string').length;
      const newConditions: FilterGroupIC['conditions'] =
        nonCombinatorCount > 0 ? [...group.conditions, defaultCombinator, newRule] : [newRule];
      return { ...group, conditions: newConditions };
    },
  }) as FilterIC;
```

Delete the `updateGroupICInTree` function entirely (no longer used).

**Step 3: Run IC tests**

Run: `pnpm exec jest --selectProjects core --runInBand src/__tests__/ic.spec.ts`
Expected: PASS — all IC tests green, behavior unchanged

**Step 4: Run full core suite**

Run: `pnpm exec jest --selectProjects core --runInBand`
Expected: PASS

**Step 5: Typecheck + lint**

Run: `pnpm --filter @x-filter/core typecheck && pnpm --filter @x-filter/core lint`
Expected: PASS

**Step 6: Commit**

```bash
git add packages/core/src/ic.ts
git commit -m "$(cat <<'EOF'
refactor(core): rewrite IC mutations on mapTree

Replace updateGroupICInTree with mapTree. removeConditionICFromTree
keeps its splice logic (node + adjacent combinator) but rides
mapTree's recursion via onGroup. IC combinator strings pass through
untouched.

Refs ADR 0001

Generated with [Devin](https://devin.ai)

Co-Authored-By: Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>
EOF
)"
```

---

### Task 7: Final verification + cleanup

Run the entire test suite, typecheck, lint, and verify no dead code remains.

**Step 1: Full repo test suite**

Run: `pnpm test`
Expected: PASS — all projects (core, react, shadcn, antd, playground, web) green

**Step 2: Core typecheck + lint + format check**

Run: `pnpm --filter @x-filter/core typecheck && pnpm --filter @x-filter/core lint && pnpm --filter @x-filter/core format`
Expected: PASS

**Step 3: Verify no dead code**

Run: `grep -rn "updateGroupInTree\|updateRuleInTree\|removeConditionFromTree\|moveRuleLegacy\|removeDuplicateRule\|updateGroupICInTree" packages/core/src/`
Expected: no matches (all legacy functions deleted)

Run: `grep -rn "from.*negate" packages/core/src/`
Expected: no matches (negate.ts deleted, exports come from mutations)

**Step 4: Verify ADR + CONTEXT still accurate**

Read `docs/adr/0001-tree-walker-primitives.md` and `CONTEXT.md` — confirm they match the implemented state. No changes needed unless implementation diverged from plan (if so, update ADR).

**Step 5: Commit any cleanup**

```bash
git add -A
git commit -m "$(cat <<'EOF'
chore(core): final cleanup after tree walker refactor

Verify no dead code, all tests pass, lint clean.

Refs ADR 0001

Generated with [Devin](https://devin.ai)

Co-Authored-By: Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>
EOF
)"
```

(if no changes to commit, skip — `git status` will show clean)

---

## Summary

| Task | What | Files touched | Commit |
|------|------|---------------|--------|
| 1 | `walk` primitive | traverse.ts, index.ts | refactor |
| 2 | `mapTree` + `updateById` | tree-map.ts (new), index.ts | feat |
| 3 | mutations.ts on mapTree (moveRule deferred) | mutations.ts | refactor |
| 4 | fold negate.ts → mutations.ts, delete negate.ts | mutations.ts, negate.ts (del), index.ts, negate.spec.ts | refactor |
| 5 | moveRule single-pass rewrite | mutations.ts, mutations.spec.ts | refactor |
| 6 | IC mutations on mapTree | ic.ts | refactor |
| 7 | final verification | (none unless cleanup) | chore |

**Net effect:** ~65 lines deleted (negate.ts), `removeDuplicateRule` deleted (~35 lines), 4 traversal implementations consolidated to 2 primitives. validate.ts untouched per ADR.
