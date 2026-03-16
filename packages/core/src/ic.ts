import { generateId, type IdGenerator } from './id';
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

function updateGroupICInTree(
  root: FilterGroupIC,
  targetId: string,
  updater: (group: FilterGroupIC) => FilterGroupIC
): FilterGroupIC {
  if (root.id === targetId) {
    return updater(root);
  }

  let changed = false;
  const newConditions = root.conditions.map((c) => {
    if (typeof c !== 'string' && isFilterGroupIC(c)) {
      const updated = updateGroupICInTree(c, targetId, updater);
      if (updated !== c) {
        changed = true;
        return updated;
      }
    }
    return c;
  });

  return changed ? { ...root, conditions: newConditions } : root;
}

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

  const result = updateGroupICInTree(filter, groupId, (g) => {
    const nonCombinatorCount = g.conditions.filter((c) => typeof c !== 'string').length;
    const newConditions: FilterGroupIC['conditions'] =
      nonCombinatorCount > 0 ? [...g.conditions, defaultCombinator, newRule] : [newRule];
    return { ...g, conditions: newConditions };
  });

  if (result === filter) {
    throw new Error(`Group not found: ${groupId}`);
  }
  return result;
}

export function removeRuleIC(filter: FilterIC, ruleId: string): FilterIC {
  return removeConditionICFromTree(filter, ruleId);
}
