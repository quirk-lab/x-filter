import { fireEvent, render, screen, within } from '@testing-library/react';
import type { FieldSchema, Filter, FilterIC, FilterRule, ValidationError } from '@x-filter/core';
import {
  Button,
  Card,
  Checkbox,
  cn,
  Input,
  Select,
  ShadcnCombinatorSelector,
  ShadcnFieldSelector,
  ShadcnFilterBuilder,
  ShadcnFilterGroup,
  ShadcnFilterRule,
  ShadcnInlineCombinator,
  ShadcnNotToggle,
  ShadcnOperatorSelector,
  ShadcnValueEditor,
  ValidatedInput,
} from '../index';

const schema: FieldSchema[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    operators: [{ name: 'equals', label: 'equals', arity: 'binary' }],
  },
  {
    name: 'age',
    label: 'Age',
    type: 'number',
    operators: [{ name: 'gt', label: '>', arity: 'binary' }],
  },
];

const wideSchema: FieldSchema[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    operators: [
      { name: 'equals', label: 'equals', arity: 'binary' },
      { name: 'contains', label: 'contains', arity: 'binary' },
    ],
  },
  {
    name: 'age',
    label: 'Age',
    type: 'number',
    operators: [
      { name: 'gt', label: '>', arity: 'binary' },
      { name: 'between', label: 'between', arity: 'ternary' },
    ],
  },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    values: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ],
  },
  {
    name: 'tags',
    label: 'Tags',
    type: 'multiSelect',
    values: [
      { value: 'vip', label: 'VIP' },
      { value: 'trial', label: 'Trial' },
    ],
  },
  { name: 'enabled', label: 'Enabled', type: 'boolean' },
  {
    name: 'createdAt',
    label: 'Created at',
    type: 'date',
    operators: [
      { name: 'equals', label: 'equals', arity: 'binary' },
      { name: 'between', label: 'between', arity: 'ternary' },
    ],
  },
  {
    name: 'nickname',
    label: 'Nickname',
    type: 'text',
    operators: [{ name: 'isEmpty', label: 'is empty', arity: 'unary' }],
  },
  { name: 'emptyStatus', label: 'Empty status', type: 'select' },
  { name: 'emptyTags', label: 'Empty tags', type: 'multiSelect' },
];

function singleRuleFilter(rule: FilterRule): Filter {
  return { id: 'root', combinator: 'and', children: [rule] };
}

test('ShadcnFilterBuilder renders custom ValueEditor slot', () => {
  render(
    <ShadcnFilterBuilder
      schema={schema}
      defaultValue={{
        id: 'root',
        combinator: 'and',
        children: [{ id: 'r1', field: 'name', operator: 'equals', value: 'Ada' }],
      }}
      slots={{ ValueEditor: () => <div>Custom value</div> }}
    />
  );

  expect(screen.getByText('Custom value')).not.toBeNull();
});

test('ShadcnFilterBuilder passes external validation errors to rule slots', () => {
  const errors: Record<string, ValidationError[]> = {
    r1: [{ type: 'invalidValue', message: 'Name is invalid' }],
  };

  render(
    <ShadcnFilterBuilder
      schema={schema}
      defaultValue={{
        id: 'root',
        combinator: 'and',
        children: [{ id: 'r1', field: 'name', operator: 'equals', value: 'Ada' }],
      }}
      errors={errors}
      slots={{
        Rule: ({ rule }) => <div>{rule.errors[0]?.message ?? 'No errors'}</div>,
      }}
    />
  );

  expect(screen.getByText('Name is invalid')).not.toBeNull();
});

