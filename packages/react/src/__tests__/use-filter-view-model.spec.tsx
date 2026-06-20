import { renderHook } from '@testing-library/react';
import type { FieldSchema, Filter, ValidationError } from '@x-filter/core';
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
});
