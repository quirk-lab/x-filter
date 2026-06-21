import { generateId, type IdGenerator } from './id';
import { findById } from './traverse';
import { mapTree, updateById } from './tree-map';
import type { Combinator, Filter, FilterGroup, FilterGroupIC, FilterIC, FilterRule } from './types';
import { isFilterGroup, isFilterRule } from './types';

export function isFilterGroupIC(node: unknown): node is FilterGroupIC {
  return (
    typeof node === 'object' &&
    node !== null &&
    'id' in node &&
    'children' in node &&
    !('combinator' in node)
  );
}

export function convertToIC(filter: Filter): FilterIC {
  return convertGroupToIC(filter);
}

function convertGroupToIC(group: FilterGroup): FilterGroupIC {
  const children: FilterGroupIC['children'] = [];

  for (let i = 0; i < group.children.length; i++) {
    if (i > 0) {
      children.push(group.combinator);
    }
    const c = group.children[i];
    if (isFilterGroup(c)) {
      children.push(convertGroupToIC(c as FilterGroup));
    } else {
      children.push(c as FilterRule);
    }
  }

  const result: FilterGroupIC = { id: group.id, children };
  if (group.not) result.not = true;
  return result;
}

export function convertFromIC(filter: FilterIC): Filter {
  return convertGroupFromIC(filter);
}

