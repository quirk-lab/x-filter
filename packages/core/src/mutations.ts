import { generateId, type IdGenerator } from './id';
import { findById } from './traverse';
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
    ? targetGroup.conditions.filter((c) => typeof c !== 'string' && 'id' in c && c.id === ruleId)
        .length
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
