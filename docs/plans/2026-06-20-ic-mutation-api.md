# IC Mutation API Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the IC mutation API so IC mode has feature parity with standard mode, built on shared tree-mutation primitives.

**Architecture:** Extract FilterAny tree-mutation primitives into `tree-mutations.ts`. Refactor `mutations.ts`, `negate.ts`, and `ic.ts` to use them. Clean up standard `moveRule` edge cases. Implement 5 new IC mutation functions. Define a `MutationAdapter` interface so contract tests can run the same logical scenarios against both modes.

**Tech Stack:** TypeScript, Jest with ts-jest (ESM preset), pnpm monorepo, Biome linter.

---

## Key Concepts (from architecture discussion)

- **Standard mode** (`FilterGroup`): combinator is a group property (one value per group).
- **IC mode** (`FilterGroupIC`): combinators are inline tokens at odd indices in the `conditions` array.
- **Item index**: zero-based position counting only rules/groups, never combinators. Used as `position` in move operations so both modes share semantics.
- **`updateGroupIC` only accepts `{ not }`** — IC groups have no `combinator` property; combinator modification is a separate operation.
- **Negate functions are unified to FilterAny** — no `negateRuleIC` / `negateGroupIC` needed.
- **Parallel functions + abstract adapter** — not unified FilterAny functions, because parameter differences (e.g. `defaultCombinator`) would cause hidden behavior.

## Test Commands

```bash
# Run a single core test file
pnpm test -- packages/core/src/__tests__/<file>.spec.ts

# Run all core tests
pnpm test -- packages/core

# Run all tests
pnpm test

# Typecheck
pnpm typecheck

# Lint
pnpm check
```

## File Map

**Create:**
- `packages/core/src/tree-mutations.ts` — shared FilterAny tree-mutation primitives
- `packages/core/src/__tests__/tree-mutations.spec.ts` — tests for shared primitives
- `packages/core/src/mutation-adapter.ts` — abstract `MutationAdapter` interface + standard/IC implementations
- `packages/core/src/__tests__/mutation-adapter.spec.ts` — shared logical-assertion contract tests

**Modify:**
- `packages/core/src/mutations.ts` — import from `tree-mutations.ts`, clean up `moveRule`
- `packages/core/src/negate.ts` — import from `tree-mutations.ts`, generalize to FilterAny
- `packages/core/src/ic.ts` — import from `tree-mutations.ts`, add 5 new IC mutations
- `packages/core/src/index.ts` — export new functions
- `packages/core/src/__tests__/mutations.spec.ts` — add edge-case tests for `moveRule`
- `packages/core/src/__tests__/negate.spec.ts` — add IC mode tests (proving negate works on FilterAny)
- `packages/core/src/__tests__/ic.spec.ts` — add tests for 5 new IC mutations

---

### Task 1: Create `tree-mutations.ts` with shared FilterAny primitives

**Files:**
- Create: `packages/core/src/tree-mutations.ts`
- Test: `packages/core/src/__tests__/tree-mutations.spec.ts`

**Step 1: Write the failing test**

Create `packages/core/src/__tests__/tree-mutations.spec.ts`:

```typescript
import {
  findGroupInTreeAny,
  findRuleInTreeAny,
  removeConditionFromTreeAny,
  removeDuplicateConditionAny,
  updateGroupInTreeAny,
  updateRuleInTreeAny,
} from '../tree-mutations';
import { isFilterGroupIC } from '../ic';
import type { Filter, FilterIC, FilterRule } from '../types';

// Helper: extract item ids from a conditions array (skips combinator strings)
function itemIds(conditions: unknown[]): string[] {
  return conditions
    .filter((c) => typeof c !== 'string')
    .map((c) => (c as { id: string }).id);
}

describe('updateGroupInTreeAny', () => {
  it('updates a standard group by id', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [
        { id: 'g1', combinator: 'or', conditions: [] },
      ],
    };
    const result = updateGroupInTreeAny(filter, 'g1', (g) => ({ ...g, not: true }));
    expect(result.conditions[0]).toMatchObject({ id: 'g1', not: true });
  });

  it('updates an IC group by id', () => {
    const filter: FilterIC = {
      id: 'root',
      conditions: [
        { id: 'g1', conditions: [] },
      ],
    };
    const result = updateGroupInTreeAny(filter, 'g1', (g) => ({ ...g, not: true }));
    expect(result.conditions[0]).toMatchObject({ id: 'g1', not: true });
  });

  it('updates root group itself', () => {
    const filter: Filter = { id: 'root', combinator: 'and', conditions: [] };
    const result = updateGroupInTreeAny(filter, 'root', (g) => ({ ...g, not: true }));
    expect(result).toMatchObject({ id: 'root', not: true });
  });

  it('returns unchanged when target not found', () => {
    const filter: Filter = { id: 'root', combinator: 'and', conditions: [] };
    const result = updateGroupInTreeAny(filter, 'nope', (g) => ({ ...g, not: true }));
    expect(result).toBe(filter);
  });

  it('skips combinator strings in IC conditions', () => {
    const filter: FilterIC = {
      id: 'root',
      conditions: [
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
        'and',
        { id: 'g1', conditions: [] },
      ],
    };
    const result = updateGroupInTreeAny(filter, 'g1', (g) => ({ ...g, not: true }));
    expect(result.conditions[1]).toBe('and');
    expect(result.conditions[2]).toMatchObject({ id: 'g1', not: true });
  });
});

describe('updateRuleInTreeAny', () => {
  it('updates a rule in standard mode', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [{ id: 'r1', field: 'a', operator: 'eq', value: 1 }],
    };
    const result = updateRuleInTreeAny(filter, 'r1', (r) => ({ ...r, value: 99 }));
    expect(result.conditions[0]).toMatchObject({ id: 'r1', value: 99 });
  });

  it('updates a rule in IC mode (skips combinator strings)', () => {
    const filter: FilterIC = {
      id: 'root',
      conditions: [
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
        'and',
        { id: 'r2', field: 'b', operator: 'eq', value: 2 },
      ],
    };
    const result = updateRuleInTreeAny(filter, 'r2', (r) => ({ ...r, value: 99 }));
    expect(result.conditions[1]).toBe('and');
    expect(result.conditions[2]).toMatchObject({ id: 'r2', value: 99 });
  });

  it('updates rule inside nested IC group', () => {
    const filter: FilterIC = {
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
    const result = updateRuleInTreeAny(filter, 'r2', (r) => ({ ...r, value: 99 }));
    const g1 = result.conditions[0] as FilterIC;
    expect(g1.conditions[1]).toBe('or');
    expect(g1.conditions[2]).toMatchObject({ id: 'r2', value: 99 });
  });

  it('returns unchanged when ruleId not found', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [{ id: 'r1', field: 'a', operator: 'eq', value: 1 }],
    };
    const result = updateRuleInTreeAny(filter, 'nope', (r) => r);
    expect(result).toBe(filter);
  });
});

describe('removeConditionFromTreeAny', () => {
  it('removes a rule from standard mode', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
        { id: 'r2', field: 'b', operator: 'eq', value: 2 },
      ],
    };
    const result = removeConditionFromTreeAny(filter, 'r1');
    expect(itemIds(result.conditions)).toEqual(['r2']);
  });

  it('removes a rule from IC mode (without touching combinator logic — caller handles that)', () => {
    // NOTE: removeConditionFromTreeAny only removes the item node.
    // IC combinator removal is handled by the IC-specific removeRuleIC wrapper.
    const filter: FilterIC = {
      id: 'root',
      conditions: [
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
        'and',
        { id: 'r2', field: 'b', operator: 'eq', value: 2 },
      ],
    };
    const result = removeConditionFromTreeAny(filter, 'r1');
    // The primitive just removes the item; combinator cleanup is IC-specific
    expect(result.conditions).toHaveLength(2);
    expect(result.conditions[0]).toBe('and');
    expect(result.conditions[1]).toMatchObject({ id: 'r2' });
  });

  it('removes a group from standard mode', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [
        { id: 'g1', combinator: 'or', conditions: [] },
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
      ],
    };
    const result = removeConditionFromTreeAny(filter, 'g1');
    expect(itemIds(result.conditions)).toEqual(['r1']);
  });

  it('returns unchanged when id not found', () => {
    const filter: Filter = { id: 'root', combinator: 'and', conditions: [] };
    const result = removeConditionFromTreeAny(filter, 'nope');
    expect(result).toBe(filter);
  });
});

describe('findRuleInTreeAny', () => {
  it('finds a rule in standard mode', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [{ id: 'r1', field: 'a', operator: 'eq', value: 1 }],
    };
    const found = findRuleInTreeAny(filter, 'r1');
    expect(found).toMatchObject({ id: 'r1' });
  });

  it('finds a rule in IC mode (skips combinators)', () => {
    const filter: FilterIC = {
      id: 'root',
      conditions: [
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
        'and',
        { id: 'r2', field: 'b', operator: 'eq', value: 2 },
      ],
    };
    const found = findRuleInTreeAny(filter, 'r2');
    expect(found).toMatchObject({ id: 'r2' });
  });

  it('returns undefined when not found', () => {
    const filter: Filter = { id: 'root', combinator: 'and', conditions: [] };
    const found = findRuleInTreeAny(filter, 'nope');
    expect(found).toBeUndefined();
  });
});

describe('findGroupInTreeAny', () => {
  it('finds a group in standard mode', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [{ id: 'g1', combinator: 'or', conditions: [] }],
    };
    const found = findGroupInTreeAny(filter, 'g1');
    expect(found).toMatchObject({ id: 'g1' });
  });

  it('finds root group', () => {
    const filter: Filter = { id: 'root', combinator: 'and', conditions: [] };
    const found = findGroupInTreeAny(filter, 'root');
    expect(found).toBe(filter);
  });

  it('finds a group in IC mode', () => {
    const filter: FilterIC = {
      id: 'root',
      conditions: [
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
        'and',
        { id: 'g1', conditions: [] },
      ],
    };
    const found = findGroupInTreeAny(filter, 'g1');
    expect(found).toMatchObject({ id: 'g1' });
  });
});

describe('removeDuplicateConditionAny', () => {
  it('removes duplicate rule keeping the one in keepInGroupId (standard)', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [
        {
          id: 'g1',
          combinator: 'or',
          conditions: [{ id: 'r1', field: 'a', operator: 'eq', value: 1 }],
        },
        {
          id: 'g2',
          combinator: 'and',
          conditions: [{ id: 'r1', field: 'a', operator: 'eq', value: 1 }],
        },
      ],
    };
    const result = removeDuplicateConditionAny(filter, 'r1', 'g2');
    const g1 = result.conditions[0] as Filter;
    const g2 = result.conditions[1] as Filter;
    expect(g1.conditions).toHaveLength(0);
    expect(g2.conditions).toHaveLength(1);
  });

  it('removes duplicate rule in IC mode keeping the one in keepInGroupId', () => {
    const filter: FilterIC = {
      id: 'root',
      conditions: [
        {
          id: 'g1',
          conditions: [{ id: 'r1', field: 'a', operator: 'eq', value: 1 }],
        },
        'and',
        {
          id: 'g2',
          conditions: [{ id: 'r1', field: 'a', operator: 'eq', value: 1 }],
        },
      ],
    };
    const result = removeDuplicateConditionAny(filter, 'r1', 'g2');
    const g1 = result.conditions[0] as FilterIC;
    const g2 = result.conditions[2] as FilterIC;
    expect(g1.conditions).toHaveLength(0);
    expect(g2.conditions).toHaveLength(1);
    expect(result.conditions[1]).toBe('and');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- packages/core/src/__tests__/tree-mutations.spec.ts`
