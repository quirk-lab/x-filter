import { generateId, type IdGenerator } from './id';
import {
  findGroupInTreeAny,
  findRuleInTreeAny,
  updateGroupInTreeAny,
  updateRuleInTreeAny,
} from './tree-mutations';
import type { Combinator, Filter, FilterGroup, FilterGroupIC, FilterIC, FilterRule } from './types';
import { isFilterGroup } from './types';

export function isFilterGroupIC(node: unknown): node is FilterGroupIC {
  return (
    typeof node === 'object' &&
    node !== null &&
    'id' in node &&
    'conditions' in node &&
    !('combinator' in node)
  );
}

export function convertToIC(filter: Filter): FilterIC {
  return convertGroupToIC(filter);
}

function convertGroupToIC(group: FilterGroup): FilterGroupIC {
  const conditions: FilterGroupIC['conditions'] = [];

  for (let i = 0; i < group.conditions.length; i++) {
    if (i > 0) {
      conditions.push(group.combinator);
    }
    const c = group.conditions[i];
    if (isFilterGroup(c)) {
      conditions.push(convertGroupToIC(c as FilterGroup));
    } else {
      conditions.push(c as FilterRule);
    }
  }

  const result: FilterGroupIC = { id: group.id, conditions };
  if (group.not) result.not = true;
  return result;
}

export function convertFromIC(filter: FilterIC): Filter {
  return convertGroupFromIC(filter);
}

function convertGroupFromIC(group: FilterGroupIC): FilterGroup {
  const { conditions } = group;

  if (conditions.length === 0) {
    const result: FilterGroup = { id: group.id, combinator: 'and', conditions: [] };
    if (group.not) result.not = true;
    return result;
  }

  const items: (FilterRule | FilterGroupIC)[] = [];
  const combinators: Combinator[] = [];

  for (const c of conditions) {
    if (typeof c === 'string') {
      combinators.push(c);
    } else {
      items.push(c);
    }
  }

  if (combinators.length === 0 || combinators.every((c) => c === combinators[0])) {
    const combinator = combinators[0] ?? 'and';
    const result: FilterGroup = {
      id: group.id,
      combinator,
      conditions: items.map((item) =>
        isFilterGroupIC(item) ? convertGroupFromIC(item) : (item as FilterRule)
      ),
    };
    if (group.not) result.not = true;
    return result;
  }

  // Mixed combinators: split by 'or' (lower precedence), group 'and' segments
  const segments: (FilterRule | FilterGroupIC)[][] = [[]];
  for (let i = 0; i < items.length; i++) {
    segments[segments.length - 1].push(items[i]);
    if (i < combinators.length && combinators[i] === 'or') {
      segments.push([]);
    }
  }

  const convertedConditions: (FilterRule | FilterGroup)[] = segments.map((seg) => {
    if (seg.length === 1) {
      const item = seg[0];
      return isFilterGroupIC(item) ? convertGroupFromIC(item) : (item as FilterRule);
    }
    return {
      id: generateId(),
      combinator: 'and' as Combinator,
      conditions: seg.map((item) =>
        isFilterGroupIC(item) ? convertGroupFromIC(item) : (item as FilterRule)
      ),
    };
  });

  const result: FilterGroup = {
    id: group.id,
    combinator: 'or',
    conditions: convertedConditions,
  };
  if (group.not) result.not = true;
  return result;
}

// --- IC-specific mutations ---

/**
 * Remove a condition (rule or group) from an IC tree, including the adjacent combinator.
 * This is IC-specific because combinators are inline tokens that must be cleaned up.
 */
function removeConditionICFromTree(root: FilterGroupIC, conditionId: string): FilterGroupIC {
  const idx = root.conditions.findIndex(
    (c) => typeof c !== 'string' && 'id' in c && c.id === conditionId
  );

  if (idx !== -1) {
    const newConditions = [...root.conditions];
    if (newConditions.length === 1) {
      // Only item, just remove it
      newConditions.splice(idx, 1);
    } else if (idx === 0) {
      // First item: remove item and following combinator
      newConditions.splice(0, 2);
    } else {
      // Middle or last item: remove preceding combinator and the item
      newConditions.splice(idx - 1, 2);
    }
    return { ...root, conditions: newConditions };
  }

  let changed = false;
  const newConditions = root.conditions.map((c) => {
    if (typeof c !== 'string' && isFilterGroupIC(c)) {
      const updated = removeConditionICFromTree(c, conditionId);
      if (updated !== c) {
        changed = true;
        return updated;
      }
    }
    return c;
  });

  return changed ? { ...root, conditions: newConditions } : root;
}

