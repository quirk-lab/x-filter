import type { FilterBuilderClassNames, FilterBuilderLabels, FilterBuilderSlots } from './types';

const DEFAULT_LABELS = {
  addRule: 'Add rule',
  addGroup: 'Add group',
  removeRule: 'Remove rule',
  removeGroup: 'Remove group',
  cloneRule: 'Clone rule',
  cloneGroup: 'Clone group',
  clearAll: 'Clear all',
  clearAllConfirm: 'Confirm clear',
  clearAllCancel: 'Cancel',
  emptyStateTitle: 'No filters yet',
  emptyStateDescription: 'Add your first rule to start filtering.',
  emptyStateAction: 'Add your first rule',
} satisfies Required<
  Pick<
    FilterBuilderLabels,
    | 'addRule'
    | 'addGroup'
    | 'removeRule'
    | 'removeGroup'
    | 'cloneRule'
    | 'cloneGroup'
    | 'clearAll'
    | 'clearAllConfirm'
    | 'clearAllCancel'
    | 'emptyStateTitle'
    | 'emptyStateDescription'
    | 'emptyStateAction'
  >
>;

export type ResolvedLabels = {
  addRule: string;
  addGroup: string;
  removeRule: string;
  removeGroup: string;
  cloneRule: string;
  cloneGroup: string;
  clearAll: string;
  clearAllConfirm: string;
  clearAllCancel: string;
  emptyStateTitle: string;
  emptyStateDescription: string;
  emptyStateAction: string;
};

/**
 * @internal
 * Resolves partial labels into a complete set with defaults filled in.
 */
export function resolveLabels(labels?: FilterBuilderLabels): ResolvedLabels {
  return {
    addRule: labels?.addRule ?? DEFAULT_LABELS.addRule,
    addGroup: labels?.addGroup ?? DEFAULT_LABELS.addGroup,
    removeRule: labels?.removeRule ?? DEFAULT_LABELS.removeRule,
    removeGroup: labels?.removeGroup ?? DEFAULT_LABELS.removeGroup,
    cloneRule: labels?.cloneRule ?? DEFAULT_LABELS.cloneRule,
    cloneGroup: labels?.cloneGroup ?? DEFAULT_LABELS.cloneGroup,
    clearAll: labels?.clearAll ?? DEFAULT_LABELS.clearAll,
    clearAllConfirm: labels?.clearAllConfirm ?? DEFAULT_LABELS.clearAllConfirm,
    clearAllCancel: labels?.clearAllCancel ?? DEFAULT_LABELS.clearAllCancel,
    emptyStateTitle: labels?.emptyStateTitle ?? DEFAULT_LABELS.emptyStateTitle,
    emptyStateDescription: labels?.emptyStateDescription ?? DEFAULT_LABELS.emptyStateDescription,
    emptyStateAction: labels?.emptyStateAction ?? DEFAULT_LABELS.emptyStateAction,
  };
}

/**
 * @internal
 * Determines whether the atomic FilterRule component can be used
 * (no custom slots, no custom classNames, default removeRule label).
 */
export function canUseAtomicRule(
  labels: ResolvedLabels,
  slots?: FilterBuilderSlots,
  classNames?: FilterBuilderClassNames
): boolean {
  return (
    labels.removeRule === DEFAULT_LABELS.removeRule &&
    !slots?.FieldSelector &&
    !slots?.OperatorSelector &&
    !slots?.ValueEditor &&
    !classNames?.fieldSelector &&
    !classNames?.operatorSelector &&
    !classNames?.valueEditor &&
    !classNames?.actions
  );
}

/**
 * @internal
 * Determines whether the atomic FilterGroup component can be used
 * (no custom classNames, default action labels).
 */
export function canUseAtomicGroup(
  labels: ResolvedLabels,
  classNames?: FilterBuilderClassNames
): boolean {
  return (
    labels.addRule === DEFAULT_LABELS.addRule &&
    labels.addGroup === DEFAULT_LABELS.addGroup &&
    labels.removeGroup === DEFAULT_LABELS.removeGroup &&
    !classNames?.actions
  );
}

export type RenderMode = 'slot' | 'atomic' | 'fallback';

/**
 * @internal
 * Decides which render path to use for a rule:
 * - 'slot' if a Rule slot is provided
 * - 'atomic' if no slots/classNames prevent the atomic component
 * - 'fallback' otherwise (manual JSX assembly)
 */
export function resolveRuleRender(
  slots: FilterBuilderSlots | undefined,
  labels: ResolvedLabels,
  classNames: FilterBuilderClassNames | undefined
): RenderMode {
  if (slots?.Rule) return 'slot';
  if (canUseAtomicRule(labels, slots, classNames)) return 'atomic';
  return 'fallback';
}

/**
 * @internal
 * Decides which render path to use for a group.
 */
export function resolveGroupRender(
  slots: FilterBuilderSlots | undefined,
  labels: ResolvedLabels,
  classNames: FilterBuilderClassNames | undefined
): RenderMode {
  if (slots?.Group) return 'slot';
  if (canUseAtomicGroup(labels, classNames)) return 'atomic';
  return 'fallback';
}