test('ShadcnFilterBuilder renders inline validation on the atomic value editor', () => {
  const errors: Record<string, ValidationError[]> = {
    r1: [{ type: 'missingValue', message: 'Value is required' }],
  };

  render(
    <ShadcnFilterBuilder
      schema={schema}
      defaultValue={singleRuleFilter({ id: 'r1', field: 'name', operator: 'equals', value: '' })}
      errors={errors}
    />
  );

  const valueInput = screen.getByRole('textbox', { name: 'Value' });
  const message = screen.getByText('Value is required');

  expect(valueInput.getAttribute('aria-invalid')).toBe('true');
  expect(valueInput.className).toContain('border-destructive');
  expect(message.getAttribute('id')).toBe('r1-errors');
  expect(valueInput.getAttribute('aria-describedby')).toBe('r1-errors');
});

test('ShadcnFilterBuilder leaves the value editor unmarked when a rule is valid', () => {
  render(
    <ShadcnFilterBuilder
      schema={schema}
      defaultValue={singleRuleFilter({
        id: 'r1',
        field: 'name',
        operator: 'equals',
        value: 'Ada',
      })}
    />
  );

  const valueInput = screen.getByRole('textbox', { name: 'Value' });
  expect(valueInput.getAttribute('aria-invalid')).toBeNull();
  expect(valueInput.getAttribute('aria-describedby')).toBeNull();
  expect(valueInput.className).not.toContain('border-destructive');
});

test('ShadcnFilterBuilder applies classNames and custom action labels', () => {
  const onChange = jest.fn();
  const { container } = render(
    <ShadcnFilterBuilder
      schema={schema}
      onChange={onChange}
      defaultValue={{
        id: 'root',
        combinator: 'and',
        children: [
          { id: 'r1', field: 'age', operator: 'gt', value: 41 },
          { id: 'g1', combinator: 'or', children: [] },
        ],
      }}
      labels={{
        addRule: 'New condition',
        addGroup: 'New group',
        removeRule: 'Delete condition',
      }}
      classNames={{
        root: 'builder-root',
        group: 'builder-group',
        rule: 'builder-rule',
        fieldSelector: 'builder-field',
        operatorSelector: 'builder-operator',
        valueEditor: 'builder-value',
        actions: 'builder-actions',
      }}
    />
  );

  expect(container.querySelector('.builder-root')).not.toBeNull();
  expect(container.querySelector('.builder-group')).not.toBeNull();
  expect(container.querySelector('.builder-rule')).not.toBeNull();
  expect(container.querySelector('.builder-field')).not.toBeNull();
  expect(container.querySelector('.builder-operator')).not.toBeNull();
  expect(container.querySelector('.builder-value')).not.toBeNull();
  expect(container.querySelector('.builder-actions')).not.toBeNull();
  expect(screen.getAllByRole('button', { name: 'New condition' })).toHaveLength(2);
  expect(screen.getAllByRole('button', { name: 'New group' })).toHaveLength(2);
  expect(screen.getByRole('button', { name: 'Delete condition' })).not.toBeNull();

  fireEvent.click(screen.getAllByRole('checkbox', { name: 'Not' })[0]);
  fireEvent.change(screen.getAllByRole('combobox', { name: 'Combinator' })[0], {
    target: { value: 'or' },
  });
  fireEvent.click(screen.getAllByRole('button', { name: 'New condition' })[0]);
  fireEvent.click(screen.getAllByRole('button', { name: 'New group' })[0]);
  fireEvent.click(screen.getAllByRole('button', { name: 'Remove group' })[0]);

  const ruleControls = screen.getByRole('group', { name: 'Rule Age >' });
  fireEvent.click(within(ruleControls).getByRole('checkbox', { name: 'Not' }));
  fireEvent.change(within(ruleControls).getByRole('combobox', { name: 'Field' }), {
    target: { value: 'name' },
  });
  fireEvent.change(within(ruleControls).getByRole('combobox', { name: 'Operator' }), {
    target: { value: 'equals' },
  });
  fireEvent.change(within(ruleControls).getByRole('textbox', { name: 'Value' }), {
    target: { value: '42' },
  });
  fireEvent.click(within(ruleControls).getByRole('button', { name: 'Delete condition' }));

  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ not: true }));
  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({
      children: expect.arrayContaining([expect.objectContaining({ field: 'name' })]),
    })
  );
});