Expected: FAIL with "Cannot find module '../tree-mutations'"

**Step 3: Write minimal implementation**

Create `packages/core/src/tree-mutations.ts`:

```typescript
import type { FilterAny, FilterGroup, FilterGroupIC, FilterRule } from './types';
import { isFilterGroup, isFilterRule } from './types';

type AnyGroup = FilterGroup | FilterGroupIC;
type AnyNode = FilterRule | FilterGroup | FilterGroupIC;

function isGroupLike(node: unknown): node is FilterGroup | FilterGroupIC {
  return typeof node === 'object' && node !== null && 'conditions' in node;
}

/**
 * Update a group anywhere in the tree by id. Works with both FilterGroup and FilterGroupIC.
 * Skips combinator strings in IC conditions arrays.
 */
export function updateGroupInTreeAny(
  root: AnyGroup,
  targetId: string,
  updater: (group: AnyGroup) => AnyGroup
): AnyGroup {
  if (root.id === targetId) {
    return updater(root);
  }

  let changed = false;
  const newConditions = root.conditions.map((c) => {
    if (typeof c === 'string') return c;
    if (isGroupLike(c)) {
      const updated = updateGroupInTreeAny(c as AnyGroup, targetId, updater);
      if (updated !== c) {
        changed = true;
        return updated;
      }
    }
    return c;
  });

  return changed ? ({ ...root, conditions: newConditions } as AnyGroup) : root;
}

/**
 * Update a rule anywhere in the tree by id. Works with both modes.
 * Skips combinator strings in IC conditions arrays.
 */
export function updateRuleInTreeAny(
  root: AnyGroup,
  ruleId: string,
  updater: (rule: FilterRule) => FilterRule
): AnyGroup {
  let changed = false;
  const newConditions = root.conditions.map((c) => {
    if (typeof c === 'string') return c;
    if (isGroupLike(c)) {
      const updated = updateRuleInTreeAny(c as AnyGroup, ruleId, updater);
      if (updated !== c) {
        changed = true;
        return updated;
      }
      return c;
    }
    if (isFilterRule(c) && c.id === ruleId) {
      changed = true;
      return updater(c);
    }
    return c;
  });

  return changed ? ({ ...root, conditions: newConditions } as AnyGroup) : root;
}

/**
 * Remove a condition (rule or group) by id from the tree.
 * In IC mode, this only removes the item node — it does NOT remove adjacent combinators.
 * IC combinator cleanup is the responsibility of the IC-specific wrapper (removeRuleIC).
 */
export function removeConditionFromTreeAny(
  root: AnyGroup,
  conditionId: string
): AnyGroup {
  const idx = root.conditions.findIndex(
    (c) => typeof c !== 'string' && 'id' in c && c.id === conditionId
  );

  if (idx !== -1) {
    const newConditions = root.conditions.filter((_, i) => i !== idx);
    return { ...root, conditions: newConditions } as AnyGroup;
  }

  let changed = false;
  const newConditions = root.conditions.map((c) => {
    if (typeof c === 'string') return c;
    if (isGroupLike(c)) {
      const updated = removeConditionFromTreeAny(c as AnyGroup, conditionId);
      if (updated !== c) {
        changed = true;
        return updated;
      }
    }
    return c;
  });

  return changed ? ({ ...root, conditions: newConditions } as AnyGroup) : root;
}

/**
 * Find a rule by id anywhere in the tree. Returns undefined if not found.
 */
export function findRuleInTreeAny(root: AnyGroup, ruleId: string): FilterRule | undefined {
  for (const c of root.conditions) {
    if (typeof c === 'string') continue;
    if (isGroupLike(c)) {
      const found = findRuleInTreeAny(c as AnyGroup, ruleId);
      if (found) return found;
    } else if (isFilterRule(c) && c.id === ruleId) {
      return c;
    }
  }
  return undefined;
}

/**
 * Find a group by id anywhere in the tree. Returns the root if id matches root.
 */
export function findGroupInTreeAny(root: AnyGroup, groupId: string): AnyGroup | undefined {
  if (root.id === groupId) return root;
  for (const c of root.conditions) {
    if (typeof c === 'string') continue;
    if (isGroupLike(c)) {
      const found = findGroupInTreeAny(c as AnyGroup, groupId);
      if (found) return found;
    }
  }
  return undefined;
}

/**
 * Remove all occurrences of a condition by id, except the one inside keepInGroupId.
 * Used by moveRule to clean up the source after inserting into the target.
 */
export function removeDuplicateConditionAny(
  root: AnyGroup,
  conditionId: string,
  keepInGroupId: string
): AnyGroup {
  let changed = false;
  let keptInCurrentGroup = false;
  const newConditions: AnyGroup['conditions'] = [];

  for (const c of root.conditions) {
    if (typeof c === 'string') {
      newConditions.push(c);
      continue;
    }

    if (isGroupLike(c)) {
      const updated = removeDuplicateConditionAny(c as AnyGroup, conditionId, keepInGroupId);
      if (updated !== c) {
        changed = true;
      }
      newConditions.push(updated);
      continue;
    }

    if (!('id' in c) || c.id !== conditionId) {
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

  return changed ? ({ ...root, conditions: newConditions } as AnyGroup) : root;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- packages/core/src/__tests__/tree-mutations.spec.ts`
Expected: PASS (all tests green)

**Step 5: Commit**

```bash
git add packages/core/src/tree-mutations.ts packages/core/src/__tests__/tree-mutations.spec.ts
git commit -m "feat: extract shared FilterAny tree-mutation primitives"
```

---

### Task 2: Refactor `negate.ts` to use shared primitives (generalize to FilterAny)

