import { isFilterGroupIC } from './ic';
import { generateId } from './id';
import type {
  Combinator,
  Filter,
  FilterAny,
  FilterGroup,
  FilterGroupIC,
  FilterIC,
  FilterRule,
} from './types';
import { isFilterGroup } from './types';

export function toJSON(filter: FilterAny): Record<string, unknown> {
  if (isFilterGroupIC(filter)) {
    return groupICToJSON(filter);
  }
  return groupToJSON(filter as FilterGroup);
}

function groupToJSON(group: FilterGroup): Record<string, unknown> {
  if (group.conditions.length === 0 && group.combinator === 'and' && !group.not) {
    return {};
  }

  const result: Record<string, unknown> = {
    combinator: group.combinator,
  };
  if (group.not) result.not = true;

  result.conditions = group.conditions.map((c) => {
    if (isFilterGroup(c)) {
      return groupToJSON(c as FilterGroup);
    }
    return ruleToJSON(c as FilterRule);
  });

  return result;
}

function groupICToJSON(group: FilterGroupIC): Record<string, unknown> {
  if (group.conditions.length === 0 && !group.not) {
    return { ic: true };
  }

  const result: Record<string, unknown> = { ic: true };
  if (group.not) result.not = true;

  result.conditions = group.conditions.map((c) => {
    if (typeof c === 'string') return c;
    if (isFilterGroupIC(c)) {
      return groupICToJSON(c);
    }
    return ruleToJSON(c as FilterRule);
  });

  return result;
}

function ruleToJSON(rule: FilterRule): Record<string, unknown> {
  const result: Record<string, unknown> = {
    field: rule.field,
    operator: rule.operator,
    value: rule.value,
  };
  if (rule.not) result.not = true;
  return result;
}

export function fromJSON(json: Record<string, unknown>): FilterAny {
  if ('ic' in json) {
    return groupICFromJSON(json);
  }
  return groupFromJSON(json);
}

function groupFromJSON(json: Record<string, unknown>): Filter {
  if (Object.keys(json).length === 0) {
    return { id: generateId(), combinator: 'and', conditions: [] };
  }

  const result: FilterGroup = {
    id: generateId(),
    combinator: (json.combinator as Combinator) ?? 'and',
    conditions: [],
  };
  if (json.not) result.not = true;

  const conditions = json.conditions as unknown[] | undefined;
  if (Array.isArray(conditions)) {
    result.conditions = conditions.map((c) => {
      const item = c as Record<string, unknown>;
      if ('conditions' in item || 'combinator' in item) {
        return groupFromJSON(item);
      }
      return ruleFromJSON(item);
    });
  }

  return result;
}

function groupICFromJSON(json: Record<string, unknown>): FilterIC {
  const result: FilterGroupIC = {
    id: generateId(),
    conditions: [],
  };
  if (json.not) result.not = true;

  const conditions = json.conditions as unknown[] | undefined;
  if (Array.isArray(conditions)) {
    result.conditions = conditions.map((c) => {
      if (typeof c === 'string') return c as Combinator;
      const item = c as Record<string, unknown>;
      if ('ic' in item || ('conditions' in item && !('field' in item))) {
        return groupICFromJSON(item);
      }
      return ruleFromJSON(item);
    });
  }

  return result;
}

function ruleFromJSON(json: Record<string, unknown>): FilterRule {
  const rule: FilterRule = {
    id: generateId(),
    field: (json.field as string) ?? '',
    operator: (json.operator as string) ?? '',
    value: json.value ?? null,
  };
  if (json.not) rule.not = true;
  return rule;
}
