import type {
  Combinator,
  Filter,
  FilterAny,
  FilterGroup,
  FilterGroupIC,
  FilterIC,
  FilterRule,
} from '@x-filter/core';
import {
  addGroupIC,
  addRuleIC,
  cloneGroupIC,
  cloneRuleIC,
  addGroup as coreAddGroup,
  addRule as coreAddRule,
  cloneGroup as coreCloneGroup,
  cloneRule as coreCloneRule,
  moveRule as coreMoveRule,
  removeGroup as coreRemoveGroup,
  removeRule as coreRemoveRule,
  updateGroup as coreUpdateGroup,
  updateRule as coreUpdateRule,
  createFilter,
  generateId,
  moveRuleIC,
  removeGroupIC,
  removeRuleIC,
  setCombinatorIC,
  updateGroupIC,
  updateRuleIC,
} from '@x-filter/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { UseFilterBuilderOptions, UseFilterBuilderReturn } from './types';

function createEmptyFilter(mode: 'standard' | 'ic'): FilterAny {
  if (mode === 'ic') {
    const empty: FilterIC = { id: generateId(), children: [] };
    return empty;
  }
  return createFilter();
}

export function useFilterBuilder(options: UseFilterBuilderOptions): UseFilterBuilderReturn {
  const { value, defaultValue, onChange, schema, mode = 'standard' } = options;
  const isControlled = value !== undefined;
  const isIC = mode === 'ic';

  const [internalFilter, setInternalFilter] = useState<FilterAny>(
    () => defaultValue ?? createEmptyFilter(mode)
  );

  const filter: FilterAny = isControlled ? value : internalFilter;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const latestFilterRef = useRef(filter);

  useEffect(() => {
    latestFilterRef.current = filter;
  }, [filter]);

  const applyMutation = useCallback(
    (mutator: (prev: FilterAny) => FilterAny) => {
      const nextFilter = mutator(latestFilterRef.current);
      latestFilterRef.current = nextFilter;

      if (!isControlled) {
        setInternalFilter(nextFilter);
      }
      onChangeRef.current?.(nextFilter as Filter);
    },
    [isControlled]
  );

  const setFilter = useCallback(
    (filterOrUpdater: Filter | ((prev: Filter) => Filter)) => {
      if (typeof filterOrUpdater === 'function') {
        applyMutation((prev) => filterOrUpdater(prev as Filter));
      } else {
        applyMutation(() => filterOrUpdater);
      }
    },
    [applyMutation]
  );

  const addRule = useCallback(
    (groupId: string, rule?: Partial<FilterRule>) => {
      applyMutation((prev) =>
        isIC
          ? addRuleIC(prev as FilterIC, groupId, rule ?? {})
          : coreAddRule(prev as Filter, groupId, rule ?? {})
      );
    },
    [applyMutation, isIC]
  );

  const removeRule = useCallback(
    (ruleId: string) => {
      applyMutation((prev) =>
        isIC ? removeRuleIC(prev as FilterIC, ruleId) : coreRemoveRule(prev as Filter, ruleId)
      );
    },
    [applyMutation, isIC]
  );

  const updateRule = useCallback(
    (ruleId: string, updates: Partial<Omit<FilterRule, 'id'>>) => {
      applyMutation((prev) =>
        isIC
          ? updateRuleIC(prev as FilterIC, ruleId, updates)
          : coreUpdateRule(prev as Filter, ruleId, updates)
      );
    },
    [applyMutation, isIC]
  );

  const addGroup = useCallback(
    (parentGroupId: string, group?: Partial<FilterGroup>) => {
      applyMutation((prev) =>
        isIC
          ? addGroupIC(prev as FilterIC, parentGroupId, group as Partial<FilterGroupIC> | undefined)
          : coreAddGroup(prev as Filter, parentGroupId, group)
      );
    },
    [applyMutation, isIC]
  );

  const removeGroup = useCallback(
    (groupId: string) => {
      applyMutation((prev) =>
        isIC ? removeGroupIC(prev as FilterIC, groupId) : coreRemoveGroup(prev as Filter, groupId)
      );
    },
    [applyMutation, isIC]
  );

  const updateGroupFn = useCallback(
    (groupId: string, updates: Partial<Pick<FilterGroup, 'combinator' | 'not'>>) => {
      applyMutation((prev) =>
        isIC
          ? updateGroupIC(prev as FilterIC, groupId, updates as Partial<Pick<FilterGroupIC, 'not'>>)
          : coreUpdateGroup(prev as Filter, groupId, updates)
      );
    },
    [applyMutation, isIC]
  );

  const moveRuleFn = useCallback(
    (ruleId: string, targetGroupId: string, position: number) => {
      applyMutation((prev) =>
        isIC
          ? moveRuleIC(prev as FilterIC, ruleId, targetGroupId, position)
          : coreMoveRule(prev as Filter, ruleId, targetGroupId, position)
      );
    },
    [applyMutation, isIC]
  );

  const setCombinatorFn = useCallback(
    (groupId: string, comboIndex: number, combinator: Combinator) => {
      applyMutation((prev) =>
        isIC
          ? setCombinatorIC(prev as FilterIC, groupId, comboIndex, combinator)
          : // Standard groups carry a single combinator; map every inline slot onto it.
            coreUpdateGroup(prev as Filter, groupId, { combinator })
      );
    },
    [applyMutation, isIC]
  );

  const cloneRule = useCallback(
    (ruleId: string) => {
      applyMutation((prev) =>
        isIC ? cloneRuleIC(prev as FilterIC, ruleId) : coreCloneRule(prev as Filter, ruleId)
      );
    },
    [applyMutation, isIC]
  );

  const cloneGroup = useCallback(
    (groupId: string) => {
      applyMutation((prev) =>
        isIC ? cloneGroupIC(prev as FilterIC, groupId) : coreCloneGroup(prev as Filter, groupId)
      );
    },
    [applyMutation, isIC]
  );

  return {
    filter: filter as Filter,
    setFilter,
    addRule,
    removeRule,
    updateRule,
    addGroup,
    removeGroup,
    updateGroup: updateGroupFn,
    moveRule: moveRuleFn,
    setCombinator: setCombinatorFn,
    cloneRule,
    cloneGroup,
    schema,
  };
}
