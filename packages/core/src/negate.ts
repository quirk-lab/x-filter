import type { Filter, FilterGroup, FilterRule } from './types';
import { isFilterGroup } from './types';

function updateRuleInTree(
  root: FilterGroup,
  ruleId: string,
  updater: (rule: FilterRule) => FilterRule
): FilterGroup {
  let changed = false;
  const newConditions = root.conditions.map((c) => {
    if (isFilterGroup(c)) {
      const updated = updateRuleInTree(c, ruleId, updater);
      if (updated !== c) {
        changed = true;
        return updated;
      }
      return c;
    }
    if (c.id === ruleId) {
      changed = true;
      return updater(c);
    }
    return c;
  });

  return changed ? { ...root, conditions: newConditions } : root;
}

function updateGroupInTree(
  root: FilterGroup,
  targetId: string,
  updater: (group: FilterGroup) => FilterGroup
): FilterGroup {
  if (root.id === targetId) {
    return updater(root);
  }

  let changed = false;
  const newConditions = root.conditions.map((c) => {
    if (isFilterGroup(c)) {
      const updated = updateGroupInTree(c, targetId, updater);
      if (updated !== c) {
        changed = true;
        return updated;
      }
    }
    return c;
  });

  return changed ? { ...root, conditions: newConditions } : root;
}

export function negateRule(filter: Filter, ruleId: string): Filter {
  return updateRuleInTree(filter, ruleId, (r) => ({
    ...r,
    not: !r.not,
  }));
}

export function negateGroup(filter: Filter, groupId: string): Filter {
  return updateGroupInTree(filter, groupId, (g) => ({
    ...g,
    not: !g.not,
  }));
}
