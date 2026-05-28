import { useMemo, useState } from 'react';

export type {
  FilterBuilderActionHandlers,
  FilterBuilderClassNames,
  FilterBuilderLabels,
  FilterBuilderSlotProps,
  FilterBuilderSlots,
  FilterGroupViewModel,
  FilterNodeViewModel,
  FilterRuleViewModel,
  MoveOperation,
  UseDslEditorOptions,
  UseDslEditorReturn,
  UseFilterBuilderOptions,
  UseFilterBuilderReturn,
  UseFilterDslOptions,
  UseFilterDslReturn,
  UseFilterUrlSyncOptions,
  UseFilterUrlSyncReturn,
  UseFilterViewModelOptions,
  UseFilterViewModelReturn,
  UseReorderContractOptions,
  UseReorderContractReturn,
} from './types';

export function useValidatedInput(initialValue = '') {
  const [value, setValue] = useState(initialValue);
  const isValid = useMemo(() => value.trim().length > 0, [value]);

  return {
    value,
    setValue,
    isValid,
  };
}

export function useFilteredArray<T>(array: readonly (T | null | undefined)[]): T[] {
  return useMemo(
    () => array.filter((item): item is T => item !== null && item !== undefined),
    [array]
  );
}

export { useDslEditor } from './use-dsl-editor';
export { useFilterBuilder } from './use-filter-builder';
export { useFilterDsl } from './use-filter-dsl';
export { useFilterUrlSync } from './use-filter-url-sync';
export { useFilterViewModel } from './use-filter-view-model';
export { useReorderContract } from './use-reorder-contract';
