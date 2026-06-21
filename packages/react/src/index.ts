import { useMemo, useState } from 'react';

export type {
  FilterBuilderActionHandlers,
  FilterBuilderClassNames,
  FilterBuilderLabels,
  FilterBuilderMode,
  FilterBuilderSlotProps,
  FilterBuilderSlots,
  FilterGroupViewModel,
  FilterNodeViewModel,
  FilterPreset,
  FilterRuleViewModel,
  MoveOperation,
  PresetStorage,
  UseDslEditorInteractionOptions,
  UseDslEditorInteractionReturn,
  UseDslEditorOptions,
  UseDslEditorReturn,
  UseFilterBuilderOptions,
  UseFilterBuilderOrchestratorOptions,
  UseFilterBuilderOrchestratorReturn,
  UseFilterBuilderReturn,
  UseFilterPresetsOptions,
  UseFilterPresetsReturn,
  UseFilterUrlSyncOptions,
  UseFilterUrlSyncReturn,
  UseFilterValidationOptions,
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

export {
  formatCompletionValue,
  needsStringQuoting,
  replaceCurrentSegment,
} from './dsl-completion-utils';
export type { DslChipType, DslTokenChip } from './dsl-token-utils';
export {
  dslToTokenChips,
  foldPendingIntoDsl,
  hasUnclosedQuote,
  removeConditionFromDsl,
  removeLastChipFromDsl,
} from './dsl-token-utils';
export type { MoveControlsProps } from './move-controls';
export { MoveControls } from './move-controls';
export type { RenderMode, ResolvedLabels } from './render-decisions';
export {
  canUseAtomicGroup,
  canUseAtomicRule,
  resolveGroupRender,
  resolveLabels,
  resolveRuleRender,
} from './render-decisions';
export { getDefaultRuleUpdatesForField } from './rule-defaults';
export { findOperator, findSchemaField, getFieldOperators } from './schema-utils';
export { useDslEditor } from './use-dsl-editor';
export { useDslEditorInteraction } from './use-dsl-editor-interaction';
export { useFilterBuilder } from './use-filter-builder';
export { useFilterBuilderOrchestrator } from './use-filter-builder-orchestrator';
export { useFilterPresets } from './use-filter-presets';
export { useFilterUrlSync } from './use-filter-url-sync';
export { useFilterValidation } from './use-filter-validation';
export { useFilterViewModel } from './use-filter-view-model';
export { useReorderContract } from './use-reorder-contract';
export {
  asArrayValue,
  asPairValue,
  asStringValue,
  parseNumberInput,
  updatePairValue,
} from './value-utils';