**Files:**
- Modify: `packages/core/src/negate.ts`
- Modify: `packages/core/src/__tests__/negate.spec.ts`

**Step 1: Write the failing test**

Add to the end of `packages/core/src/__tests__/negate.spec.ts`:

```typescript
import type { FilterIC } from '../types';

describe('negateRule on IC mode', () => {
  it('toggles not on an IC rule (skips combinator strings)', () => {
    const ic: FilterIC = {
      id: 'root',
      conditions: [
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
        'and',
        { id: 'r2', field: 'b', operator: 'eq', value: 2 },
      ],
    };
    const result = negateRule(ic, 'r2');
    expect(result.conditions[1]).toBe('and');
    expect(result.conditions[2]).toMatchObject({ id: 'r2', not: true });
  });

  it('negates rule inside nested IC group', () => {
    const ic: FilterIC = {
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
    const result = negateRule(ic, 'r1');
    const g1 = result.conditions[0] as FilterIC;
    expect(g1.conditions[0]).toMatchObject({ id: 'r1', not: true });
    expect(g1.conditions[1]).toBe('or');
  });
});

describe('negateGroup on IC mode', () => {
  it('toggles not on an IC group', () => {
    const ic: FilterIC = {
      id: 'root',
      conditions: [
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
        'and',
        { id: 'g1', conditions: [] },
      ],
    };
    const result = negateGroup(ic, 'g1');
    expect(result.conditions[2]).toMatchObject({ id: 'g1', not: true });
    expect(result.conditions[1]).toBe('and');
  });

  it('negates root IC group', () => {
    const ic: FilterIC = { id: 'root', conditions: [] };
    const result = negateGroup(ic, 'root');
    expect(result).toMatchObject({ id: 'root', not: true });
  });
});
```

Also add `FilterIC` to the existing import at the top of the file:

```typescript
import type { Filter, FilterIC } from '../types';
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- packages/core/src/__tests__/negate.spec.ts`
Expected: FAIL — negateRule/negateGroup don't accept FilterIC (TypeScript error or runtime: combinator strings not skipped)

**Step 3: Rewrite `negate.ts` to use shared primitives**

Replace the entire contents of `packages/core/src/negate.ts`:

```typescript
import type { FilterAny } from './types';
import { updateGroupInTreeAny, updateRuleInTreeAny } from './tree-mutations';

export function negateRule(filter: FilterAny, ruleId: string): FilterAny {
  return updateRuleInTreeAny(filter, ruleId, (r) => ({
    ...r,
    not: !r.not,
  }));
}

export function negateGroup(filter: FilterAny, groupId: string): FilterAny {
  return updateGroupInTreeAny(filter, groupId, (g) => ({
    ...g,
    not: !g.not,
  }));
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- packages/core/src/__tests__/negate.spec.ts`
Expected: PASS (all existing + new IC tests green)

**Step 5: Run full test suite to check for regressions**

Run: `pnpm test -- packages/core`
Expected: PASS

**Step 6: Commit**

```bash
git add packages/core/src/negate.ts packages/core/src/__tests__/negate.spec.ts
git commit -m "refactor: generalize negate to FilterAny using shared primitives"
```

---

### Task 3: Refactor `mutations.ts` to use shared primitives

**Files:**
- Modify: `packages/core/src/mutations.ts`

**Step 1: Run existing tests to establish baseline**

Run: `pnpm test -- packages/core/src/__tests__/mutations.spec.ts`
Expected: PASS (36 tests) — this is our safety net

**Step 2: Rewrite `mutations.ts`**

Replace the entire contents of `packages/core/src/mutations.ts`:

```typescript
import type { IdGenerator } from './id';
import { generateId } from './id';
import type { Filter, FilterGroup, FilterRule } from './types';
import {
  findGroupInTreeAny,
  findRuleInTreeAny,
  removeConditionFromTreeAny,
  removeDuplicateConditionAny,
  updateGroupInTreeAny,
  updateRuleInTreeAny,
} from './tree-mutations';

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

  const result = updateGroupInTreeAny(filter, groupId, (g) => ({
    ...g,
    conditions: [...g.conditions, newRule],
  }));

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
  return updateRuleInTreeAny(filter, ruleId, (r) => ({ ...r, ...updates })) as Filter;
}

export function removeRule(filter: Filter, ruleId: string): Filter {
  return removeConditionFromTreeAny(filter, ruleId) as Filter;
}

export function moveRule(
  filter: Filter,
  ruleId: string,
  targetGroupId: string,
  position: number
): Filter {
  const rule = findRuleInTreeAny(filter, ruleId);
  if (!rule) {
    throw new Error(`Rule not found: ${ruleId}`);
  }

  const targetGroup = findGroupInTreeAny(filter, targetGroupId);
  if (!targetGroup) {
    throw new Error(`Target group not found: ${targetGroupId}`);
  }

  // Check if rule is in the same group as target (same-group move)
  const isSameGroup = targetGroup.conditions.some(
    (c) => typeof c !== 'string' && 'id' in c && c.id === ruleId
  );

  if (isSameGroup) {
    // Same-group reorder: remove then insert at position
    // position is interpreted as the index AFTER removal
    const result = updateGroupInTreeAny(filter, targetGroupId, (g) => {
      const newConditions = [...g.conditions];
      const currentIdx = newConditions.findIndex(
        (c) => typeof c !== 'string' && 'id' in c && c.id === ruleId
      );
      newConditions.splice(currentIdx, 1);
      newConditions.splice(position, 0, rule);
      return { ...g, conditions: newConditions };
    });
    return result as Filter;
  }

  // Cross-group move: insert into target, then remove from source
  const inserted = updateGroupInTreeAny(filter, targetGroupId, (g) => {
    const newConditions = [...g.conditions];
    newConditions.splice(position, 0, rule);
    return { ...g, conditions: newConditions };
  });
  return removeDuplicateConditionAny(inserted, ruleId, targetGroupId) as Filter;
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

  const result = updateGroupInTreeAny(filter, parentGroupId, (g) => ({
    ...g,
    conditions: [...g.conditions, newGroup],
  }));

  if (result === filter) {
    throw new Error(`Parent group not found: ${parentGroupId}`);
  }
  return result as Filter;
}

export function removeGroup(filter: Filter, groupId: string): Filter {
  if (filter.id === groupId) {
    throw new Error('Cannot remove root group');
  }
  return removeConditionFromTreeAny(filter, groupId) as Filter;
}

export function updateGroup(
  filter: Filter,
  groupId: string,
  updates: Partial<Pick<FilterGroup, 'combinator' | 'not'>>
): Filter {
  return updateGroupInTreeAny(filter, groupId, (g) => ({ ...g, ...updates })) as Filter;
}
```

**Key changes from original:**
- Removed all private helper functions (`updateGroupInTree`, `updateRuleInTree`, `removeConditionFromTree`, `findRuleInTree`, `findGroupInTree`, `removeDuplicateRule`) — replaced with shared primitives.
- `moveRule` cleaned up: removed dead `ruleCountInTarget > 1` branch, early-return for same-group moves (skips `removeDuplicateConditionAny`), explicit `targetGroup` not-found check before mutation.

**Step 3: Run tests to verify they pass**

Run: `pnpm test -- packages/core/src/__tests__/mutations.spec.ts`
Expected: PASS (36 tests)

**Step 4: Commit**

```bash
git add packages/core/src/mutations.ts
git commit -m "refactor: use shared tree-mutation primitives in mutations.ts"
```

---

### Task 4: Add edge-case tests for standard `moveRule` (same-group, currentIdx < position)

**Files:**
- Modify: `packages/core/src/__tests__/mutations.spec.ts`

**Step 1: Write the failing test**

Add inside the `describe('moveRule', ...)` block in `packages/core/src/__tests__/mutations.spec.ts`, before the closing `});`:

