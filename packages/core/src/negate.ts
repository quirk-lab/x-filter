import { updateGroupInTreeAny, updateRuleInTreeAny } from './tree-mutations';
import type { Filter, FilterAny, FilterIC } from './types';

export function negateRule(filter: Filter, ruleId: string): Filter;
export function negateRule(filter: FilterIC, ruleId: string): FilterIC;
export function negateRule(filter: FilterAny, ruleId: string): FilterAny {
  return updateRuleInTreeAny(filter, ruleId, (r) => ({
    ...r,
    not: !r.not,
  }));
}

export function negateGroup(filter: Filter, groupId: string): Filter;
export function negateGroup(filter: FilterIC, groupId: string): FilterIC;
export function negateGroup(filter: FilterAny, groupId: string): FilterAny {
  return updateGroupInTreeAny(filter, groupId, (g) => ({
    ...g,
    not: !g.not,
  }));
}
