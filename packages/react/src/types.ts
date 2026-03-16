import type { FieldSchema, Filter, FilterGroup, FilterRule } from '@x-filter/core';

export interface UseFilterBuilderOptions {
  value?: Filter;
  defaultValue?: Filter;
  onChange?: (filter: Filter) => void;
  schema: FieldSchema[];
}

export interface UseFilterBuilderReturn {
  filter: Filter;
  setFilter: (filter: Filter | ((prev: Filter) => Filter)) => void;
  addRule: (groupId: string, rule?: Partial<FilterRule>) => void;
  removeRule: (ruleId: string) => void;
  updateRule: (ruleId: string, updates: Partial<Omit<FilterRule, 'id'>>) => void;
  addGroup: (parentGroupId: string, group?: Partial<FilterGroup>) => void;
  removeGroup: (groupId: string) => void;
  updateGroup: (groupId: string, updates: Partial<Pick<FilterGroup, 'combinator' | 'not'>>) => void;
  moveRule: (ruleId: string, targetGroupId: string, position: number) => void;
  schema: FieldSchema[];
}

export interface UseFilterDslOptions {
  filter: Filter;
  schema: FieldSchema[];
  onCommit: (filter: Filter) => void;
}

export interface UseFilterDslReturn {
  draftDSL: string;
  setDraftDSL: (dsl: string) => void;
  parseError: string | null;
  commitDSL: () => boolean;
  resetDraft: () => void;
}

export interface UseFilterUrlSyncOptions {
  mode?: 'dsl' | 'json';
  paramName?: string;
  schema?: FieldSchema[];
  getSearchParams?: () => URLSearchParams;
  setSearchParams?: (params: URLSearchParams) => void;
}

export interface UseFilterUrlSyncReturn {
  getFilterFromUrl: () => Filter | null;
  setFilterToUrl: (filter: Filter) => void;
  error: string | null;
}

export type MoveOperation = {
  type: 'rule' | 'group';
  id: string;
  targetGroupId: string;
  targetIndex: number;
};

export interface UseReorderContractOptions {
  filter: Filter;
  onReorder: (filter: Filter) => void;
}

export interface UseReorderContractReturn {
  moveItem: (op: MoveOperation) => void;
  canDrop: (dragId: string, targetGroupId: string) => boolean;
}
