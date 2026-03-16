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
import { useCallback, useRef, useState } from 'react';
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

  const update = useCallback(
    (newFilter: Filter) => {
      if (!isControlled) {
        setInternalFilter(newFilter);
      }
      onChangeRef.current?.(newFilter);
    },
    [isControlled]
  );

  const setFilter = useCallback(
    (filterOrUpdater: Filter | ((prev: Filter) => Filter)) => {
      if (typeof filterOrUpdater === 'function') {
        const current = isControlled ? (value as Filter) : internalFilter;
        update(filterOrUpdater(current));
      } else {
        update(filterOrUpdater);
      }
    },
    [isControlled, value, internalFilter, update]
  );

  const addRule = useCallback(
    (groupId: string, rule?: Partial<FilterRule>) => {
      update(coreAddRule(filter, groupId, rule ?? {}));
    },
    [filter, update]
  );

  const removeRule = useCallback(
    (ruleId: string) => {
      update(coreRemoveRule(filter, ruleId));
    },
    [filter, update]
  );

  const updateRule = useCallback(
    (ruleId: string, updates: Partial<Omit<FilterRule, 'id'>>) => {
      update(coreUpdateRule(filter, ruleId, updates));
    },
    [filter, update]
  );

  const addGroup = useCallback(
    (parentGroupId: string, group?: Partial<FilterGroup>) => {
      update(coreAddGroup(filter, parentGroupId, group));
    },
    [filter, update]
  );

  const removeGroup = useCallback(
    (groupId: string) => {
      update(coreRemoveGroup(filter, groupId));
    },
    [filter, update]
  );

  const updateGroupFn = useCallback(
    (groupId: string, updates: Partial<Pick<FilterGroup, 'combinator' | 'not'>>) => {
      update(coreUpdateGroup(filter, groupId, updates));
    },
    [filter, update]
  );

  const moveRuleFn = useCallback(
    (ruleId: string, targetGroupId: string, position: number) => {
      update(coreMoveRule(filter, ruleId, targetGroupId, position));
    },
    [filter, update]
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