test('ShadcnFilterBuilder wires Root, Group, Rule, FieldSelector, and OperatorSelector slots', () => {
  const onChange = jest.fn();
  render(
    <ShadcnFilterBuilder
      schema={schema}
      defaultValue={{
        id: 'root',
        combinator: 'and',
        children: [{ id: 'r1', field: 'name', operator: 'equals', value: 'Ada' }],
      }}
      onChange={onChange}
      slots={{
        Root: ({ actions, children }) => (
          <div>
            <button type="button" onClick={() => actions.canDrop('r1', 'root')}>
              Check root drop
            </button>
            <button type="button" onClick={() => actions.canDrop('root', 'root')}>
              Check root group drop
            </button>
            {children}
          </div>
        ),
        Group: ({ group, children }) => (
          <section aria-label={`Custom ${group.id}`}>{children}</section>
        ),
        Rule: ({ rule }) => <div>Rule slot {rule.id}</div>,
      }}
    />
  );

  fireEvent.click(screen.getByRole('button', { name: 'Check root drop' }));
  fireEvent.click(screen.getByRole('button', { name: 'Check root group drop' }));

  expect(screen.getByLabelText('Custom root')).not.toBeNull();
  expect(screen.getByText('Rule slot r1')).not.toBeNull();

  render(
    <ShadcnFilterBuilder
      schema={schema}
      defaultValue={{
        id: 'root',
        combinator: 'and',
        children: [{ id: 'r2', field: 'name', operator: 'equals', value: 'Ada' }],
      }}
      slots={{
        FieldSelector: ({ rule, actions }) => (
          <button type="button" onClick={() => actions.updateRule(rule.id, { field: 'age' })}>
            Field slot
          </button>
        ),
        OperatorSelector: ({ rule, actions }) => (
          <button type="button" onClick={() => actions.updateRule(rule.id, { operator: 'gt' })}>
            Operator slot
          </button>
        ),
      }}
      onChange={onChange}
    />
  );

  fireEvent.click(screen.getByRole('button', { name: 'Field slot' }));
  fireEvent.click(screen.getByRole('button', { name: 'Operator slot' }));

  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({
      children: [expect.objectContaining({ id: 'r2', field: 'age' })],
    })
  );
  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({
      children: [expect.objectContaining({ id: 'r2', operator: 'gt' })],
    })
  );
});