```typescript
  it('moves rule forward within same group (currentIdx < position)', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
        { id: 'r2', field: 'b', operator: 'eq', value: 2 },
        { id: 'r3', field: 'c', operator: 'eq', value: 3 },
      ],
    };
    // Move r1 (index 0) to position 2 (after removal, this means index 2 in the 2-element array)
    const result = moveRule(filter, 'r1', 'root', 2);
    expect(result.conditions[0]).toMatchObject({ id: 'r2' });
    expect(result.conditions[1]).toMatchObject({ id: 'r3' });
    expect(result.conditions[2]).toMatchObject({ id: 'r1' });
  });

  it('moves rule backward within same group (currentIdx > position)', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
        { id: 'r2', field: 'b', operator: 'eq', value: 2 },
        { id: 'r3', field: 'c', operator: 'eq', value: 3 },
      ],
    };
    // Move r3 (index 2) to position 0
    const result = moveRule(filter, 'r3', 'root', 0);
    expect(result.conditions[0]).toMatchObject({ id: 'r3' });
    expect(result.conditions[1]).toMatchObject({ id: 'r1' });
    expect(result.conditions[2]).toMatchObject({ id: 'r2' });
  });

  it('moves rule to same position (no-op within same group)', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
        { id: 'r2', field: 'b', operator: 'eq', value: 2 },
      ],
    };
    const result = moveRule(filter, 'r1', 'root', 0);
    expect(result.conditions[0]).toMatchObject({ id: 'r1' });
    expect(result.conditions[1]).toMatchObject({ id: 'r2' });
  });

  it('cross-group move does not leave duplicate in source', () => {
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
          conditions: [],
        },
      ],
    };
    const result = moveRule(filter, 'r1', 'g2', 0);
    const g1 = result.conditions[0] as Filter;
    const g2 = result.conditions[1] as Filter;
    expect(g1.conditions).toHaveLength(1);
    expect(g1.conditions[0]).toMatchObject({ id: 'r2' });
    expect(g2.conditions).toHaveLength(1);
    expect(g2.conditions[0]).toMatchObject({ id: 'r1' });
    // Verify no duplicate r1 anywhere in the tree
    const r1Count = JSON.stringify(result).split('"id":"r1"').length - 1;
    expect(r1Count).toBe(1);
  });
```

**Step 2: Run tests to verify they pass**

Run: `pnpm test -- packages/core/src/__tests__/mutations.spec.ts`
Expected: PASS (40 tests — 36 original + 4 new)

If any fail, the `moveRule` cleanup in Task 3 has a bug — fix it before proceeding.

**Step 3: Commit**

```bash
git add packages/core/src/__tests__/mutations.spec.ts
git commit -m "test: add moveRule edge-case tests (same-group forward/backward, cross-group no-duplicate)"
```

---

### Task 5: Implement `updateRuleIC`

**Files:**
- Modify: `packages/core/src/ic.ts`
- Modify: `packages/core/src/__tests__/ic.spec.ts`

**Step 1: Write the failing test**

Add to the end of `packages/core/src/__tests__/ic.spec.ts`:

```typescript
import { updateRuleIC } from '../ic';

describe('updateRuleIC', () => {
  it('updates a rule field in IC mode', () => {
    const ic: FilterIC = {
      id: 'root',
      conditions: [
        { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
        'and',
        { id: 'r2', field: 'age', operator: 'gt', value: 18 },
      ],
    };
    const result = updateRuleIC(ic, 'r2', { value: 21 });
    expect(result.conditions[1]).toBe('and');
    expect(result.conditions[2]).toMatchObject({ id: 'r2', value: 21 });
  });

  it('updates a rule inside nested IC group', () => {
    const ic: FilterIC = {
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
    const result = updateRuleIC(ic, 'r1', { value: 99 });
    const g1 = result.conditions[0] as FilterIC;
    expect(g1.conditions[0]).toMatchObject({ id: 'r1', value: 99 });
    expect(g1.conditions[1]).toBe('or');
  });

  it('preserves not flag when updating', () => {
    const ic: FilterIC = {
      id: 'root',
      conditions: [{ id: 'r1', field: 'a', operator: 'eq', value: 1, not: true }],
    };
    const result = updateRuleIC(ic, 'r1', { value: 99 });
    expect(result.conditions[0]).toMatchObject({ id: 'r1', value: 99, not: true });
  });

  it('returns unchanged when ruleId not found', () => {
    const ic: FilterIC = {
      id: 'root',
      conditions: [{ id: 'r1', field: 'a', operator: 'eq', value: 1 }],
    };
    const result = updateRuleIC(ic, 'nope', { value: 99 });
    expect(result).toBe(ic);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- packages/core/src/__tests__/ic.spec.ts`
Expected: FAIL — "updateRuleIC is not exported from '../ic'"

**Step 3: Implement `updateRuleIC`**

Add to `packages/core/src/ic.ts` (after the existing `removeRuleIC` function):

```typescript
import { updateRuleInTreeAny } from './tree-mutations';

export function updateRuleIC(
  filter: FilterIC,
  ruleId: string,
  updates: Partial<Omit<FilterRule, 'id'>>
): FilterIC {
  return updateRuleInTreeAny(filter, ruleId, (r) => ({ ...r, ...updates })) as FilterIC;
}
```

Also add the import at the top of `ic.ts` (after the existing imports):

```typescript
import { updateRuleInTreeAny } from './tree-mutations';
```

And add `FilterRule` to the type import if not already there (it is already imported).

**Step 4: Run test to verify it passes**

Run: `pnpm test -- packages/core/src/__tests__/ic.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/core/src/ic.ts packages/core/src/__tests__/ic.spec.ts
git commit -m "feat: add updateRuleIC mutation"
```

---

### Task 6: Implement `updateGroupIC` (only `{ not }`)

**Files:**
- Modify: `packages/core/src/ic.ts`
- Modify: `packages/core/src/__tests__/ic.spec.ts`

**Step 1: Write the failing test**

Add to the end of `packages/core/src/__tests__/ic.spec.ts`:

```typescript
import { updateGroupIC } from '../ic';

describe('updateGroupIC', () => {
  it('toggles not on an IC group', () => {
    const ic: FilterIC = {
      id: 'root',
      conditions: [
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
        'and',
        { id: 'g1', conditions: [] },
      ],
    };
    const result = updateGroupIC(ic, 'g1', { not: true });
    expect(result.conditions[2]).toMatchObject({ id: 'g1', not: true });
    expect(result.conditions[1]).toBe('and');
  });

  it('toggles not on root IC group', () => {
    const ic: FilterIC = { id: 'root', conditions: [] };
    const result = updateGroupIC(ic, 'root', { not: true });
    expect(result).toMatchObject({ id: 'root', not: true });
  });

  it('toggles not from true to false', () => {
    const ic: FilterIC = {
      id: 'root',
      conditions: [
        { id: 'g1', conditions: [], not: true },
      ],
    };
    const result = updateGroupIC(ic, 'g1', { not: false });
    expect(result.conditions[0]).toMatchObject({ id: 'g1', not: false });
  });

  it('returns unchanged when groupId not found', () => {
    const ic: FilterIC = { id: 'root', conditions: [] };
    const result = updateGroupIC(ic, 'nope', { not: true });
    expect(result).toBe(ic);
  });

  it('does not accept combinator (IC groups have no combinator property)', () => {
    const ic: FilterIC = {
      id: 'root',
      conditions: [{ id: 'g1', conditions: [] }],
    };
    // @ts-expect-error — combinator is not a valid update for IC groups
    const result = updateGroupIC(ic, 'g1', { combinator: 'or' });
    // The function should ignore combinator even if passed (defensive)
    expect(result.conditions[0]).not.toHaveProperty('combinator');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- packages/core/src/__tests__/ic.spec.ts`
Expected: FAIL — "updateGroupIC is not exported"

**Step 3: Implement `updateGroupIC`**

Add to `packages/core/src/ic.ts`:

```typescript
import { updateGroupInTreeAny } from './tree-mutations';

export function updateGroupIC(
  filter: FilterIC,
  groupId: string,
  updates: Partial<Pick<FilterGroupIC, 'not'>>
): FilterIC {
  return updateGroupInTreeAny(filter, groupId, (g) => ({ ...g, ...updates })) as FilterIC;
}
```

Add `updateGroupInTreeAny` to the import from `tree-mutations`:

```typescript
import { updateGroupInTreeAny, updateRuleInTreeAny } from './tree-mutations';
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- packages/core/src/__tests__/ic.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/core/src/ic.ts packages/core/src/__tests__/ic.spec.ts
git commit -m "feat: add updateGroupIC mutation (not-only, no combinator)"
```

---

### Task 7: Implement `addGroupIC` and `removeGroupIC`

**Files:**
- Modify: `packages/core/src/ic.ts`
- Modify: `packages/core/src/__tests__/ic.spec.ts`

**Step 1: Write the failing test**

Add to the end of `packages/core/src/__tests__/ic.spec.ts`:

