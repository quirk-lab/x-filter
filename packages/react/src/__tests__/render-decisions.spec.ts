import {
  canUseAtomicGroup,
  canUseAtomicRule,
  resolveGroupRender,
  resolveLabels,
  resolveRuleRender,
} from '../render-decisions';
import type { FilterBuilderSlots } from '../types';

const resolvedLabels = resolveLabels();

describe('canUseAtomicRule', () => {
  it('returns true with default labels, no slots, no classNames', () => {
    expect(canUseAtomicRule(resolvedLabels, undefined, undefined)).toBe(true);
  });

  it('returns false when removeRule label is custom', () => {
    expect(canUseAtomicRule(resolveLabels({ removeRule: 'Delete' }), undefined, undefined)).toBe(
      false
    );
  });

  it('returns false when FieldSelector slot is provided', () => {
    expect(canUseAtomicRule(resolvedLabels, { FieldSelector: () => null }, undefined)).toBe(false);
  });

  it('returns false when OperatorSelector slot is provided', () => {
    expect(canUseAtomicRule(resolvedLabels, { OperatorSelector: () => null }, undefined)).toBe(
      false
    );
  });

  it('returns false when ValueEditor slot is provided', () => {
    expect(canUseAtomicRule(resolvedLabels, { ValueEditor: () => null }, undefined)).toBe(false);
  });

  it('returns false when fieldSelector className is provided', () => {
    expect(canUseAtomicRule(resolvedLabels, undefined, { fieldSelector: 'custom' })).toBe(false);
  });

  it('returns false when actions className is provided', () => {
    expect(canUseAtomicRule(resolvedLabels, undefined, { actions: 'custom' })).toBe(false);
  });
});

describe('canUseAtomicGroup', () => {
  it('returns true with default labels, no classNames', () => {
    expect(canUseAtomicGroup(resolvedLabels, undefined)).toBe(true);
  });

  it('returns false when addRule label is custom', () => {
    expect(canUseAtomicGroup(resolveLabels({ addRule: 'New' }), undefined)).toBe(false);
  });

  it('returns false when addGroup label is custom', () => {
    expect(canUseAtomicGroup(resolveLabels({ addGroup: 'New' }), undefined)).toBe(false);
  });

  it('returns false when removeGroup label is custom', () => {
    expect(canUseAtomicGroup(resolveLabels({ removeGroup: 'Delete' }), undefined)).toBe(false);
  });

  it('returns false when actions className is provided', () => {
    expect(canUseAtomicGroup(resolvedLabels, { actions: 'custom' })).toBe(false);
  });
});

describe('resolveRuleRender', () => {
  it('returns "slot" when Rule slot is provided', () => {
    const slots: FilterBuilderSlots = { Rule: () => null };
    expect(resolveRuleRender(slots, resolvedLabels, undefined)).toBe('slot');
  });

  it('returns "atomic" when no slots, default labels, no classNames', () => {
    expect(resolveRuleRender(undefined, resolvedLabels, undefined)).toBe('atomic');
  });

  it('returns "fallback" when custom labels prevent atomic', () => {
    expect(resolveRuleRender(undefined, resolveLabels({ removeRule: 'Delete' }), undefined)).toBe(
      'fallback'
    );
  });

  it('returns "fallback" when FieldSelector slot is provided (but no Rule slot)', () => {
    const slots: FilterBuilderSlots = { FieldSelector: () => null };
    expect(resolveRuleRender(slots, resolvedLabels, undefined)).toBe('fallback');
  });
});

describe('resolveGroupRender', () => {
  it('returns "slot" when Group slot is provided', () => {
    const slots: FilterBuilderSlots = { Group: () => null };
    expect(resolveGroupRender(slots, resolvedLabels, undefined)).toBe('slot');
  });

  it('returns "atomic" when no slots, default labels, no classNames', () => {
    expect(resolveGroupRender(undefined, resolvedLabels, undefined)).toBe('atomic');
  });

  it('returns "fallback" when custom labels prevent atomic', () => {
    expect(resolveGroupRender(undefined, resolveLabels({ addRule: 'New' }), undefined)).toBe(
      'fallback'
    );
  });
});

describe('resolveLabels', () => {
  it('returns default labels when no labels provided', () => {
    const result = resolveLabels();
    expect(result).toEqual({
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
    });
  });

  it('overrides defaults with provided labels', () => {
    const result = resolveLabels({ addRule: 'New rule' });
    expect(result.addRule).toBe('New rule');
    expect(result.addGroup).toBe('Add group');
  });
});
