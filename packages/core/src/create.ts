import type { Combinator, Filter, FilterGroup, FilterRule } from './types';
import { generateId, type IdGenerator } from './id';

export interface CreateFilterOptions {
  combinator?: Combinator;
  idGenerator?: IdGenerator;
}

export function createFilter(options?: CreateFilterOptions): Filter {
  return {
    id: (options?.idGenerator ?? generateId)(),
    combinator: options?.combinator ?? 'and',
    conditions: [],
  };
}

export interface CreateRuleOptions {
  id?: string;
  field?: string;
  operator?: string;
  value?: unknown;
  not?: boolean;
  idGenerator?: IdGenerator;
}

export function createRule(options?: CreateRuleOptions): FilterRule {
  const rule: FilterRule = {
    id: options?.id ?? (options?.idGenerator ?? generateId)(),
    field: options?.field ?? '',
    operator: options?.operator ?? '',
    value: options?.value ?? null,
  };
  if (options?.not !== undefined) {
    rule.not = options.not;
  }
  return rule;
}

export interface CreateGroupOptions {
  id?: string;
  combinator?: Combinator;
  not?: boolean;
  idGenerator?: IdGenerator;
}

export function createGroup(options?: CreateGroupOptions): FilterGroup {
  const group: FilterGroup = {
    id: options?.id ?? (options?.idGenerator ?? generateId)(),
    combinator: options?.combinator ?? 'and',
    conditions: [],
  };
  if (options?.not !== undefined) {
    group.not = options.not;
  }
  return group;
}