export function addRuleIC(
  filter: FilterIC,
  groupId: string,
  rule: Partial<FilterRule>,
  defaultCombinator: Combinator = 'and',
  options?: { idGenerator?: IdGenerator }
): FilterIC {
  const newRule: FilterRule = {
    id: rule.id ?? (options?.idGenerator ?? generateId)(),
    field: rule.field ?? '',
    operator: rule.operator ?? '',
    value: rule.value ?? null,
  };
  if (rule.not !== undefined) {
    newRule.not = rule.not;
  }

  const result = updateGroupInTreeAny(filter, groupId, (g) => {
    const nonCombinatorCount = g.conditions.filter((c) => typeof c !== 'string').length;
    const newConditions: FilterGroupIC['conditions'] =
      nonCombinatorCount > 0 ? [...g.conditions, defaultCombinator, newRule] : [newRule];
    return { ...g, conditions: newConditions };
  });

  if (result === filter) {
    throw new Error(`Group not found: ${groupId}`);
  }
  return result as FilterIC;
}

export function removeRuleIC(filter: FilterIC, ruleId: string): FilterIC {
  return removeConditionICFromTree(filter, ruleId);
}

export function updateRuleIC(
  filter: FilterIC,
  ruleId: string,
  updates: Partial<Omit<FilterRule, 'id'>>
): FilterIC {
  return updateRuleInTreeAny(filter, ruleId, (r) => ({ ...r, ...updates })) as FilterIC;
}

export function updateGroupIC(
  filter: FilterIC,
  groupId: string,
  updates: Partial<Pick<FilterGroupIC, 'not'>>
): FilterIC {
  return updateGroupInTreeAny(filter, groupId, (g) => ({ ...g, ...updates })) as FilterIC;
}

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

/**
 * Insert a rule into an IC conditions array at a given item position.
 * - position 0: rule goes first, combinator after it
 * - position > 0: combinator before rule, inserted after the (position-1)th item
 */
function insertRuleIC(
  conditions: FilterGroupIC['conditions'],
  rule: FilterRule,
  position: number,
  defaultCombinator: Combinator
): FilterGroupIC['conditions'] {
  const result = [...conditions];
  const nonCombinatorCount = result.filter((c) => typeof c !== 'string').length;

  if (nonCombinatorCount === 0) {
    // Empty group, just add the rule
    result.push(rule);
    return result;
  }

  if (position === 0) {
    // Insert at beginning: rule + combinator + existing
    result.unshift(rule, defaultCombinator);
    return result;
  }

  // Insert at position > 0: find the array index after the (position-1)th item
  let itemIdx = 0;
  let arrayIdx = 0;
  for (let i = 0; i < result.length; i++) {
    if (typeof result[i] !== 'string') {
      itemIdx++;
      if (itemIdx === position) {
        arrayIdx = i + 1;
        break;
      }
    }
    arrayIdx = i + 1;
  }
  result.splice(arrayIdx, 0, defaultCombinator, rule);
  return result;
}

/**
 * Remove a rule from an IC conditions array at a given array index,
 * including the adjacent combinator.
 */
function removeItemAtArrayIdx(
  conditions: FilterGroupIC['conditions'],
  idx: number
): FilterGroupIC['conditions'] {
  const result = [...conditions];
  if (result.length === 1) {
    result.splice(idx, 1);
  } else if (idx === 0) {
    result.splice(0, 2);
  } else {
    result.splice(idx - 1, 2);
  }
  return result;
}

/**
 * Find all groups that contain a condition with the given id, excluding keepInGroupId.
 */
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

/**
 * Remove a single occurrence of a condition from a specific group (IC-aware combinator cleanup).
 */
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
    return { ...g, conditions: removeItemAtArrayIdx(g.conditions, idx) };
  }) as FilterIC;
}

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
    // Same-group reorder: remove then insert at position
    const result = updateGroupInTreeAny(filter, targetGroupId, (g) => {
      const conditions = [...g.conditions];
      const currentArrayIdx = conditions.findIndex(
        (c) => typeof c !== 'string' && 'id' in c && c.id === ruleId
      );
      // Remove the rule and its associated combinator
      const afterRemoval = removeItemAtArrayIdx(conditions, currentArrayIdx);
      // Insert at the target item position
      return { ...g, conditions: insertRuleIC(afterRemoval, rule, position, defaultCombinator) };
    });
    return result as FilterIC;
  }

  // Cross-group move: insert into target, then remove from source
  const inserted = updateGroupInTreeAny(filter, targetGroupId, (g) => {
    return { ...g, conditions: insertRuleIC([...g.conditions], rule, position, defaultCombinator) };
  });

  // Remove the rule from its original location (IC combinator cleanup)
  const sourceGroupIds = findGroupsContainingCondition(inserted, ruleId, targetGroupId);
  let result = inserted;
  for (const sourceGroupId of sourceGroupIds) {
    result = removeOneConditionICFromGroup(result, ruleId, sourceGroupId);
  }
  return result;
}
