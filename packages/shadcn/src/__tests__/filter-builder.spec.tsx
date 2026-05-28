import { fireEvent, render, screen, within } from '@testing-library/react';
import type { FieldSchema, Filter, FilterRule, ValidationError } from '@x-filter/core';
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

const filter: Filter = { id: 'root', combinator: 'and', conditions: [] };

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
  return { id: 'root', combinator: 'and', conditions: [rule] };
}

test('ShadcnFilterBuilder adds a rule through the full builder', () => {
  const onChange = jest.fn();
  render(<ShadcnFilterBuilder schema={schema} value={filter} onChange={onChange} />);

  fireEvent.click(screen.getByRole('button', { name: /add rule/i }));

  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({
      conditions: [expect.objectContaining({ field: '' })],
    })
  );
});

test('ShadcnFilterBuilder renders custom ValueEditor slot', () => {
  render(
    <ShadcnFilterBuilder
      schema={schema}
      defaultValue={{
        id: 'root',
        combinator: 'and',
        conditions: [{ id: 'r1', field: 'name', operator: 'equals', value: 'Ada' }],
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
        conditions: [{ id: 'r1', field: 'name', operator: 'equals', value: 'Ada' }],
      }}
      errors={errors}
      slots={{
        Rule: ({ rule }) => <div>{rule.errors[0]?.message ?? 'No errors'}</div>,
      }}
    />
  );

  expect(screen.getByText('Name is invalid')).not.toBeNull();
});

test('ShadcnFilterBuilder emits controlled rule updates', () => {
  const onChange = jest.fn();
  render(
    <ShadcnFilterBuilder
      schema={schema}
      value={{
        id: 'root',
        combinator: 'and',
        conditions: [{ id: 'r1', field: 'name', operator: 'equals', value: 'Ada' }],
      }}
      onChange={onChange}
    />
  );

  fireEvent.change(screen.getByRole('combobox', { name: 'Field' }), {
    target: { value: 'age' },
  });

  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({
      conditions: [expect.objectContaining({ id: 'r1', field: 'age' })],
    })
  );
});

test('ShadcnFilterBuilder forwards default atomic rule controls', () => {
  const onChange = jest.fn();
  render(
    <ShadcnFilterBuilder
      schema={wideSchema}
      value={singleRuleFilter({
        id: 'r1',
        field: 'name',
        operator: 'equals',
        value: 'Ada',
      })}
      onChange={onChange}
    />
  );

  const ruleControls = screen.getByRole('group', { name: 'Rule Name equals' });
  fireEvent.click(within(ruleControls).getByRole('checkbox', { name: 'Not' }));
  fireEvent.change(within(ruleControls).getByRole('combobox', { name: 'Operator' }), {
    target: { value: 'contains' },
  });
  fireEvent.change(within(ruleControls).getByRole('textbox', { name: 'Value' }), {
    target: { value: 'Grace' },
  });
  fireEvent.click(within(ruleControls).getByRole('button', { name: 'Remove rule' }));

  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({
      conditions: [expect.objectContaining({ id: 'r1', not: true })],
    })
  );
  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({
      conditions: [expect.objectContaining({ id: 'r1', operator: 'contains' })],
    })
  );
  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({
      conditions: [expect.objectContaining({ id: 'r1', value: 'Grace' })],
    })
  );
  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ conditions: [] }));
});

test('ShadcnFilterBuilder removes child groups but not the root group', () => {
  const onChange = jest.fn();
  render(
    <ShadcnFilterBuilder
      schema={schema}
      value={{
        id: 'root',
        combinator: 'and',
        conditions: [{ id: 'g1', combinator: 'or', conditions: [] }],
      }}
      onChange={onChange}
    />
  );

  const rootGroup = screen.getByRole('group', { name: 'Filter group root' });
  expect(within(rootGroup).getAllByRole('button', { name: /remove group/i })).toHaveLength(1);

  fireEvent.click(screen.getByRole('button', { name: /remove group/i }));

  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ conditions: [] }));
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
        conditions: [
          { id: 'r1', field: 'age', operator: 'gt', value: 41 },
          { id: 'g1', combinator: 'or', conditions: [] },
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
      conditions: expect.arrayContaining([expect.objectContaining({ field: 'name' })]),
    })
  );
});

test('ShadcnFilterBuilder emits group updates through the default group atomic', () => {
  const onChange = jest.fn();
  render(<ShadcnFilterBuilder schema={schema} value={filter} onChange={onChange} />);

  fireEvent.change(screen.getByRole('combobox', { name: 'Combinator' }), {
    target: { value: 'or' },
  });
  fireEvent.click(screen.getByRole('checkbox', { name: 'Not' }));
  fireEvent.click(screen.getByRole('button', { name: 'Add group' }));

  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ combinator: 'or' }));
  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ not: true }));
  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({
      conditions: [expect.objectContaining({ combinator: 'and' })],
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
        conditions: [{ id: 'r1', field: 'name', operator: 'equals', value: 'Ada' }],
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
        conditions: [{ id: 'r2', field: 'name', operator: 'equals', value: 'Ada' }],
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
      conditions: [expect.objectContaining({ id: 'r2', field: 'age' })],
    })
  );
  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({
      conditions: [expect.objectContaining({ id: 'r2', operator: 'gt' })],
    })
  );
});