```typescript
import { addGroupIC, removeGroupIC } from '../ic';

describe('addGroupIC', () => {
  it('adds first group without combinator', () => {
    const ic: FilterIC = { id: 'root', conditions: [] };
    const result = addGroupIC(ic, 'root', { id: 'g1' });
    expect(result.conditions).toHaveLength(1);
    expect(result.conditions[0]).toMatchObject({ id: 'g1', conditions: [] });
    expect(result.conditions[0]).not.toHaveProperty('combinator');
  });

  it('adds second group with default combinator', () => {
    const ic: FilterIC = {
      id: 'root',
      conditions: [{ id: 'g1', conditions: [] }],
    };
    const result = addGroupIC(ic, 'root', { id: 'g2' });
    expect(result.conditions).toHaveLength(3);
    expect(result.conditions[0]).toMatchObject({ id: 'g1' });
    expect(result.conditions[1]).toBe('and');
    expect(result.conditions[2]).toMatchObject({ id: 'g2' });
  });

  it('adds second group with custom combinator', () => {
    const ic: FilterIC = {
      id: 'root',
      conditions: [{ id: 'g1', conditions: [] }],
    };
    const result = addGroupIC(ic, 'root', { id: 'g2' }, 'or');
    expect(result.conditions[1]).toBe('or');
  });

  it('adds group with not flag', () => {
    const ic: FilterIC = { id: 'root', conditions: [] };
    const result = addGroupIC(ic, 'root', { id: 'g1', not: true });
    expect(result.conditions[0]).toMatchObject({ id: 'g1', not: true });
  });

  it('adds group with initial conditions', () => {
    const ic: FilterIC = { id: 'root', conditions: [] };
    const result = addGroupIC(ic, 'root', {
      id: 'g1',
      conditions: [{ id: 'r1', field: 'a', operator: 'eq', value: 1 }],
    });
    const g1 = result.conditions[0] as FilterIC;
    expect(g1.conditions).toHaveLength(1);
  });

  it('throws when parentGroupId not found', () => {
    const ic: FilterIC = { id: 'root', conditions: [] };
    expect(() => addGroupIC(ic, 'nope', { id: 'g1' })).toThrow('Parent group not found: nope');
  });

  it('uses custom idGenerator', () => {
    const ic: FilterIC = { id: 'root', conditions: [] };
    const result = addGroupIC(ic, 'root', {}, 'and', { idGenerator: () => 'custom-gid' });
    expect(result.conditions[0]).toMatchObject({ id: 'custom-gid' });
  });
});

describe('removeGroupIC', () => {
  it('removes first group (and following combinator)', () => {
    const ic: FilterIC = {
      id: 'root',
      conditions: [
        { id: 'g1', conditions: [] },
        'and',
        { id: 'g2', conditions: [] },
      ],
    };
    const result = removeGroupIC(ic, 'g1');
    expect(result.conditions).toHaveLength(1);
    expect(result.conditions[0]).toMatchObject({ id: 'g2' });
  });

  it('removes last group (and preceding combinator)', () => {
    const ic: FilterIC = {
      id: 'root',
      conditions: [
        { id: 'g1', conditions: [] },
        'and',
        { id: 'g2', conditions: [] },
      ],
    };
    const result = removeGroupIC(ic, 'g2');
    expect(result.conditions).toHaveLength(1);
    expect(result.conditions[0]).toMatchObject({ id: 'g1' });
  });

  it('removes only group (no combinator to remove)', () => {
    const ic: FilterIC = {
      id: 'root',
      conditions: [{ id: 'g1', conditions: [] }],
    };
    const result = removeGroupIC(ic, 'g1');
    expect(result.conditions).toHaveLength(0);
  });

  it('throws when trying to remove root group', () => {
    const ic: FilterIC = { id: 'root', conditions: [] };
    expect(() => removeGroupIC(ic, 'root')).toThrow('Cannot remove root group');
  });

  it('removes nested group', () => {
    const ic: FilterIC = {
      id: 'root',
      conditions: [
        {
          id: 'g1',
          conditions: [
            { id: 'r1', field: 'a', operator: 'eq', value: 1 },
            'and',
            { id: 'g2', conditions: [] },
          ],
        },
      ],
    };
    const result = removeGroupIC(ic, 'g2');
    const g1 = result.conditions[0] as FilterIC;
    expect(g1.conditions).toHaveLength(1);
    expect(g1.conditions[0]).toMatchObject({ id: 'r1' });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- packages/core/src/__tests__/ic.spec.ts`
Expected: FAIL — "addGroupIC/removeGroupIC is not exported"

**Step 3: Implement `addGroupIC` and `removeGroupIC`**

Add to `packages/core/src/ic.ts`:

```typescript
export function addGroupIC(
  filter: FilterIC,
  parentGroupId: string,
  group?: Partial<FilterGroupIC>,
  defaultCombinator: Combinator = 'and',
  options?: { idGenerator?: IdGenerator }
): FilterIC {
  const newGroup: FilterGroupIC = {
    id: group?.id ?? (options?.idGenerator ?? generateId)(),
    conditions: group?.conditions ?? [],
  };
  if (group?.not !== undefined) {
    newGroup.not = group.not;
  }

  const result = updateGroupInTreeAny(filter, parentGroupId, (g) => {
    const nonCombinatorCount = g.conditions.filter((c) => typeof c !== 'string').length;
    const newConditions: FilterGroupIC['conditions'] =
      nonCombinatorCount > 0 ? [...g.conditions, defaultCombinator, newGroup] : [newGroup];
    return { ...g, conditions: newConditions };
  });

  if (result === filter) {
    throw new Error(`Parent group not found: ${parentGroupId}`);
  }
  return result as FilterIC;
}

export function removeGroupIC(filter: FilterIC, groupId: string): FilterIC {
  if (filter.id === groupId) {
    throw new Error('Cannot remove root group');
  }
  return removeConditionICFromTree(filter, groupId);
}
```

Note: `removeGroupIC` reuses the existing `removeConditionICFromTree` which already handles combinator cleanup (same logic as `removeRuleIC`).

**Step 4: Run test to verify it passes**

Run: `pnpm test -- packages/core/src/__tests__/ic.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/core/src/ic.ts packages/core/src/__tests__/ic.spec.ts
git commit -m "feat: add addGroupIC and removeGroupIC mutations"
```

---

### Task 8: Implement `moveRuleIC`

**Files:**
- Modify: `packages/core/src/ic.ts`
- Modify: `packages/core/src/__tests__/ic.spec.ts`

**Step 1: Write the failing test**

Add to the end of `packages/core/src/__tests__/ic.spec.ts`:

```typescript
import { moveRuleIC } from '../ic';

// Helper: extract item ids from IC conditions (skips combinator strings)
function icItemIds(conditions: unknown[]): string[] {
  return conditions
    .filter((c) => typeof c !== 'string')
    .map((c) => (c as { id: string }).id);
}

describe('moveRuleIC', () => {
  it('moves rule to position 0 within same group (combinator goes after)', () => {
    const ic: FilterIC = {
      id: 'root',
      conditions: [
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
        'and',
        { id: 'r2', field: 'b', operator: 'eq', value: 2 },
        'or',
        { id: 'r3', field: 'c', operator: 'eq', value: 3 },
      ],
    };
    // Move r3 to item position 0
    const result = moveRuleIC(ic, 'r3', 'root', 0);
    expect(icItemIds(result.conditions)).toEqual(['r3', 'r1', 'r2']);
    // combinator after r3 should be defaultCombinator ('and')
    expect(result.conditions[1]).toBe('and');
    // original combinator between r1 and r2 should be preserved
    expect(result.conditions[3]).toBe('and');
  });

  it('moves rule forward within same group (currentItemIdx < position)', () => {
    const ic: FilterIC = {
      id: 'root',
      conditions: [
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
        'and',
        { id: 'r2', field: 'b', operator: 'eq', value: 2 },
        'or',
        { id: 'r3', field: 'c', operator: 'eq', value: 3 },
      ],
    };
    // Move r1 (item 0) to item position 2
    const result = moveRuleIC(ic, 'r1', 'root', 2);
    expect(icItemIds(result.conditions)).toEqual(['r2', 'r3', 'r1']);
  });

  it('moves rule backward within same group (currentItemIdx > position)', () => {
    const ic: FilterIC = {
      id: 'root',
      conditions: [
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
        'and',
        { id: 'r2', field: 'b', operator: 'eq', value: 2 },
        'or',
        { id: 'r3', field: 'c', operator: 'eq', value: 3 },
      ],
    };
    // Move r3 (item 2) to item position 0
    const result = moveRuleIC(ic, 'r3', 'root', 0);
    expect(icItemIds(result.conditions)).toEqual(['r3', 'r1', 'r2']);
  });

  it('moves rule between different groups', () => {
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
        'and',
        {
          id: 'g2',
          conditions: [{ id: 'r3', field: 'c', operator: 'eq', value: 3 }],
        },
      ],
    };
    // Move r1 from g1 to g2 at item position 1
    const result = moveRuleIC(ic, 'r1', 'g2', 1);
    const g1 = result.conditions[0] as FilterIC;
    const g2 = result.conditions[2] as FilterIC;
    expect(icItemIds(g1.conditions)).toEqual(['r2']);
    expect(icItemIds(g2.conditions)).toEqual(['r3', 'r1']);
  });

  it('moves rule to empty target group (no combinator needed)', () => {
    const ic: FilterIC = {
      id: 'root',
      conditions: [
        {
          id: 'g1',
          conditions: [{ id: 'r1', field: 'a', operator: 'eq', value: 1 }],
        },
        'and',
        {
          id: 'g2',
          conditions: [],
        },
      ],
    };
    const result = moveRuleIC(ic, 'r1', 'g2', 0);
    const g1 = result.conditions[0] as FilterIC;
    const g2 = result.conditions[2] as FilterIC;
    expect(icItemIds(g1.conditions)).toEqual([]);
    expect(icItemIds(g2.conditions)).toEqual(['r1']);
  });

  it('uses custom combinator when provided', () => {
    const ic: FilterIC = {
      id: 'root',
      conditions: [
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
        'and',
        { id: 'r2', field: 'b', operator: 'eq', value: 2 },
      ],
    };
    // Move r2 to item position 0 with custom combinator 'or'
    const result = moveRuleIC(ic, 'r2', 'root', 0, 'or');
    expect(result.conditions[0]).toMatchObject({ id: 'r2' });
    expect(result.conditions[1]).toBe('or');
    expect(result.conditions[2]).toMatchObject({ id: 'r1' });
  });

  it('throws when ruleId not found', () => {
    const ic: FilterIC = {
      id: 'root',
      conditions: [{ id: 'r1', field: 'a', operator: 'eq', value: 1 }],
    };
    expect(() => moveRuleIC(ic, 'nope', 'root', 0)).toThrow('Rule not found: nope');
  });

  it('throws when targetGroupId not found', () => {
    const ic: FilterIC = {
      id: 'root',
      conditions: [{ id: 'r1', field: 'a', operator: 'eq', value: 1 }],
    };
    expect(() => moveRuleIC(ic, 'r1', 'nope', 0)).toThrow('Target group not found: nope');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- packages/core/src/__tests__/ic.spec.ts`