function convertGroupFromIC(group: FilterGroupIC): FilterGroup {
  const { children } = group;

  if (children.length === 0) {
    const result: FilterGroup = { id: group.id, combinator: 'and', children: [] };
    if (group.not) result.not = true;
    return result;
  }

  const items: (FilterRule | FilterGroupIC)[] = [];
  const combinators: Combinator[] = [];

  for (const c of children) {
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
      children: items.map((item) =>
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

  const convertedChildren: (FilterRule | FilterGroup)[] = segments.map((seg) => {
    if (seg.length === 1) {
      const item = seg[0];
      return isFilterGroupIC(item) ? convertGroupFromIC(item) : (item as FilterRule);
    }
    return {
      id: generateId(),
      combinator: 'and' as Combinator,
      children: seg.map((item) =>
        isFilterGroupIC(item) ? convertGroupFromIC(item) : (item as FilterRule)
      ),
    };
  });

  const result: FilterGroup = {
    id: group.id,
    combinator: 'or',
    children: convertedChildren,
  };
  if (group.not) result.not = true;
  return result;
}

// --- IC-specific mutations ---
//
// IC mutations build on the shared tree-walker primitives (mapTree / updateById /
// findById, see ADR 0001). The IC-specific concern is combinator cleanup: combinators
// are inline tokens in the children array, so removing an item must also drop an
// adjacent combinator, and inserting one must place a combinator alongside it.

/**
 * Remove a single child (rule or group) from an IC group by id, dropping the
 * adjacent combinator. Returns the same ref when the id is not in this group.
 */
function removeChildICFromGroup(group: FilterGroupIC, childId: string): FilterGroupIC {
  const idx = group.children.findIndex(
    (c) => typeof c !== 'string' && 'id' in c && c.id === childId
  );
  if (idx === -1) return group;
  return { ...group, children: removeItemAtArrayIdx(group.children, idx) };
}

function removeChildICFromTree(root: FilterGroupIC, childId: string): FilterGroupIC {
  return mapTree(root, {
    onGroup: (g) => removeChildICFromGroup(g as FilterGroupIC, childId),
  }) as FilterGroupIC;
}

/**
 * Insert a rule into an IC children array at a given item position.
 * - position 0: rule goes first, combinator after it
 * - position > 0: combinator before rule, inserted after the (position-1)th item
 */
function insertRuleIC(
  children: FilterGroupIC['children'],
  rule: FilterRule,
  position: number,
  defaultCombinator: Combinator
): FilterGroupIC['children'] {
  const result = [...children];
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
 * Remove the item at `idx` from an IC children array, including the adjacent combinator.
 */
function removeItemAtArrayIdx(
  children: FilterGroupIC['children'],
  idx: number
): FilterGroupIC['children'] {
  const result = [...children];
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
 * Find all groups that contain a child with the given id, excluding excludeGroupId.
 */
function findGroupsContainingChild(
  root: FilterGroupIC,
  childId: string,
  excludeGroupId: string
): string[] {
  const found: string[] = [];

  function search(group: FilterGroupIC) {
    const hasChild = group.children.some(
      (c) => typeof c !== 'string' && 'id' in c && c.id === childId
    );
    if (hasChild && group.id !== excludeGroupId) {
      found.push(group.id);
    }
    for (const c of group.children) {
      if (typeof c !== 'string' && isFilterGroupIC(c)) {
        search(c);
      }
    }
  }

  search(root);
  return found;
}

/**
 * Remove a single occurrence of a child from a specific group (IC combinator cleanup).
 */
function removeOneChildICFromGroup(
  filter: FilterGroupIC,
  childId: string,
  groupId: string
): FilterGroupIC {
  return updateById(filter, groupId, (node) => {
    const g = node as FilterGroupIC;
    const idx = g.children.findIndex((c) => typeof c !== 'string' && 'id' in c && c.id === childId);
    if (idx === -1) return g;
    return { ...g, children: removeItemAtArrayIdx(g.children, idx) };
  }) as FilterGroupIC;
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

  const result = updateById(filter, groupId, (node) => {
    const group = node as FilterGroupIC;
    const nonCombinatorCount = group.children.filter((c) => typeof c !== 'string').length;
    const newChildren: FilterGroupIC['children'] =
      nonCombinatorCount > 0 ? [...group.children, defaultCombinator, newRule] : [newRule];
    return { ...group, children: newChildren };
  }) as FilterIC;

  if (result === filter) {
    throw new Error(`Group not found: ${groupId}`);
  }
  return result;
}

export function removeRuleIC(filter: FilterIC, ruleId: string): FilterIC {
  return removeChildICFromTree(filter, ruleId);
}

export function updateRuleIC(
  filter: FilterIC,
  ruleId: string,
  updates: Partial<Omit<FilterRule, 'id'>>
): FilterIC {
  return updateById(filter, ruleId, (r) => ({
    ...(r as FilterRule),
    ...updates,
  })) as FilterIC;
}

export function updateGroupIC(
  filter: FilterIC,
  groupId: string,
  updates: Partial<Pick<FilterGroupIC, 'not'>>
): FilterIC {
  return updateById(filter, groupId, (g) => ({
    ...(g as FilterGroupIC),
    ...updates,
  })) as FilterIC;
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
    children: group?.children ?? [],
  };
  if (group?.not !== undefined) {
    newGroup.not = group.not;
  }

  const result = updateById(filter, parentGroupId, (node) => {
    const g = node as FilterGroupIC;
    const nonCombinatorCount = g.children.filter((c) => typeof c !== 'string').length;
    const newChildren: FilterGroupIC['children'] =
      nonCombinatorCount > 0 ? [...g.children, defaultCombinator, newGroup] : [newGroup];
    return { ...g, children: newChildren };
  }) as FilterIC;

  if (result === filter) {
    throw new Error(`Parent group not found: ${parentGroupId}`);
  }
  return result;
}

export function removeGroupIC(filter: FilterIC, groupId: string): FilterIC {
  if (filter.id === groupId) {
    throw new Error('Cannot remove root group');
  }
  return removeChildICFromTree(filter, groupId);
}

/**
 * Move a rule to a new position within the IC tree.
 * `position` is an item index (counting only rules/groups, not combinators), so it
 * shares semantics with the standard `moveRule`. When inserting at position > 0 the
 * combinator goes before the moved item; at position 0 the combinator goes after it.
 */
export function moveRuleIC(
  filter: FilterIC,
  ruleId: string,
  targetGroupId: string,
  position: number,
  defaultCombinator: Combinator = 'and'
): FilterIC {
  const foundRule = findById(filter, ruleId);
  const rule = foundRule && isFilterRule(foundRule) ? (foundRule as FilterRule) : undefined;
  if (!rule) {
    throw new Error(`Rule not found: ${ruleId}`);
  }

  const foundGroup = findById(filter, targetGroupId);
  const targetGroup =
    foundGroup && isFilterGroupIC(foundGroup) ? (foundGroup as FilterGroupIC) : undefined;
  if (!targetGroup) {
    throw new Error(`Target group not found: ${targetGroupId}`);
  }

  // Check if rule is in the same group as target
  const isSameGroup = targetGroup.children.some(
    (c) => typeof c !== 'string' && 'id' in c && c.id === ruleId
  );

  if (isSameGroup) {
    // Same-group reorder: remove then insert at position
    const result = updateById(filter, targetGroupId, (node) => {
      const g = node as FilterGroupIC;
      const children = [...g.children];
      const currentArrayIdx = children.findIndex(
        (c) => typeof c !== 'string' && 'id' in c && c.id === ruleId
      );
      const afterRemoval = removeItemAtArrayIdx(children, currentArrayIdx);
      return { ...g, children: insertRuleIC(afterRemoval, rule, position, defaultCombinator) };
    });
    return result as FilterIC;
  }

  // Cross-group move: insert into target, then remove from source(s)
  const inserted = updateById(filter, targetGroupId, (node) => {
    const g = node as FilterGroupIC;
    return { ...g, children: insertRuleIC([...g.children], rule, position, defaultCombinator) };
  }) as FilterIC;

  const sourceGroupIds = findGroupsContainingChild(inserted, ruleId, targetGroupId);
  let result = inserted;
  for (const sourceGroupId of sourceGroupIds) {
    result = removeOneChildICFromGroup(result, ruleId, sourceGroupId);
  }
  return result;
}

/**
 * Set the inline combinator at a given combinator position within an IC group.
 *
 * `comboIndex` counts only combinator tokens (the separators between items), so
 * combinator `i` sits between item `i` and item `i + 1`. Returns the same ref
 * when the group is missing, the position is out of range, or the value is
 * unchanged (structural sharing keeps untouched subtrees stable).
 */
export function setCombinatorIC(
  filter: FilterIC,
  groupId: string,
  comboIndex: number,
  combinator: Combinator
): FilterIC {
  return updateById(filter, groupId, (node) => {
    const group = node as FilterGroupIC;
    // Combinator tokens live at odd array indices: 1, 3, 5, ...
    const arrayIdx = comboIndex * 2 + 1;
    const current = group.children[arrayIdx];
    if (typeof current !== 'string' || current === combinator) {
      return group;
    }
    const children = [...group.children];
    children[arrayIdx] = combinator;
    return { ...group, children };
  }) as FilterIC;
}