test('ShadcnFilterBuilder renders default value editors for supported field types', () => {
  const onChange = jest.fn();
  const { rerender } = render(
    <ShadcnFilterBuilder
      schema={wideSchema}
      value={singleRuleFilter({ id: 'number', field: 'age', operator: 'gt', value: 41 })}
      onChange={onChange}
    />
  );

  fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '42' } });
  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({
      children: [expect.objectContaining({ id: 'number', value: 42 })],
    })
  );

  rerender(
    <ShadcnFilterBuilder
      schema={wideSchema}
      value={singleRuleFilter({
        id: 'number-between',
        field: 'age',
        operator: 'between',
        value: [18, 65],
      })}
      onChange={onChange}
    />
  );
  const numberRangeInputs = screen.getAllByRole('spinbutton');
  expect(numberRangeInputs).toHaveLength(2);
  fireEvent.change(numberRangeInputs[0], { target: { value: '21' } });
  fireEvent.change(numberRangeInputs[1], { target: { value: '60' } });
  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({
      children: [expect.objectContaining({ id: 'number-between', value: [21, 65] })],
    })
  );
  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({
      children: [expect.objectContaining({ id: 'number-between', value: [18, 60] })],
    })
  );

  rerender(
    <ShadcnFilterBuilder
      schema={wideSchema}
      value={singleRuleFilter({
        id: 'date-between',
        field: 'createdAt',
        operator: 'between',
        value: ['2026-05-01', '2026-05-31'],
      })}
      onChange={onChange}
    />
  );
  fireEvent.change(screen.getByLabelText('Start value'), { target: { value: '2026-05-03' } });
  fireEvent.change(screen.getByLabelText('End value'), { target: { value: '2026-05-28' } });
  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({
      children: [
        expect.objectContaining({ id: 'date-between', value: ['2026-05-03', '2026-05-31'] }),
      ],
    })
  );
  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({
      children: [
        expect.objectContaining({ id: 'date-between', value: ['2026-05-01', '2026-05-28'] }),
      ],
    })
  );

  rerender(
    <ShadcnFilterBuilder
      schema={wideSchema}
      value={singleRuleFilter({
        id: 'status',
        field: 'status',
        operator: 'equals',
        value: 'active',
      })}
      onChange={onChange}
    />
  );
  fireEvent.change(screen.getByRole('combobox', { name: 'Value' }), {
    target: { value: 'inactive' },
  });
  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({
      children: [expect.objectContaining({ id: 'status', value: 'inactive' })],
    })
  );

  rerender(
    <ShadcnFilterBuilder
      schema={wideSchema}
      value={singleRuleFilter({
        id: 'tags',
        field: 'tags',
        operator: 'contains',
        value: ['vip'],
      })}
      onChange={onChange}
    />
  );
  const multiSelect = screen.getByRole('listbox', { name: 'Value' }) as HTMLSelectElement;
  multiSelect.options[0].selected = true;
  multiSelect.options[1].selected = true;
  fireEvent.change(multiSelect);
  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({
      children: [expect.objectContaining({ id: 'tags', value: ['vip', 'trial'] })],
    })
  );

  rerender(
    <ShadcnFilterBuilder
      schema={wideSchema}
      value={singleRuleFilter({
        id: 'enabled',
        field: 'enabled',
        operator: 'equals',
        value: false,
      })}
      onChange={onChange}
    />
  );
  fireEvent.click(screen.getByRole('checkbox', { name: 'Value' }));
  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({
      children: [expect.objectContaining({ id: 'enabled', value: true })],
    })
  );

  rerender(
    <ShadcnFilterBuilder
      schema={wideSchema}
      value={singleRuleFilter({
        id: 'created',
        field: 'createdAt',
        operator: 'equals',
        value: '2026-05-27',
      })}
      onChange={onChange}
    />
  );
  fireEvent.change(screen.getByLabelText('Value'), { target: { value: '2026-05-28' } });
  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({
      children: [expect.objectContaining({ id: 'created', value: '2026-05-28' })],
    })
  );

  rerender(
    <ShadcnFilterBuilder
      schema={wideSchema}
      value={singleRuleFilter({
        id: 'nickname',
        field: 'nickname',
        operator: 'isEmpty',
        value: undefined,
      })}
      onChange={onChange}
    />
  );
  expect(screen.getByLabelText('Value')).toHaveProperty('disabled', true);

  rerender(
    <ShadcnFilterBuilder
      schema={wideSchema}
      value={singleRuleFilter({
        id: 'missing',
        field: 'missing',
        operator: 'equals',
        value: 123,
      })}
      onChange={onChange}
    />
  );
  fireEvent.change(screen.getByDisplayValue('123'), { target: { value: 'fallback' } });
  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({
      children: [expect.objectContaining({ id: 'missing', value: 'fallback' })],
    })
  );

  rerender(
    <ShadcnFilterBuilder
      schema={wideSchema}
      value={singleRuleFilter({
        id: 'empty-status',
        field: 'emptyStatus',
        operator: 'equals',
        value: '',
      })}
      onChange={onChange}
    />
  );
  expect(screen.getByRole('combobox', { name: 'Value' })).not.toBeNull();

  rerender(
    <ShadcnFilterBuilder
      schema={wideSchema}
      value={singleRuleFilter({
        id: 'empty-tags',
        field: 'emptyTags',
        operator: 'contains',
        value: 'vip',
      })}
      onChange={onChange}
    />
  );
  expect(screen.getByRole('listbox', { name: 'Value' })).not.toBeNull();
});

