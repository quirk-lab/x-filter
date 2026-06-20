import { generateId, type IdGenerator } from './id';
import { findById, findParent } from './traverse';
import { mapTree, updateById } from './tree-map';
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
  return updateById(filter, ruleId, (r) => ({
    ...(r as FilterRule),
    ...updates,
  })) as Filter;
}

export function removeRule(filter: Filter, ruleId: string): Filter {
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
  return removeChild(filter, groupId);
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
