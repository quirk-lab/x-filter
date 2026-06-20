import { renderHook } from '@testing-library/react';
import type { FieldSchema, Filter, FilterIC, ValidationError } from '@x-filter/core';
import { addRule, moveRule, removeRule, updateRule } from '@x-filter/core';
import { useFilterViewModel } from '../use-filter-view-model';

const schema: FieldSchema[] = [
  { name: 'name', label: 'Name', type: 'text' },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    operators: [{ name: 'customStatus', label: 'matches status', arity: 'binary' }],
  },
];

const filter: Filter = {
  id: 'root',
  combinator: 'and',
  children: [
    { id: 'rule-name', field: 'name', operator: 'contains', value: 'Ada' },
    {
      id: 'group-status',
      combinator: 'or',
      children: [{ id: 'rule-status', field: 'status', operator: 'customStatus', value: 'active' }],
    },
  ],
};

describe('useFilterViewModel', () => {
  it('builds nested group and rule view models with matched schema metadata', () => {
    const { result } = renderHook(() => useFilterViewModel({ filter, schema }));

    expect(result.current.schema).toBe(schema);
    expect(result.current.root).toMatchObject({
      kind: 'group',
      id: 'root',
      group: filter,
      depth: 0,
      aria: { label: 'Filter group root' },
    });

    const nameRule = result.current.root.children[0];
    expect(nameRule).toMatchObject({
      kind: 'rule',
      id: 'rule-name',
      rule: filter.children[0],
      field: schema[0],
      operator: { name: 'contains', label: 'contains', arity: 'binary' },
      errors: [],
      aria: { label: 'Rule Name contains' },
    });

    const nestedGroup = result.current.root.children[1];
    expect(nestedGroup).toMatchObject({
      kind: 'group',
      id: 'group-status',
      group: filter.children[1],
      depth: 1,
      aria: { label: 'Filter group group-status' },
    });
    if (nestedGroup.kind !== 'group') {
      throw new Error('Expected nested group');
    }

    expect(nestedGroup.children[0]).toMatchObject({
      kind: 'rule',
      id: 'rule-status',
      rule: nestedGroup.group.children[0],
      field: schema[1],
      operator: schema[1].operators?.[0],
      errors: [],
      aria: { label: 'Rule Status matches status' },
    });
  });

  it('exposes inline combinators for an IC group and keeps children combinator-free', () => {
    const icFilter: FilterIC = {
      id: 'root',
      children: [
        { id: 'r1', field: 'name', operator: 'contains', value: 'Ada' },
        'and',
        { id: 'r2', field: 'name', operator: 'contains', value: 'Bob' },
        'or',
        { id: 'r3', field: 'name', operator: 'contains', value: 'Cay' },
      ],
    };

    const { result } = renderHook(() => useFilterViewModel({ filter: icFilter, schema }));

    expect(result.current.root.children.map((child) => child.id)).toEqual(['r1', 'r2', 'r3']);
    expect(result.current.root.children.every((child) => child.kind === 'rule')).toBe(true);
    expect(result.current.root.combinators).toEqual(['and', 'or']);
  });

  it('omits combinators for a standard group', () => {
    const { result } = renderHook(() => useFilterViewModel({ filter, schema }));

    expect(result.current.root.combinators).toBeUndefined();
  });

  it('builds nested IC groups with their own inline combinators', () => {
    const icFilter: FilterIC = {
      id: 'root',
      children: [
        { id: 'r1', field: 'name', operator: 'contains', value: 'Ada' },
        'or',
        {
          id: 'g1',
          children: [
            { id: 'r2', field: 'name', operator: 'contains', value: 'Bob' },
            'and',
            { id: 'r3', field: 'name', operator: 'contains', value: 'Cay' },
          ],
        },
      ],
    };

    const { result } = renderHook(() => useFilterViewModel({ filter: icFilter, schema }));

    expect(result.current.root.combinators).toEqual(['or']);
    const nested = result.current.root.children[1];
    if (nested.kind !== 'group') {
      throw new Error('Expected nested group');
    }
    expect(nested.combinators).toEqual(['and']);
    expect(nested.children.map((child) => child.id)).toEqual(['r2', 'r3']);
  });

  it('attaches validation errors and describedBy to matching rule view models', () => {
    const errors: Record<string, ValidationError[]> = {
      'rule-name': [{ type: 'invalidValue', message: 'Name is invalid' }],
    };

    const { result } = renderHook(() => useFilterViewModel({ filter, schema, errors }));
    const nameRule = result.current.root.children[0];

    expect(nameRule).toMatchObject({
      kind: 'rule',
      id: 'rule-name',
      errors: errors['rule-name'],
      aria: {
        label: 'Rule Name contains',
        describedBy: 'rule-name-errors',
      },
    });
  });

  it('leaves field and operator undefined for unknown field or operator without throwing', () => {
    const unknownFilter: Filter = {
      id: 'root',
      combinator: 'and',
      children: [
        { id: 'unknown-field', field: 'missing', operator: 'equals', value: 'Ada' },
        { id: 'unknown-operator', field: 'name', operator: 'missingOperator', value: 'Ada' },
      ],
    };

    const { result } = renderHook(() =>
      useFilterViewModel({ filter: unknownFilter, schema, errors: {} })
    );

    expect(result.current.root.children[0]).toMatchObject({
      kind: 'rule',
      id: 'unknown-field',
      field: undefined,
      operator: undefined,
      errors: [],
      aria: { label: 'Rule missing equals' },
    });
    expect(result.current.root.children[1]).toMatchObject({
      kind: 'rule',
      id: 'unknown-operator',
      field: schema[0],
      operator: undefined,
      errors: [],
      aria: { label: 'Rule Name missingOperator' },
    });
  });

  it('recomputes when filter, schema, or errors change', () => {
    const firstErrors: Record<string, ValidationError[]> = {};
    const { result, rerender } = renderHook(
      ({ currentFilter, currentSchema, currentErrors }) =>
        useFilterViewModel({
          filter: currentFilter,
          schema: currentSchema,
          errors: currentErrors,
        }),
      {
        initialProps: {
          currentFilter: filter,
          currentSchema: schema,
          currentErrors: firstErrors,
        },
      }
    );

    const firstRoot = result.current.root;
    const nextSchema: FieldSchema[] = [{ name: 'name', label: 'Full name', type: 'text' }];
    const nextFilter: Filter = {
      id: 'next-root',
      combinator: 'or',
      children: [{ id: 'next-rule', field: 'name', operator: 'equals', value: 'Grace' }],
    };
    const nextErrors: Record<string, ValidationError[]> = {
      'next-rule': [{ type: 'missingValue', message: 'Required' }],
    };

    rerender({
      currentFilter: nextFilter,
      currentSchema: nextSchema,
      currentErrors: nextErrors,
    });

    expect(result.current.root).not.toBe(firstRoot);
    expect(result.current.schema).toBe(nextSchema);
    expect(result.current.root).toMatchObject({ id: 'next-root', group: nextFilter });
    expect(result.current.root.children[0]).toMatchObject({
      id: 'next-rule',
      field: nextSchema[0],
      errors: nextErrors['next-rule'],
      aria: { label: 'Rule Full name equals', describedBy: 'next-rule-errors' },
    });
  });

  it('keeps the same view model when inputs are unchanged and errors are omitted', () => {
    const { result, rerender } = renderHook(() => useFilterViewModel({ filter, schema }));
    const firstRoot = result.current.root;

    rerender();

    expect(result.current.root).toBe(firstRoot);
  });

  describe('identity-aware structural sharing', () => {
    it('reuses the unchanged rule ViewModel by reference after a sibling mutation', () => {
      const { result, rerender } = renderHook(
        ({ currentFilter }) => useFilterViewModel({ filter: currentFilter, schema }),
        { initialProps: { currentFilter: filter } }
      );

      const firstNameVm = result.current.root.children[0];
      const firstNestedGroupVm = result.current.root.children[1];

      // Mutate only rule-status inside group-status; rule-name is ===.
      const nextFilter = updateRule(filter, 'rule-status', { value: 'pending' });
      rerender({ currentFilter: nextFilter });

      // Root changed (new filter object).
      expect(result.current.root).not.toBe(firstNestedGroupVm);
      // rule-name ViewModel is reused by reference (source rule ===).
      expect(result.current.root.children[0]).toBe(firstNameVm);
    });

    it('reuses an unchanged nested group ViewModel by reference after a sibling mutation', () => {
      const { result, rerender } = renderHook(
        ({ currentFilter }) => useFilterViewModel({ filter: currentFilter, schema }),
        { initialProps: { currentFilter: filter } }
      );

      const firstNestedGroupVm = result.current.root.children[1];
      // Mutate rule-name (a sibling of group-status); group-status subtree is ===.
      const nextFilter = updateRule(filter, 'rule-name', { value: 'Grace' });
      rerender({ currentFilter: nextFilter });

      expect(result.current.root.children[1]).toBe(firstNestedGroupVm);
    });

    it('rebuilds a rule ViewModel when its errors array reference changes', () => {
      const firstErrors: Record<string, ValidationError[]> = {};
      const { result, rerender } = renderHook(
        ({ currentFilter, currentErrors }) =>
          useFilterViewModel({ filter: currentFilter, schema, errors: currentErrors }),
        { initialProps: { currentFilter: filter, currentErrors: firstErrors } }
      );

      const firstNameVm = result.current.root.children[0];

      // Same filter (===), but a NEW errors object with a NEW array for rule-name.
      const nextErrors: Record<string, ValidationError[]> = {
        'rule-name': [{ type: 'invalidValue', message: 'now invalid' }],
      };
      rerender({ currentFilter: filter, currentErrors: nextErrors });

      // rule-name ViewModel rebuilt because errorsRef changed.
      expect(result.current.root.children[0]).not.toBe(firstNameVm);
      expect(result.current.root.children[0]).toMatchObject({
        id: 'rule-name',
        aria: { describedBy: 'rule-name-errors' },
      });
    });

    it('reuses a rule ViewModel when the errors object identity changes but its per-rule array is ===', () => {
      const ruleNameErrors: ValidationError[] = [];
      const firstErrors: Record<string, ValidationError[]> = { 'rule-name': ruleNameErrors };
      const { result, rerender } = renderHook(
        ({ currentFilter, currentErrors }) =>
          useFilterViewModel({ filter: currentFilter, schema, errors: currentErrors }),
        { initialProps: { currentFilter: filter, currentErrors: firstErrors } }
      );

      const firstNameVm = result.current.root.children[0];

      // New top-level errors object, but the SAME array reference for rule-name.
      const nextErrors: Record<string, ValidationError[]> = { 'rule-name': ruleNameErrors };
      rerender({ currentFilter: filter, currentErrors: nextErrors });

      expect(result.current.root.children[0]).toBe(firstNameVm);
    });

    it('invalidates the cache when the schema reference changes', () => {
      const { result, rerender } = renderHook(
        ({ currentFilter, currentSchema }) =>
          useFilterViewModel({ filter: currentFilter, schema: currentSchema }),
        { initialProps: { currentFilter: filter, currentSchema: schema } }
      );

      const firstNameVm = result.current.root.children[0];

      // New schema object (same content, different reference) → cache dropped.
      const nextSchema: FieldSchema[] = [
        { name: 'name', label: 'Name', type: 'text' },
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          operators: [{ name: 'customStatus', label: 'matches status', arity: 'binary' }],
        },
      ];
      rerender({ currentFilter: filter, currentSchema: nextSchema });

      // Same filter ===, but schema changed → rule-name ViewModel rebuilt.
      expect(result.current.root.children[0]).not.toBe(firstNameVm);
      expect(result.current.root.children[0]).toMatchObject({ id: 'rule-name' });
    });

    it('builds a fresh ViewModel for a newly added rule and invalidates the parent group', () => {
      const { result, rerender } = renderHook(
        ({ currentFilter }) => useFilterViewModel({ filter: currentFilter, schema }),
        { initialProps: { currentFilter: filter } }
      );

      const firstRootVm = result.current.root;
      const firstNameVm = firstRootVm.children[0];
      const firstNestedGroupVm = firstRootVm.children[1];
      if (firstNestedGroupVm.kind !== 'group') throw new Error('Expected group');

      // Add a new rule to the nested group-status; rule-name and group-status
      // source objects: rule-name is ===, group-status is NOT (new conditions).
      const nextFilter = addRule(filter, 'group-status', {
        id: 'rule-new',
        field: 'status',
        operator: 'customStatus',
        value: 'open',
      });
      rerender({ currentFilter: nextFilter });

      // rule-name (sibling of group-status) is === → VM reused.
      expect(result.current.root.children[0]).toBe(firstNameVm);
      // group-status source changed → group VM rebuilt (not ===).
      expect(result.current.root.children[1]).not.toBe(firstNestedGroupVm);
      // The new rule gets a fresh VM inside the rebuilt group.
      const rebuiltGroup = result.current.root.children[1];
      if (rebuiltGroup.kind !== 'group') throw new Error('Expected group');
      expect(rebuiltGroup.children).toHaveLength(2);
      expect(rebuiltGroup.children[1]).toMatchObject({ id: 'rule-new', kind: 'rule' });
      // The pre-existing rule-status inside group-status is === → its VM is reused.
      expect(rebuiltGroup.children[0]).toBe(firstNestedGroupVm.children[0]);
    });

    it('reuses sibling ViewModels after a rule is removed', () => {
      // Start with a flat filter of two rules so removal leaves one sibling.
      const flatFilter: Filter = {
        id: 'root',
        combinator: 'and',
        children: [
          { id: 'r-keep', field: 'name', operator: 'contains', value: 'Ada' },
          { id: 'r-remove', field: 'name', operator: 'equals', value: 'Grace' },
        ],
      };
      const { result, rerender } = renderHook(
        ({ currentFilter }) => useFilterViewModel({ filter: currentFilter, schema }),
        { initialProps: { currentFilter: flatFilter } }
      );

      const firstKeepVm = result.current.root.children[0];

      const nextFilter = removeRule(flatFilter, 'r-remove');
      rerender({ currentFilter: nextFilter });

      // r-keep is === → VM reused by reference.
      expect(result.current.root.children[0]).toBe(firstKeepVm);
      expect(result.current.root.children).toHaveLength(1);
    });

    it('reuses the moved rule ViewModel and rebuilds source/target group VMs on cross-group move', () => {
      // root has two groups: g-a (containing rule-movable) and g-b (empty).
      const moveFilter: Filter = {
        id: 'root',
        combinator: 'and',
        children: [
          {
            id: 'g-a',
            combinator: 'and',
            children: [{ id: 'rule-movable', field: 'name', operator: 'contains', value: 'Ada' }],
          },
          { id: 'g-b', combinator: 'and', children: [] },
        ],
      };
      const { result, rerender } = renderHook(
        ({ currentFilter }) => useFilterViewModel({ filter: currentFilter, schema }),
        { initialProps: { currentFilter: moveFilter } }
      );

      const firstGroupA = result.current.root.children[0];
      const firstGroupB = result.current.root.children[1];
      if (firstGroupA.kind !== 'group' || firstGroupB.kind !== 'group') {
        throw new Error('Expected groups');
      }
      const firstMovableVm = firstGroupA.children[0];

      // Move rule-movable from g-a to g-b at position 0.
      const nextFilter = moveRule(moveFilter, 'rule-movable', 'g-b', 0);
      rerender({ currentFilter: nextFilter });

      const afterGroupA = result.current.root.children[0];
      const afterGroupB = result.current.root.children[1];
      if (afterGroupA.kind !== 'group' || afterGroupB.kind !== 'group') {
        throw new Error('Expected groups');
      }

      // Both groups changed (new conditions arrays) → VMs rebuilt.
      expect(afterGroupA).not.toBe(firstGroupA);
      expect(afterGroupB).not.toBe(firstGroupB);
      // The moved rule object is === (moveRule doesn't clone) → VM reused.
      expect(afterGroupB.children[0]).toBe(firstMovableVm);
      // g-a is now empty.
      expect(afterGroupA.children).toHaveLength(0);
    });

    it('rebuilds the parent group ViewModel when a child rule VM changes but the group source is ===', () => {
      // This exercises the group cache's childRefs comparison: filter is ===
      // but the errors object changes for one rule, producing a new child VM.
      const ruleErrors: ValidationError[] = [];
      const initialErrors: Record<string, ValidationError[]> = { 'rule-name': ruleErrors };
      const { result, rerender } = renderHook(
        ({
          currentFilter,
          currentErrors,
        }: {
          currentFilter: Filter;
          currentErrors: Record<string, ValidationError[]>;
        }) => useFilterViewModel({ filter: currentFilter, schema, errors: currentErrors }),
        { initialProps: { currentFilter: filter, currentErrors: initialErrors } }
      );

      const firstRootVm = result.current.root;
      const firstNameVm = firstRootVm.children[0];
      const firstNestedGroupVm = firstRootVm.children[1];

      // Same filter (===), but a NEW errors array for rule-name.
      const nextErrors: Record<string, ValidationError[]> = {
        'rule-name': [{ type: 'invalidValue', message: 'now invalid' }],
      };
      rerender({ currentFilter: filter, currentErrors: nextErrors });

      // rule-name VM changed (new errorsRef) → root group's childRefs differ
      // → root group VM rebuilt even though filter source is ===.
      expect(result.current.root).not.toBe(firstRootVm);
      expect(result.current.root.children[0]).not.toBe(firstNameVm);
      // group-status child is unchanged (errors for rule-status didn't change)
      // → its VM is reused, but the root group that contains it is rebuilt.
      expect(result.current.root.children[1]).toBe(firstNestedGroupVm);
    });
  });

  describe('locked', () => {
    it('mirrors the locked flag on rule and group view models', () => {
      const lockedFilter: Filter = {
        id: 'root',
        combinator: 'and',
        children: [
          { id: 'r1', field: 'name', operator: 'contains', value: 'x', locked: true },
          { id: 'r2', field: 'name', operator: 'contains', value: 'y' },
          {
            id: 'g1',
            combinator: 'or',
            locked: true,
            children: [{ id: 'r3', field: 'name', operator: 'contains', value: 'z' }],
          },
        ],
      };
      const { result } = renderHook(() => useFilterViewModel({ filter: lockedFilter, schema }));

      expect(result.current.root.locked).toBe(false);
      expect(result.current.root.children[0].locked).toBe(true);
      expect(result.current.root.children[1].locked).toBe(false);
      expect(result.current.root.children[2].locked).toBe(true);
    });

    it('mirrors the locked flag on IC group view models', () => {
      const lockedIC: FilterIC = {
        id: 'root',
        children: [{ id: 'r1', field: 'name', operator: 'contains', value: 'x', locked: true }],
      };
      const { result } = renderHook(() => useFilterViewModel({ filter: lockedIC, schema }));

      expect(result.current.root.children[0].locked).toBe(true);
    });
  });
});
