import type {
  CompletionItem,
  FieldSchema,
  Filter,
  FilterGroup,
  FilterRule,
  OperatorDef,
  ValidationError,
} from '@x-filter/core';
import type React from 'react';
import type { ReactNode } from 'react';

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

export interface UseDslEditorOptions {
  filter: Filter;
  schema: FieldSchema[];
  onCommit: (filter: Filter) => void;
  cursor?: number;
}

export interface UseDslEditorReturn {
  draftDSL: string;
  setDraftDSL: (dsl: string) => void;
  parseError: string | null;
  completions: CompletionItem[];
  commit: () => boolean;
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

export interface UseFilterViewModelOptions {
  filter: Filter;
  schema: FieldSchema[];
  errors?: Record<string, ValidationError[]>;
}

export interface UseFilterViewModelReturn {
  root: FilterGroupViewModel;
  schema: FieldSchema[];
}

export type MoveOperation = {
  type: 'rule' | 'group';
  id: string;
  targetGroupId: string;
  targetIndex: number;
};

export type FilterBuilderActionHandlers = {
  addRule: (groupId: string, rule?: Partial<FilterRule>) => void;
  removeRule: (ruleId: string) => void;
  updateRule: (ruleId: string, updates: Partial<Omit<FilterRule, 'id'>>) => void;
  addGroup: (groupId: string, group?: Partial<FilterGroup>) => void;
  removeGroup: (groupId: string) => void;
  updateGroup: (groupId: string, updates: Partial<Pick<FilterGroup, 'combinator' | 'not'>>) => void;
  moveItem: (operation: MoveOperation) => void;
  canDrop: (dragId: string, targetGroupId: string) => boolean;
};

export type FilterRuleViewModel = {
  kind: 'rule';
  id: string;
  rule: FilterRule;
  field?: FieldSchema;
  operator?: OperatorDef;
  errors: ValidationError[];
  aria: {
    label: string;
    describedBy?: string;
  };
};

export type FilterGroupViewModel = {
  kind: 'group';
  id: string;
  group: FilterGroup;
  depth: number;
  children: FilterNodeViewModel[];
  aria: {
    label: string;
    describedBy?: string;
  };
};

export type FilterNodeViewModel = FilterRuleViewModel | FilterGroupViewModel;

export type FilterBuilderLabels = Partial<{
  addRule: string;
  addGroup: string;
  removeRule: string;
  removeGroup: string;
  field: string;
  operator: string;
  value: string;
  combinator: string;
  not: string;
  dslInput: string;
}>;

export type FilterBuilderClassNames = Partial<{
  root: string;
  group: string;
  rule: string;
  fieldSelector: string;
  operatorSelector: string;
  valueEditor: string;
  actions: string;
  dslEditor: string;
  completionMenu: string;
}>;

export type FilterBuilderSlotProps = {
  filter: Filter;
  schema: FieldSchema[];
  actions: FilterBuilderActionHandlers;
};

export type FilterBuilderSlots = Partial<{
  Root: (props: FilterBuilderSlotProps & { children: ReactNode }) => ReactNode;
  Group: (
    props: FilterBuilderSlotProps & { group: FilterGroupViewModel; children: ReactNode }
  ) => ReactNode;
  Rule: (props: FilterBuilderSlotProps & { rule: FilterRuleViewModel }) => ReactNode;
  FieldSelector: (props: FilterBuilderSlotProps & { rule: FilterRuleViewModel }) => ReactNode;
  OperatorSelector: (props: FilterBuilderSlotProps & { rule: FilterRuleViewModel }) => ReactNode;
  ValueEditor: (props: FilterBuilderSlotProps & { rule: FilterRuleViewModel }) => ReactNode;
}>;

export interface UseReorderContractOptions {
  filter: Filter;
  onReorder: (filter: Filter) => void;
}

export interface UseReorderContractReturn {
  moveItem: (op: MoveOperation) => void;
  canDrop: (dragId: string, targetGroupId: string) => boolean;
}

export interface UseFilterBuilderOrchestratorOptions {
  value?: Filter;
  defaultValue?: Filter;
  onChange?: (filter: Filter) => void;
  schema: FieldSchema[];
  errors?: Record<string, ValidationError[]>;
}

export interface UseFilterBuilderOrchestratorReturn {
  builder: UseFilterBuilderReturn;
  viewModel: UseFilterViewModelReturn;
  reorder: UseReorderContractReturn;
  actions: FilterBuilderActionHandlers;
  slotProps: FilterBuilderSlotProps;
  canMoveChild: (
    group: FilterGroupViewModel,
    child: FilterNodeViewModel,
    targetIndex: number
  ) => boolean;
  moveChild: (
    group: FilterGroupViewModel,
    child: FilterNodeViewModel,
    index: number,
    direction: 'up' | 'down'
  ) => void;
  handleSortableMove: (group: FilterGroupViewModel, activeId: string, overId: string) => void;
}

export interface UseDslEditorInteractionOptions {
  editor: UseDslEditorReturn;
}

export interface UseDslEditorInteractionReturn {
  cursor: number | undefined;
  setCursor: (cursor: number | undefined) => void;
  isCompletionOpen: boolean;
  setIsCompletionOpen: (open: boolean) => void;
  activeIndex: number;
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>;
  visibleCompletions: CompletionItem[];
  handleKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  applyCompletion: (item: CompletionItem) => void;
  handleChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  updateCursor: (target: HTMLTextAreaElement) => void;
}
