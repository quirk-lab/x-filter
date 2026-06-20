import { generateId, type IdGenerator } from './id';
import type { Combinator, Filter, FilterGroup, FilterGroupIC, FilterIC, FilterRule } from './types';
import { isFilterGroup } from './types';

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

function updateGroupICInTree(
  root: FilterGroupIC,
  targetId: string,
  updater: (group: FilterGroupIC) => FilterGroupIC
): FilterGroupIC {
  if (root.id === targetId) {
    return updater(root);
  }

  let changed = false;
  const newChildren = root.children.map((c) => {
    if (typeof c !== 'string' && isFilterGroupIC(c)) {
      const updated = updateGroupICInTree(c, targetId, updater);
      if (updated !== c) {
        changed = true;
        return updated;
      }
    }
    return c;
  });

  return changed ? { ...root, children: newChildren } : root;
}

function removeChildICFromTree(root: FilterGroupIC, childId: string): FilterGroupIC {
  const idx = root.children.findIndex(
    (c) => typeof c !== 'string' && 'id' in c && c.id === childId
  );

  if (idx !== -1) {
    const newChildren = [...root.children];
    if (newChildren.length === 1) {
      // Only item, just remove it
      newChildren.splice(idx, 1);
    } else if (idx === 0) {
      // First item: remove item and following combinator
      newChildren.splice(0, 2);
    } else {
      // Middle or last item: remove preceding combinator and the item
      newChildren.splice(idx - 1, 2);
    }
    return { ...root, children: newChildren };
  }

  let changed = false;
  const newChildren = root.children.map((c) => {
    if (typeof c !== 'string' && isFilterGroupIC(c)) {
      const updated = removeChildICFromTree(c, childId);
      if (updated !== c) {
        changed = true;
        return updated;
      }
    }
    return c;
  });

  return changed ? { ...root, children: newChildren } : root;
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

  const result = updateGroupICInTree(filter, groupId, (g) => {
    const nonCombinatorCount = g.children.filter((c) => typeof c !== 'string').length;
    const newChildren: FilterGroupIC['children'] =
      nonCombinatorCount > 0 ? [...g.children, defaultCombinator, newRule] : [newRule];
    return { ...g, children: newChildren };
  });

  if (result === filter) {
    throw new Error(`Group not found: ${groupId}`);
  }
  return result;
}

export function removeRuleIC(filter: FilterIC, ruleId: string): FilterIC {
  return removeChildICFromTree(filter, ruleId);
}