test('ShadcnFilterBuilder export coexists with legacy ValidatedInput export', () => {
  render(<ValidatedInput placeholder="Filter" onChange={jest.fn()} />);

  fireEvent.change(screen.getByPlaceholderText('Filter'), { target: { value: 'valid' } });

  expect(screen.getByPlaceholderText('Filter').className).toContain('valid');
  // Each export is either a plain function (helpers like `cn`) or a React
  // component — including memoized components (`React.memo` returns an exotic
  // object with a `$$typeof` marker, not a function).
  expect(
    [
      Button,
      Card,
      Checkbox,
      Input,
      Select,
      ShadcnCombinatorSelector,
      ShadcnFieldSelector,
      ShadcnFilterBuilder,
      ShadcnFilterGroup,
      ShadcnFilterRule,
      ShadcnNotToggle,
      ShadcnOperatorSelector,
      ShadcnValueEditor,
      cn,
    ].every(
      (exported) =>
        typeof exported === 'function' ||
        (typeof exported === 'object' && exported !== null && '$$typeof' in exported)
    )
  ).toBe(true);
});

describe('ShadcnFilterBuilder IC (inline combinator) mode', () => {
  const icFilter: FilterIC = {
    id: 'root',
    children: [
      { id: 'r1', field: 'name', operator: 'equals', value: 'Ada' },
      'and',
      { id: 'r2', field: 'name', operator: 'equals', value: 'Bob' },
      'or',
      { id: 'r3', field: 'name', operator: 'equals', value: 'Cay' },
    ],
  };

  const asIC = (filter: unknown): FilterIC => filter as FilterIC;

  test('ShadcnInlineCombinator renders AND/OR and reports changes', () => {
    const onChange = jest.fn();
    render(<ShadcnInlineCombinator value="and" onChange={onChange} />);

    const select = screen.getByRole('combobox', { name: 'Inline combinator' });
    expect((select as HTMLSelectElement).value).toBe('and');

    fireEvent.change(select, { target: { value: 'or' } });
    expect(onChange).toHaveBeenCalledWith('or');
  });

  test('renders one inline combinator per gap and hides the group-level combinator', () => {
    render(<ShadcnFilterBuilder schema={schema} mode="ic" value={icFilter} onChange={jest.fn()} />);

    const combinators = screen.getAllByRole('combobox', { name: 'Inline combinator' });
    expect(combinators).toHaveLength(2);
    expect((combinators[0] as HTMLSelectElement).value).toBe('and');
    expect((combinators[1] as HTMLSelectElement).value).toBe('or');
    // group-level combinator selector should be absent in IC mode
    expect(screen.queryByRole('combobox', { name: 'Combinator' })).toBeNull();
  });

  test('changing one inline combinator emits an IC filter with only that slot updated', () => {
    const onChange = jest.fn();
    render(<ShadcnFilterBuilder schema={schema} mode="ic" value={icFilter} onChange={onChange} />);

    const combinators = screen.getAllByRole('combobox', { name: 'Inline combinator' });
    fireEvent.change(combinators[1], { target: { value: 'and' } });

    expect(onChange).toHaveBeenCalledTimes(1);
    const next = asIC(onChange.mock.calls[0][0]);
    expect(next.children[1]).toBe('and');
    expect(next.children[3]).toBe('and');
  });

  test('uncontrolled IC mode adds rules separated by inline combinators', () => {
    const emptyIC: FilterIC = { id: 'root', children: [] };
    render(<ShadcnFilterBuilder schema={schema} mode="ic" defaultValue={emptyIC} />);

    expect(screen.queryAllByRole('combobox', { name: 'Inline combinator' })).toHaveLength(0);

    const addRule = screen.getByRole('button', { name: 'Add rule' });
    fireEvent.click(addRule);
    fireEvent.click(addRule);

    expect(screen.getAllByRole('combobox', { name: 'Inline combinator' })).toHaveLength(1);
  });
});