Expected: FAIL — "moveRuleIC is not exported"

**Step 3: Implement `moveRuleIC`**

Add to `packages/core/src/ic.ts`:

```typescript
import { findGroupInTreeAny, findRuleInTreeAny, removeDuplicateConditionAny } from './tree-mutations';

/**
 * Move a rule to a new position within the tree.
 * `position` is an item index (counting only rules/groups, not combinators).
 * When inserting at position > 0, the combinator goes before the moved item.
 * When inserting at position 0, the combinator goes after the moved item.
 * The combinator value defaults to 'and' but can be overridden.
 */
export function moveRuleIC(
  filter: FilterIC,
  ruleId: string,
  targetGroupId: string,
  position: number,
  defaultCombinator: Combinator = 'and'
): FilterIC {
  const rule = findRuleInTreeAny(filter, ruleId);
  if (!rule) {
    throw new Error(`Rule not found: ${ruleId}`);
  }

  const targetGroup = findGroupInTreeAny(filter, targetGroupId);
  if (!targetGroup) {
    throw new Error(`Target group not found: ${targetGroupId}`);
  }

  // Check if rule is in the same group as target
  const isSameGroup = targetGroup.conditions.some(
    (c) => typeof c !== 'string' && 'id' in c && c.id === ruleId
  );

  if (isSameGroup) {
    // Same-group reorder
    const result = updateGroupInTreeAny(filter, targetGroupId, (g) => {
      const conditions = [...g.conditions];
      // Find the array index of the rule
      const currentArrayIdx = conditions.findIndex(
        (c) => typeof c !== 'string' && 'id' in c && c.id === ruleId
      );
      // Remove the rule and its associated combinator
      if (conditions.length === 1) {
        // Only item, just remove it
        conditions.splice(currentArrayIdx, 1);
      } else if (currentArrayIdx === 0) {
        // First item: remove item and following combinator
        conditions.splice(0, 2);
      } else {
        // Middle or last: remove preceding combinator and the item
        conditions.splice(currentArrayIdx - 1, 2);
      }

      // Now insert at the target item position
      // Convert item position to array index
      const nonCombinatorCount = conditions.filter((c) => typeof c !== 'string').length;
      if (nonCombinatorCount === 0) {
        // Group is now empty, just add the rule
        conditions.push(rule);
      } else if (position === 0) {
        // Insert at beginning: rule + combinator + existing
        conditions.unshift(rule, defaultCombinator);
      } else {
        // Insert at position > 0: find the array index for this item position
        // Item position N means after the Nth item, so we need to find the array index
        // of the Nth item and insert after it (combinator + rule)
        let itemIdx = 0;
        let arrayIdx = 0;
        for (let i = 0; i < conditions.length; i++) {
          if (typeof conditions[i] !== 'string') {
            if (itemIdx === position) {
              arrayIdx = i;
              break;
            }
            itemIdx++;
          }
          arrayIdx = i + 1;
        }
        conditions.splice(arrayIdx, 0, defaultCombinator, rule);
      }

      return { ...g, conditions };
    });
    return result as FilterIC;
  }

  // Cross-group move: insert into target, then remove from source
  const inserted = updateGroupInTreeAny(filter, targetGroupId, (g) => {
    const conditions = [...g.conditions];
    const nonCombinatorCount = conditions.filter((c) => typeof c !== 'string').length;
    if (nonCombinatorCount === 0) {
      // Empty target group, just add the rule
      conditions.push(rule);
    } else if (position === 0) {
      // Insert at beginning: rule + combinator + existing
      conditions.unshift(rule, defaultCombinator);
    } else {
      // Insert at position > 0
      let itemIdx = 0;
      let arrayIdx = 0;
      for (let i = 0; i < conditions.length; i++) {
        if (typeof conditions[i] !== 'string') {
          if (itemIdx === position) {
            arrayIdx = i;
            break;
          }
          itemIdx++;
        }
        arrayIdx = i + 1;
      }
      conditions.splice(arrayIdx, 0, defaultCombinator, rule);
    }
    return { ...g, conditions };
  });

  // Remove the rule from its original location (IC combinator cleanup)
  return removeDuplicateConditionIC(inserted, ruleId, targetGroupId);
}
```

Also add the `removeDuplicateConditionIC` helper. This is the IC-aware version that removes combinators when cleaning up:

```typescript
/**
 * Remove all occurrences of a condition by id, except the one inside keepInGroupId.
 * IC-aware: also removes the adjacent combinator when removing an item.
 */
function removeDuplicateConditionIC(
  root: FilterGroupIC,
  conditionId: string,
  keepInGroupId: string
): FilterGroupIC {
  // First use the generic remover to handle nested groups
  let changed = false;
  let keptInCurrentGroup = false;
  const newConditions: FilterGroupIC['conditions'] = [];

  for (let i = 0; i < root.conditions.length; i++) {
    const c = root.conditions[i];

    if (typeof c === 'string') {
      // Don't push combinator yet — we may need to skip it if the adjacent item is removed
      // We'll handle this by checking if the previous item was removed
      continue;
    }

    if (isFilterGroupIC(c)) {
      const updated = removeDuplicateConditionIC(c, conditionId, keepInGroupId);
      if (updated !== c) {
        changed = true;
      }
      // Push combinator before this item if we have items already
      if (newConditions.length > 0 && newConditions[newConditions.length - 1] !== undefined) {
        // Check if there was a combinator between this and the previous pushed item
        // We need to reconstruct — simpler approach below
      }
      newConditions.push(updated);
      continue;
    }

    if (!('id' in c) || c.id !== conditionId) {
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

  // The above approach loses combinators. Let's use a cleaner approach:
  // Rebuild with combinator management.
  return changed ? rebuildWithCombinators(root, newConditions) : root;
}
```

Wait — this is getting complex. Let me use a simpler, cleaner approach. Replace the `removeDuplicateConditionIC` with this implementation:

