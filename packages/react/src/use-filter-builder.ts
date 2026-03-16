import type { Filter, FilterGroup, FilterRule } from '@x-filter/core';
import {
  addGroup as coreAddGroup,
  addRule as coreAddRule,
  moveRule as coreMoveRule,
  removeGroup as coreRemoveGroup,
  removeRule as coreRemoveRule,
  updateGroup as coreUpdateGroup,
  updateRule as coreUpdateRule,
  createFilter,
} from '@x-filter/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { UseFilterBuilderOptions, UseFilterBuilderReturn } from './types';

export function useFilterBuilder(options: UseFilterBuilderOptions): UseFilterBuilderReturn {
  const { value, defaultValue, onChange, schema } = options;
  const isControlled = value !== undefined;

  const [internalFilter, setInternalFilter] = useState<Filter>(
    () => defaultValue ?? createFilter()
  );

  const filter = isControlled ? value : internalFilter;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const latestFilterRef = useRef(filter);

  useEffect(() => {
    latestFilterRef.current = filter;
  }, [filter]);

  const applyMutation = useCallback(
    (mutator: (prev: Filter) => Filter) => {
      const nextFilter = mutator(latestFilterRef.current);
      latestFilterRef.current = nextFilter;

      if (!isControlled) {
        setInternalFilter(nextFilter);
      }
      onChangeRef.current?.(nextFilter);
    },
    [isControlled]
  );

  const setFilter = useCallback(
    (filterOrUpdater: Filter | ((prev: Filter) => Filter)) => {
      if (typeof filterOrUpdater === 'function') {
        applyMutation(filterOrUpdater);
      } else {
        applyMutation(() => filterOrUpdater);
      }
    },
    [applyMutation]
  );

  const addRule = useCallback(
    (groupId: string, rule?: Partial<FilterRule>) => {
      applyMutation((prev) => coreAddRule(prev, groupId, rule ?? {}));
    },
    [applyMutation]
  );

  const removeRule = useCallback(
    (ruleId: string) => {
      applyMutation((prev) => coreRemoveRule(prev, ruleId));
    },
    [applyMutation]
  );

  const updateRule = useCallback(
    (ruleId: string, updates: Partial<Omit<FilterRule, 'id'>>) => {
      applyMutation((prev) => coreUpdateRule(prev, ruleId, updates));
    },
    [applyMutation]
  );

  const addGroup = useCallback(
    (parentGroupId: string, group?: Partial<FilterGroup>) => {
      applyMutation((prev) => coreAddGroup(prev, parentGroupId, group));
    },
    [applyMutation]
  );

  const removeGroup = useCallback(
    (groupId: string) => {
      applyMutation((prev) => coreRemoveGroup(prev, groupId));
    },
    [applyMutation]
  );

  const updateGroupFn = useCallback(
    (groupId: string, updates: Partial<Pick<FilterGroup, 'combinator' | 'not'>>) => {
      applyMutation((prev) => coreUpdateGroup(prev, groupId, updates));
    },
    [applyMutation]
  );

  const moveRuleFn = useCallback(
    (ruleId: string, targetGroupId: string, position: number) => {
      applyMutation((prev) => coreMoveRule(prev, ruleId, targetGroupId, position));
    },
    [applyMutation]
  );

  return {
    filter,
    setFilter,
    addRule,
    removeRule,
    updateRule,
    addGroup,
    removeGroup,
    updateGroup: updateGroupFn,
    moveRule: moveRuleFn,
    schema,
  };
}