test('ShadcnFilterBuilder moveItem slot action moves rules between groups', () => {
  const onChange = jest.fn();
  render(
    <ShadcnFilterBuilder
      schema={schema}
      defaultValue={{
        id: 'root',
        combinator: 'and',
        conditions: [
          { id: 'r1', field: 'name', operator: 'equals', value: 'Ada' },
          { id: 'g1', combinator: 'and', conditions: [] },
        ],
      }}
      onChange={onChange}
      slots={{
        Root: ({ actions, children }) => (
          <div>
            <button
              type="button"
              onClick={() =>
                actions.moveItem({
                  type: 'rule',
                  id: 'r1',
                  targetGroupId: 'g1',
                  targetIndex: 0,
                })
              }
            >
              Move rule
            </button>
            <span>{actions.canDrop('r1', 'missing') ? 'Can drop' : 'Cannot drop'}</span>
            {children}
          </div>
        ),
      }}
    />
  );

  expect(screen.getByText('Cannot drop')).not.toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Move rule' }));

  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({
      conditions: [
        expect.objectContaining({
          id: 'g1',
          conditions: [expect.objectContaining({ id: 'r1' })],
        }),
      ],
    })
  );
});

test('ShadcnFilterBuilder moveItem slot action moves child groups', () => {
  const onChange = jest.fn();
  render(
    <ShadcnFilterBuilder
      schema={schema}
      defaultValue={{
        id: 'root',
        combinator: 'and',
        conditions: [
          { id: 'r1', field: 'name', operator: 'equals', value: 'Ada' },
          { id: 'g1', combinator: 'and', conditions: [] },
        ],
      }}
      onChange={onChange}
      slots={{
        Root: ({ actions, children }) => (
          <div>
            <button
              type="button"
              onClick={() =>
                actions.moveItem({
                  type: 'group',
                  id: 'g1',
                  targetGroupId: 'root',
                  targetIndex: 0,
                })
              }
            >
              Move group
            </button>
            {children}
          </div>
        ),
      }}
    />
  );

  fireEvent.click(screen.getByRole('button', { name: 'Move group' }));

  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({
      conditions: [expect.objectContaining({ id: 'g1' }), expect.objectContaining({ id: 'r1' })],
    })
  );
});

test('ShadcnFilterBuilder canDrop rejects missing drag ids and group descendant targets', () => {
  render(
    <ShadcnFilterBuilder
      schema={schema}
      defaultValue={{
        id: 'root',
        combinator: 'and',
        conditions: [
          {
            id: 'g1',
            combinator: 'and',
            conditions: [
              {
                id: 'g2',
                combinator: 'or',
                conditions: [{ id: 'r1', field: 'name', operator: 'equals', value: 'Ada' }],
              },
            ],
          },
        ],
      }}
      slots={{
        Root: ({ actions, children }) => (
          <div>
            <span>
              {actions.canDrop('missing', 'root') ? 'missing allowed' : 'missing rejected'}
            </span>
            <span>
              {actions.canDrop('g1', 'g2') ? 'descendant allowed' : 'descendant rejected'}
            </span>
            {children}
          </div>
        ),
      }}
    />
  );

  expect(screen.getByText('missing rejected')).not.toBeNull();
  expect(screen.getByText('descendant rejected')).not.toBeNull();
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
      conditions: [expect.objectContaining({ id: 'number', value: 42 })],
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
      conditions: [expect.objectContaining({ id: 'number-between', value: [21, 65] })],
    })
  );
  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({
      conditions: [expect.objectContaining({ id: 'number-between', value: [18, 60] })],
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
      conditions: [
        expect.objectContaining({ id: 'date-between', value: ['2026-05-03', '2026-05-31'] }),
      ],
    })
  );
  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({
      conditions: [
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
      conditions: [expect.objectContaining({ id: 'status', value: 'inactive' })],
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
      conditions: [expect.objectContaining({ id: 'tags', value: ['vip', 'trial'] })],
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
      conditions: [expect.objectContaining({ id: 'enabled', value: true })],
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
      conditions: [expect.objectContaining({ id: 'created', value: '2026-05-28' })],
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
      conditions: [expect.objectContaining({ id: 'missing', value: 'fallback' })],
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
    ].every((exported) => typeof exported === 'function')
  ).toBe(true);
});
