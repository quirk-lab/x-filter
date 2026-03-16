import type { Filter, FilterGroup, FilterRule } from './types';
import type { IdGenerator } from './id';
import { isFilterGroup } from './types';
import { generateId } from './id';

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

function removeConditionFromTree(root: FilterGroup, conditionId: string): FilterGroup {
  const idx = root.conditions.findIndex(
    (c) => typeof c === 'object' && 'id' in c && c.id === conditionId
  );

  if (idx !== -1) {
    return {
      ...root,
      conditions: root.conditions.filter((_, i) => i !== idx),
    };
  }

  let changed = false;
  const newConditions = root.conditions.map((c) => {
    if (isFilterGroup(c)) {
      const updated = removeConditionFromTree(c, conditionId);
      if (updated !== c) {
        changed = true;
        return updated;
      }
    }
    return c;
  });

  return changed ? { ...root, conditions: newConditions } : root;
}

function findRuleInTree(root: FilterGroup, ruleId: string): FilterRule | undefined {
  for (const c of root.conditions) {
    if (isFilterGroup(c)) {
      const found = findRuleInTree(c, ruleId);
      if (found) return found;
    } else if (c.id === ruleId) {
      return c;
    }
  }
  return undefined;
}

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

  const result = updateGroupInTree(filter, groupId, (g) => ({
    ...g,
    conditions: [...g.conditions, newRule],
  }));

  if (result === filter) {
    throw new Error(`Group not found: ${groupId}`);
  }
  return result;
}

export function updateRule(
  filter: Filter,
  ruleId: string,
  updates: Partial<Omit<FilterRule, 'id'>>
): Filter {
  return updateRuleInTree(filter, ruleId, (r) => ({ ...r, ...updates }));
}

export function removeRule(filter: Filter, ruleId: string): Filter {
  return removeConditionFromTree(filter, ruleId);
}

export function moveRule(
  filter: Filter,
  ruleId: string,
  targetGroupId: string,
  position: number
): Filter {
  const rule = findRuleInTree(filter, ruleId);
  if (!rule) {
    throw new Error(`Rule not found: ${ruleId}`);
  }

  // Same-group move
  const result = updateGroupInTree(filter, targetGroupId, (g) => {
    const currentIdx = g.conditions.findIndex(
      (c) => typeof c === 'object' && 'id' in c && c.id === ruleId
    );

    if (currentIdx !== -1) {
      const newConditions = [...g.conditions];
      newConditions.splice(currentIdx, 1);
      newConditions.splice(position, 0, rule);
      return { ...g, conditions: newConditions };
    }

    // Cross-group: the rule is not in this group, just insert at position
    const newConditions = [...g.conditions];
    newConditions.splice(position, 0, rule);
    return { ...g, conditions: newConditions };
  });

  if (result === filter) {
    throw new Error(`Target group not found: ${targetGroupId}`);
  }

  // For cross-group moves, also remove from the source group
  const targetGroup = findGroupInTree(result, targetGroupId);
  const ruleCountInTarget = targetGroup
    ? targetGroup.conditions.filter(
        (c) => typeof c === 'object' && 'id' in c && c.id === ruleId
      ).length
    : 0;

  if (ruleCountInTarget > 1) {
    // Rule appears twice (inserted + original was already there in same group)
    // This shouldn't happen since same-group case is handled above
    return result;
  }

  // Remove the rule from its original location (if cross-group)
  return removeDuplicateRule(result, ruleId, targetGroupId);
}

function findGroupInTree(root: FilterGroup, groupId: string): FilterGroup | undefined {
  if (root.id === groupId) return root;
  for (const c of root.conditions) {
    if (isFilterGroup(c)) {
      const found = findGroupInTree(c, groupId);
      if (found) return found;
    }
  }
  return undefined;
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

  const result = updateGroupInTree(filter, parentGroupId, (g) => ({
    ...g,
    conditions: [...g.conditions, newGroup],
  }));

  if (result === filter) {
    throw new Error(`Parent group not found: ${parentGroupId}`);
  }
  return result;
}

export function removeGroup(filter: Filter, groupId: string): Filter {
  if (filter.id === groupId) {
    throw new Error('Cannot remove root group');
  }
  return removeConditionFromTree(filter, groupId);
}

export function updateGroup(
  filter: Filter,
  groupId: string,
  updates: Partial<Pick<FilterGroup, 'combinator' | 'not'>>
): Filter {
  return updateGroupInTree(filter, groupId, (g) => ({ ...g, ...updates }));
}