```typescript
/**
 * Remove all occurrences of a condition by id, except the one inside keepInGroupId.
 * IC-aware: also removes the adjacent combinator when removing an item.
 */
function removeDuplicateConditionIC(
  root: FilterGroupIC,
  conditionId: string,
  keepInGroupId: string
): FilterGroupIC {
  let changed = false;
  let keptInCurrentGroup = false;
  const keptItems: FilterGroupIC['conditions'] = [];

  for (const c of root.conditions) {
    if (typeof c === 'string') continue; // Skip combinators, we'll re-add them

    if (isFilterGroupIC(c)) {
      const updated = removeDuplicateConditionIC(c, conditionId, keepInGroupId);
      if (updated !== c) changed = true;
      // Re-add combinator if we have kept items already
      if (keptItems.length > 0) {
        // Find the original combinator that was between this item and the previous kept item
        // Since we're rebuilding, just use 'and' as default — but we should preserve original
        // Actually, we need to track which combinator was between items
      }
      keptItems.push(updated);
      continue;
    }

    if (!('id' in c) || c.id !== conditionId) {
      keptItems.push(c);
      continue;
    }

    if (root.id === keepInGroupId && !keptInCurrentGroup) {
      keptInCurrentGroup = true;
      keptItems.push(c);
      continue;
    }

    changed = true;
  }

  if (!changed) return root;

  // Rebuild conditions array with original combinators re-interleaved
  // We need to track which combinators were between which items
  // Simplest correct approach: re-interleave with 'and' and let the caller fix if needed
  // But that loses combinator info. Better: track original combinator positions.
  // For now, use the removeConditionICFromTree approach per-item.
  // Actually, the cleanest approach is to remove each duplicate one at a time using
  // the existing removeConditionICFromTree which handles combinator cleanup correctly.
  return root; // placeholder — see corrected version below
}
```

This is getting too complex inline. Let me simplify the whole approach. The cleanest way is to reuse `removeConditionICFromTree` (which already handles combinator cleanup) in a loop:

Replace the entire `removeDuplicateConditionIC` with this clean version:

```typescript
/**
 * Remove all occurrences of a condition by id from the tree, except the one
 * inside keepInGroupId. IC-aware: handles combinator cleanup.
 */
function removeDuplicateConditionIC(
  filter: FilterGroupIC,
  conditionId: string,
  keepInGroupId: string
): FilterGroupIC {
  // Find all groups that contain this condition (except keepInGroupId)
  const sourceGroupIds = findGroupsContainingCondition(filter, conditionId, keepInGroupId);

  let result = filter;
  for (const sourceGroupId of sourceGroupIds) {
    result = removeOneConditionICFromGroup(result, conditionId, sourceGroupId);
  }

  return result;
}

function findGroupsContainingCondition(
  root: FilterGroupIC,
  conditionId: string,
  excludeGroupId: string
): string[] {
  const found: string[] = [];

  function search(group: FilterGroupIC) {
    const hasCondition = group.conditions.some(
      (c) => typeof c !== 'string' && 'id' in c && c.id === conditionId
    );
    if (hasCondition && group.id !== excludeGroupId) {
      found.push(group.id);
    }
    for (const c of group.conditions) {
      if (typeof c !== 'string' && isFilterGroupIC(c)) {
        search(c);
      }
    }
  }

  search(root);
  return found;
}

function removeOneConditionICFromGroup(
  filter: FilterGroupIC,
  conditionId: string,
  groupId: string
): FilterGroupIC {
  return updateGroupInTreeAny(filter, groupId, (g) => {
    const idx = g.conditions.findIndex(
      (c) => typeof c !== 'string' && 'id' in c && c.id === conditionId
    );
    if (idx === -1) return g;

    const newConditions = [...g.conditions];
    if (newConditions.length === 1) {
      newConditions.splice(idx, 1);
    } else if (idx === 0) {
      newConditions.splice(0, 2);
    } else {
      newConditions.splice(idx - 1, 2);
    }
    return { ...g, conditions: newConditions };
  }) as FilterIC;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- packages/core/src/__tests__/ic.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/core/src/ic.ts packages/core/src/__tests__/ic.spec.ts
git commit -m "feat: add moveRuleIC mutation with item-index semantics"
```

---

### Task 9: Refactor existing `ic.ts` to use shared primitives for `addRuleIC`/`removeRuleIC`

**Files:**
- Modify: `packages/core/src/ic.ts`

**Step 1: Run existing IC tests to establish baseline**

Run: `pnpm test -- packages/core/src/__tests__/ic.spec.ts`
Expected: PASS — this is our safety net

**Step 2: Refactor `addRuleIC` and remove private helpers**

In `packages/core/src/ic.ts`, replace the private `updateGroupICInTree` function with the shared `updateGroupInTreeAny`. The `addRuleIC` function should change from:

```typescript
const result = updateGroupICInTree(filter, groupId, (g) => { ... });
```

to:

```typescript
const result = updateGroupInTreeAny(filter, groupId, (g) => { ... });
```

