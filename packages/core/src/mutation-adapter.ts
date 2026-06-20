import { addGroupIC, addRuleIC, moveRuleIC, removeGroupIC, removeRuleIC, updateRuleIC } from './ic';
import {
  addGroup as coreAddGroup,
  addRule as coreAddRule,
  moveRule as coreMoveRule,
  removeGroup as coreRemoveGroup,
  removeRule as coreRemoveRule,
  updateRule as coreUpdateRule,
} from './mutations';
import { negateGroup as coreNegateGroup, negateRule as coreNegateRule } from './negate';
import type { FilterAny, FilterGroup, FilterGroupIC, FilterRule } from './types';

/**
 * Maps a filter type to its corresponding group type.
 * `FilterGroup` → `FilterGroup`, `FilterGroupIC` → `FilterGroupIC`.
 * This ensures `addGroup` accepts the correct group shape per mode
 * (e.g. IC groups reject `combinator` at compile time).
 */
type GroupOf<T extends FilterAny> = T extends FilterGroup ? FilterGroup : FilterGroupIC;

/**
 * Abstract mutation interface that normalizes parameter differences between
 * standard and IC modes. Contract tests run the same logical scenarios
 * (asserted via item-id lists, not raw array structure) against both
 * implementations.
 *
 * Note: `updateGroup` is intentionally excluded because the two modes have
 * fundamentally different semantics for it (standard accepts `combinator`,
 * IC does not). Including it would require a union type that hides
 * mode-specific behavior.
 */
export interface MutationAdapter<TFilter extends FilterAny = FilterAny> {
  addRule(filter: TFilter, groupId: string, rule: Partial<FilterRule>): TFilter;
  updateRule(filter: TFilter, ruleId: string, updates: Partial<Omit<FilterRule, 'id'>>): TFilter;
  removeRule(filter: TFilter, ruleId: string): TFilter;
  moveRule(filter: TFilter, ruleId: string, targetGroupId: string, position: number): TFilter;
  addGroup(filter: TFilter, parentGroupId: string, group?: Partial<GroupOf<TFilter>>): TFilter;
  removeGroup(filter: TFilter, groupId: string): TFilter;
  negateRule(filter: TFilter, ruleId: string): TFilter;
  negateGroup(filter: TFilter, groupId: string): TFilter;
}

export const standardMutationAdapter: MutationAdapter<FilterGroup> = {
  addRule: (filter, groupId, rule) => coreAddRule(filter, groupId, rule),
  updateRule: (filter, ruleId, updates) => coreUpdateRule(filter, ruleId, updates),
  removeRule: (filter, ruleId) => coreRemoveRule(filter, ruleId),
  moveRule: (filter, ruleId, targetGroupId, position) =>
    coreMoveRule(filter, ruleId, targetGroupId, position),
  addGroup: (filter, parentGroupId, group) => coreAddGroup(filter, parentGroupId, group),
  removeGroup: (filter, groupId) => coreRemoveGroup(filter, groupId),
  negateRule: (filter, ruleId) => coreNegateRule(filter, ruleId),
  negateGroup: (filter, groupId) => coreNegateGroup(filter, groupId),
};

export const icMutationAdapter: MutationAdapter<FilterGroupIC> = {
  addRule: (filter, groupId, rule) => addRuleIC(filter, groupId, rule),
  updateRule: (filter, ruleId, updates) => updateRuleIC(filter, ruleId, updates),
  removeRule: (filter, ruleId) => removeRuleIC(filter, ruleId),
  moveRule: (filter, ruleId, targetGroupId, position) =>
    moveRuleIC(filter, ruleId, targetGroupId, position),
  addGroup: (filter, parentGroupId, group) => addGroupIC(filter, parentGroupId, group),
  removeGroup: (filter, groupId) => removeGroupIC(filter, groupId),
  negateRule: (filter, ruleId) => coreNegateRule(filter, ruleId),
  negateGroup: (filter, groupId) => coreNegateGroup(filter, groupId),
};
