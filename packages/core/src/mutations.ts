import type { IdGenerator } from './id';
import { generateId } from './id';
import {
  findGroupInTreeAny,
  findRuleInTreeAny,
  removeConditionFromTreeAny,
  removeDuplicateConditionAny,
  updateGroupInTreeAny,
  updateRuleInTreeAny,
} from './tree-mutations';
import type { Filter, FilterGroup, FilterRule } from './types';

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
