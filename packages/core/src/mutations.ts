import { deepCloneWithNewIds } from './clone';
import { generateId, type IdGenerator } from './id';
import { findById, findParent } from './traverse';
import { mapTree, updateById } from './tree-map';
import type { Filter, FilterAny, FilterGroup, FilterGroupIC, FilterIC, FilterRule } from './types';
import { isFilterGroup, isFilterRule, isLocked } from './types';

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

  // A locked group rejects new children.
  if (isLocked(findById(filter, groupId))) {
    return filter;
  }

  const result = updateById(filter, groupId, (node) => {
    const g = node as FilterGroup;
    return { ...g, children: [...g.children, newRule] };
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
  if (isLocked(findById(filter, ruleId))) {
    return filter;
  }
  return updateById(filter, ruleId, (r) => ({
    ...(r as FilterRule),
    ...updates,
  })) as Filter;
}

export function removeRule(filter: Filter, ruleId: string): Filter {
  // Block when the rule itself or its containing group is locked.
  if (isLocked(findById(filter, ruleId)) || isLocked(findParent(filter, ruleId))) {
    return filter;
  }
  return removeChild(filter, ruleId);
}

function removeChild(filter: Filter, childId: string): Filter {
  const result = mapTree(filter, {
    onGroup: (g) => {
      const idx = g.children.findIndex(
        (c) => typeof c !== 'string' && 'id' in c && c.id === childId
      );
      if (idx === -1) return g;
      return {
        ...g,
        children: g.children.filter((_, i) => i !== idx),
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
  const rule = findById(filter, ruleId) as FilterRule | undefined;
  if (!rule) {
    throw new Error(`Rule not found: ${ruleId}`);
  }

  const sourceParent = findParent(filter, ruleId) as FilterGroup | undefined;

  // Block moving a locked rule, out of a locked source, or into a locked target.
  if (isLocked(rule) || isLocked(sourceParent) || isLocked(findById(filter, targetGroupId))) {
    return filter;
  }

  const isSameGroup = sourceParent?.id === targetGroupId;

  let targetFound = false;

  const result = mapTree(filter, {
    onGroup: (g) => {
      const group = g as FilterGroup;

      if (g.id === targetGroupId) {
        targetFound = true;
        if (isSameGroup) {
          // Same-group: remove then insert at post-removal position
          const newChildren = [...group.children];
          const currentIdx = newChildren.findIndex(
            (c) => typeof c !== 'string' && 'id' in c && c.id === ruleId
          );
          if (currentIdx !== -1) {
            newChildren.splice(currentIdx, 1);
          }
          newChildren.splice(position, 0, rule);
          return { ...group, children: newChildren };
        }
        // Cross-group: insert at position (rule not yet here)
        const newChildren = [...group.children];
        newChildren.splice(position, 0, rule);
        return { ...group, children: newChildren };
      }

      // Non-target group: remove the rule if present (source group cleanup)
      if (!isSameGroup && sourceParent && g.id === sourceParent.id) {
        const idx = group.children.findIndex(
          (c) => typeof c !== 'string' && 'id' in c && c.id === ruleId
        );
        if (idx !== -1) {
          return {
            ...group,
            children: group.children.filter((_, i) => i !== idx),
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

export function addGroup(
  filter: Filter,
  parentGroupId: string,
  group?: Partial<FilterGroup>,
  options?: MutationOptions
): Filter {
  const newGroup: FilterGroup = {
    id: group?.id ?? (options?.idGenerator ?? generateId)(),
    combinator: group?.combinator ?? 'and',
    children: group?.children ?? [],
  };
  if (group?.not !== undefined) {
    newGroup.not = group.not;
  }

  // A locked parent group rejects new children.
  if (isLocked(findById(filter, parentGroupId))) {
    return filter;
  }

  const result = updateById(filter, parentGroupId, (node) => {
    const g = node as FilterGroup;
    return { ...g, children: [...g.children, newGroup] };
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
  // Block when the group itself or its containing group is locked.
  if (isLocked(findById(filter, groupId)) || isLocked(findParent(filter, groupId))) {
    return filter;
  }
  return removeChild(filter, groupId);
}

export function updateGroup(
  filter: Filter,
  groupId: string,
  updates: Partial<Pick<FilterGroup, 'combinator' | 'not'>>
): Filter {
  if (isLocked(findById(filter, groupId))) {
    return filter;
  }
  return updateById(filter, groupId, (node) => {
    const g = node as FilterGroup;
    return { ...g, ...updates };
  }) as Filter;
}

/** Inserts `clone` immediately after the node identified by `sourceId`. */
function insertAfter(
  filter: Filter,
  parentId: string,
  sourceId: string,
  clone: FilterRule | FilterGroup
): Filter {
  return updateById(filter, parentId, (node) => {
    const g = node as FilterGroup;
    const idx = g.children.findIndex((c) => 'id' in c && c.id === sourceId);
    const children = [...g.children];
    children.splice(idx + 1, 0, clone);
    return { ...g, children };
  }) as Filter;
}

/**
 * Deep-copies the rule with `ruleId` (fresh id, deep-copied value) and inserts it
 * immediately after the source within its parent group. Throws if the id is
 * missing or points to a group.
 */
export function cloneRule(filter: Filter, ruleId: string, options?: MutationOptions): Filter {
  const source = findById(filter, ruleId);
  if (!source || isFilterGroup(source) || !isFilterRule(source)) {
    throw new Error(`Rule not found: ${ruleId}`);
  }
  const parent = findParent(filter, ruleId) as FilterGroup | undefined;
  if (!parent) {
    throw new Error(`Rule not found: ${ruleId}`);
  }
  const clone = deepCloneWithNewIds(source, options?.idGenerator) as FilterRule;
  // A clone of a locked rule is editable — locking is per-instance, not copied.
  if (clone.locked) clone.locked = false;
  return insertAfter(filter, parent.id, ruleId, clone);
}

/**
 * Recursively deep-copies the group with `groupId` (fresh ids for the group and
 * every descendant) and inserts it immediately after the source. Throws when
 * targeting the root or a missing/non-group id.
 */
export function cloneGroup(filter: Filter, groupId: string, options?: MutationOptions): Filter {
  if (filter.id === groupId) {
    throw new Error('Cannot clone root group');
  }
  const source = findById(filter, groupId);
  if (!source || !isFilterGroup(source)) {
    throw new Error(`Group not found: ${groupId}`);
  }
  const parent = findParent(filter, groupId) as FilterGroup | undefined;
  if (!parent) {
    throw new Error(`Group not found: ${groupId}`);
  }
  const clone = deepCloneWithNewIds(source, options?.idGenerator) as FilterGroup;
  // A clone of a locked group is editable at its root — locking is per-instance.
  if (clone.locked) clone.locked = false;
  return insertAfter(filter, parent.id, groupId, clone);
}

// negate works for both standard and IC trees: it only toggles the `not` flag on
// the node with the matching id, and updateById traverses FilterAny uniformly.
export function negateRule(filter: Filter, ruleId: string): Filter;
export function negateRule(filter: FilterIC, ruleId: string): FilterIC;
export function negateRule(filter: FilterAny, ruleId: string): FilterAny {
  if (isLocked(findById(filter, ruleId))) {
    return filter;
  }
  return updateById(filter, ruleId, (r) => {
    const rule = r as FilterRule;
    return { ...rule, not: !rule.not };
  }) as FilterAny;
}

export function negateGroup(filter: Filter, groupId: string): Filter;
export function negateGroup(filter: FilterIC, groupId: string): FilterIC;
export function negateGroup(filter: FilterAny, groupId: string): FilterAny {
  if (isLocked(findById(filter, groupId))) {
    return filter;
  }
  return updateById(filter, groupId, (g) => {
    const group = g as FilterGroup | FilterGroupIC;
    return { ...group, not: !group.not };
  }) as FilterAny;
}