Remove the private `updateGroupICInTree` function entirely. Keep `removeConditionICFromTree` as-is (it has IC-specific combinator cleanup logic that the shared primitive doesn't handle).

The top of `ic.ts` should now import:

```typescript
import { generateId, type IdGenerator } from './id';
import type { Combinator, Filter, FilterGroup, FilterGroupIC, FilterIC, FilterRule } from './types';
import { isFilterGroup } from './types';
import { findGroupInTreeAny, findRuleInTreeAny, updateGroupInTreeAny } from './tree-mutations';
```

**Step 3: Run tests to verify they pass**

Run: `pnpm test -- packages/core/src/__tests__/ic.spec.ts`
Expected: PASS (all existing + new tests)

**Step 4: Commit**

```bash
git add packages/core/src/ic.ts
git commit -m "refactor: use shared primitives in ic.ts, remove duplicate updateGroupICInTree"
```

---

### Task 10: Export all new IC functions from `index.ts`

**Files:**
- Modify: `packages/core/src/index.ts`

**Step 1: Update exports**

In `packages/core/src/index.ts`, change the IC export line from:

```typescript
export { addRuleIC, convertFromIC, convertToIC, isFilterGroupIC, removeRuleIC } from './ic';
```

to:

```typescript
export {
  addGroupIC,
  addRuleIC,
  convertFromIC,
  convertToIC,
  isFilterGroupIC,
  moveRuleIC,
  removeGroupIC,
  removeRuleIC,
  updateGroupIC,
  updateRuleIC,
} from './ic';
```

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Run full test suite**

Run: `pnpm test -- packages/core`
Expected: PASS

**Step 4: Commit**

```bash
git add packages/core/src/index.ts
git commit -m "feat: export all IC mutation functions from core index"
```

---

### Task 11: Create `MutationAdapter` interface and implementations

**Files:**
- Create: `packages/core/src/mutation-adapter.ts`
- Create: `packages/core/src/__tests__/mutation-adapter.spec.ts`

**Step 1: Write the failing test**

Create `packages/core/src/__tests__/mutation-adapter.spec.ts`:

```typescript
import { createFilter } from '../create';
import { standardMutationAdapter, icMutationAdapter } from '../mutation-adapter';
import { convertToIC } from '../ic';
import type { Filter, FilterIC, FilterRule } from '../types';

// Helper: extract item ids from conditions (works for both modes)
function itemIds(conditions: unknown[]): string[] {
  return conditions
    .filter((c) => typeof c !== 'string')
    .map((c) => (c as { id: string }).id);
}

const makeStandardFilter = (): Filter => ({
  id: 'root',
  combinator: 'and',
  conditions: [
    { id: 'r1', field: 'a', operator: 'eq', value: 1 },
    { id: 'r2', field: 'b', operator: 'eq', value: 2 },
  ],
});

const makeICFilter = (): FilterIC => convertToIC(makeStandardFilter());

describe('MutationAdapter contract: addRule', () => {
  it('standard: adds rule to group', () => {
    const filter = makeStandardFilter();
    const result = standardMutationAdapter.addRule(filter, 'root', {
      id: 'r3',
      field: 'c',
      operator: 'eq',
      value: 3,
    });
    expect(itemIds(result.conditions)).toEqual(['r1', 'r2', 'r3']);
  });

  it('IC: adds rule to group', () => {
    const filter = makeICFilter();
    const result = icMutationAdapter.addRule(filter, 'root', {
      id: 'r3',
      field: 'c',
      operator: 'eq',
      value: 3,
    });
    expect(itemIds(result.conditions)).toEqual(['r1', 'r2', 'r3']);
  });
});

describe('MutationAdapter contract: updateRule', () => {
  it('standard: updates rule value', () => {
    const filter = makeStandardFilter();
    const result = standardMutationAdapter.updateRule(filter, 'r1', { value: 99 });
    expect(result.conditions[0]).toMatchObject({ id: 'r1', value: 99 });
  });

  it('IC: updates rule value', () => {
    const filter = makeICFilter();
    const result = icMutationAdapter.updateRule(filter, 'r1', { value: 99 });
    expect(result.conditions[0]).toMatchObject({ id: 'r1', value: 99 });
  });
});

describe('MutationAdapter contract: removeRule', () => {
  it('standard: removes rule', () => {
    const filter = makeStandardFilter();
    const result = standardMutationAdapter.removeRule(filter, 'r1');
    expect(itemIds(result.conditions)).toEqual(['r2']);
  });

  it('IC: removes rule', () => {
    const filter = makeICFilter();
    const result = icMutationAdapter.removeRule(filter, 'r1');
    expect(itemIds(result.conditions)).toEqual(['r2']);
  });
});

describe('MutationAdapter contract: moveRule', () => {
  it('standard: moves rule to position 0', () => {
    const filter = makeStandardFilter();
    const result = standardMutationAdapter.moveRule(filter, 'r2', 'root', 0);
    expect(itemIds(result.conditions)).toEqual(['r2', 'r1']);
  });

  it('IC: moves rule to position 0', () => {
    const filter = makeICFilter();
    const result = icMutationAdapter.moveRule(filter, 'r2', 'root', 0);
    expect(itemIds(result.conditions)).toEqual(['r2', 'r1']);
  });
});

describe('MutationAdapter contract: addGroup', () => {
  it('standard: adds group', () => {
    const filter = makeStandardFilter();
    const result = standardMutationAdapter.addGroup(filter, 'root', { id: 'g1' });
    expect(itemIds(result.conditions)).toEqual(['r1', 'r2', 'g1']);
  });

  it('IC: adds group', () => {
    const filter = makeICFilter();
    const result = icMutationAdapter.addGroup(filter, 'root', { id: 'g1' });
    expect(itemIds(result.conditions)).toEqual(['r1', 'r2', 'g1']);
  });
});

describe('MutationAdapter contract: removeGroup', () => {
  it('standard: removes group', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [
        { id: 'g1', combinator: 'or', conditions: [] },
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
      ],
    };
    const result = standardMutationAdapter.removeGroup(filter, 'g1');
    expect(itemIds(result.conditions)).toEqual(['r1']);
  });

  it('IC: removes group', () => {
    const filter: FilterIC = {
      id: 'root',
      conditions: [
        { id: 'g1', conditions: [] },
        'and',
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
      ],
    };
    const result = icMutationAdapter.removeGroup(filter, 'g1');
    expect(itemIds(result.conditions)).toEqual(['r1']);
  });
});

describe('MutationAdapter contract: negateRule', () => {
  it('standard: negates rule', () => {
    const filter = makeStandardFilter();
    const result = standardMutationAdapter.negateRule(filter, 'r1');
    expect(result.conditions[0]).toMatchObject({ id: 'r1', not: true });
  });

  it('IC: negates rule', () => {
    const filter = makeICFilter();
    const result = icMutationAdapter.negateRule(filter, 'r1');
    expect(result.conditions[0]).toMatchObject({ id: 'r1', not: true });
  });
});

describe('MutationAdapter contract: negateGroup', () => {
  it('standard: negates group', () => {
    const filter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [{ id: 'g1', combinator: 'or', conditions: [] }],
    };
    const result = standardMutationAdapter.negateGroup(filter, 'g1');
    expect(result.conditions[0]).toMatchObject({ id: 'g1', not: true });
  });

  it('IC: negates group', () => {
    const filter: FilterIC = {
      id: 'root',
      conditions: [{ id: 'g1', conditions: [] }],
    };
    const result = icMutationAdapter.negateGroup(filter, 'g1');
    expect(result.conditions[0]).toMatchObject({ id: 'g1', not: true });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- packages/core/src/__tests__/mutation-adapter.spec.ts`
Expected: FAIL — "Cannot find module '../mutation-adapter'"

**Step 3: Implement `mutation-adapter.ts`**

Create `packages/core/src/mutation-adapter.ts`:

```typescript
import type { FilterAny, FilterGroup, FilterGroupIC, FilterRule } from './types';
import {
  addGroup as coreAddGroup,
  addRule as coreAddRule,
  moveRule as coreMoveRule,
  removeGroup as coreRemoveGroup,
  removeRule as coreRemoveRule,
  updateGroup as coreUpdateGroup,
  updateRule as coreUpdateRule,
} from './mutations';
import { negateGroup as coreNegateGroup, negateRule as coreNegateRule } from './negate';
import {
  addGroupIC,
  addRuleIC,
  moveRuleIC,
  removeGroupIC,
  removeRuleIC,
  updateGroupIC,
  updateRuleIC,
} from './ic';

/**
 * Abstract mutation interface that normalizes parameter differences between
 * standard and IC modes. Contract tests run the same logical scenarios
 * against both implementations.
 */
export interface MutationAdapter<TFilter extends FilterAny = FilterAny> {
  addRule(
    filter: TFilter,
    groupId: string,
    rule: Partial<FilterRule>
  ): TFilter;
  updateRule(
    filter: TFilter,
    ruleId: string,
    updates: Partial<Omit<FilterRule, 'id'>>
  ): TFilter;
  removeRule(filter: TFilter, ruleId: string): TFilter;
  moveRule(
    filter: TFilter,
    ruleId: string,
    targetGroupId: string,
    position: number
  ): TFilter;
  addGroup(
    filter: TFilter,
    parentGroupId: string,
    group?: Partial<FilterGroup>
  ): TFilter;
  removeGroup(filter: TFilter, groupId: string): TFilter;
  negateRule(filter: TFilter, ruleId: string): TFilter;
  negateGroup(filter: TFilter, groupId: string): TFilter;
}

export const standardMutationAdapter: MutationAdapter<FilterGroup> = {
  addRule: (filter, groupId, rule) => coreAddRule(filter, groupId, rule),
  updateRule: (filter, ruleId, updates) => coreUpdateRule(filter, ruleId, updates),
  removeRule: (filter, ruleId) => coreRemoveRule(filter, ruleId),
  moveRule: (filter, ruleId, targetGroupId, position) =>
    coreMoveRule(filter, ruleId, targetGroupId, position),
  addGroup: (filter, parentGroupId, group) => coreAddGroup(filter, parentGroupId, group),
  removeGroup: (filter, groupId) => coreRemoveGroup(filter, groupId),
  negateRule: (filter, ruleId) => coreNegateRule(filter, ruleId),
  negateGroup: (filter, groupId) => coreNegateGroup(filter, groupId),
};

export const icMutationAdapter: MutationAdapter<FilterGroupIC> = {
  addRule: (filter, groupId, rule) => addRuleIC(filter, groupId, rule),
  updateRule: (filter, ruleId, updates) => updateRuleIC(filter, ruleId, updates),
  removeRule: (filter, ruleId) => removeRuleIC(filter, ruleId),
  moveRule: (filter, ruleId, targetGroupId, position) =>
    moveRuleIC(filter, ruleId, targetGroupId, position),
  addGroup: (filter, parentGroupId, group) => addGroupIC(filter, parentGroupId, group),
  removeGroup: (filter, groupId) => removeGroupIC(filter, groupId),
  negateRule: (filter, ruleId) => coreNegateRule(filter, ruleId),
  negateGroup: (filter, groupId) => coreNegateGroup(filter, groupId),
};
```

Note: `updateGroup` is intentionally excluded from the adapter interface because the two modes have fundamentally different semantics for it (standard accepts `combinator`, IC does not). Including it would require the interface to accept a union type that hides mode-specific behavior.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- packages/core/src/__tests__/mutation-adapter.spec.ts`
Expected: PASS

**Step 5: Export from index.ts**

Add to `packages/core/src/index.ts`:

```typescript
export type { MutationAdapter } from './mutation-adapter';
export { icMutationAdapter, standardMutationAdapter } from './mutation-adapter';
```

**Step 6: Run typecheck and full test suite**

Run: `pnpm typecheck && pnpm test -- packages/core`
Expected: PASS

**Step 7: Commit**

```bash
git add packages/core/src/mutation-adapter.ts packages/core/src/__tests__/mutation-adapter.spec.ts packages/core/src/index.ts
git commit -m "feat: add MutationAdapter interface with standard and IC implementations"
```

---

### Task 12: Run full test suite, typecheck, and lint

**Files:** None (verification only)

**Step 1: Run full test suite**

Run: `pnpm test`
Expected: PASS (all packages)

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Run lint**

Run: `pnpm check`
Expected: PASS (fix any issues with `pnpm format` if needed)

**Step 4: Commit any lint fixes if needed**

```bash
git add -A
git commit -m "chore: lint and format fixes"
```

---

### Task 13: Final verification — verify no regressions in react/antd/shadcn packages

**Files:** None (verification only)

**Step 1: Run all tests including react/antd/shadcn**

Run: `pnpm test`
Expected: PASS — all packages green, no regressions from the negate.ts FilterAny generalization or mutations.ts refactor

**Step 2: Verify the adapter contract tests still pass for antd and shadcn**

Run: `pnpm test -- packages/antd packages/shadcn`
Expected: PASS — the existing `runFilterBuilderAdapterContract` tests should still work since we didn't change the React `useFilterBuilder` hook

**Step 3: Final commit if anything was missed**

If all passes, no commit needed. The implementation is complete.
