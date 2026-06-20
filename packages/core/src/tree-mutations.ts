import type { FilterGroup, FilterGroupIC, FilterRule } from './types';
import { isFilterRule } from './types';

type AnyGroup = FilterGroup | FilterGroupIC;

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
export function removeConditionFromTreeAny(root: AnyGroup, conditionId: string): AnyGroup {
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
 * Note: In IC mode, this does NOT handle combinator cleanup — use the IC-specific
 * removeDuplicateConditionIC for that.
 */
export function removeDuplicateConditionAny(
  root: AnyGroup,
  conditionId: string,
  keepInGroupId: string
): AnyGroup {
  let changed = false;
  let keptInCurrentGroup = false;
  type MixedItem = FilterRule | FilterGroup | FilterGroupIC | string;
  const newConditions: MixedItem[] = [];

  for (const c of root.conditions as MixedItem[]) {
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
