import { fireEvent, render, screen, within } from '@testing-library/react';
import type { FieldSchema, FilterGroup, FilterRule } from '@x-filter/core';
import {
  ShadcnCombinatorSelector,
  ShadcnFieldSelector,
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
  { name: 'createdAt', label: 'Created at', type: 'date' },
  { name: 'emptyStatus', label: 'Empty status', type: 'select' },
  { name: 'emptyTags', label: 'Empty tags', type: 'multiSelect' },
  {
    name: 'nickname',
    label: 'Nickname',
    type: 'text',
    operators: [{ name: 'isEmpty', label: 'is empty', arity: 'unary' }],
  },
];

const rule: FilterRule = { id: 'r1', field: 'name', operator: 'equals', value: 'Ada' };

describe('shadcn atomic components', () => {
  test('ShadcnFieldSelector renders field options and emits field changes', () => {
    const onChange = jest.fn();
    render(<ShadcnFieldSelector schema={schema} rule={rule} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText(/field/i), { target: { value: 'age' } });

    expect(onChange).toHaveBeenCalledWith('age');
  });

  test('ShadcnOperatorSelector renders operators for selected field', () => {
    const onChange = jest.fn();
    render(<ShadcnOperatorSelector schema={schema} rule={rule} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText(/operator/i), { target: { value: 'contains' } });

    expect(onChange).toHaveBeenCalledWith('contains');
  });

  test('ShadcnValueEditor emits text value changes', () => {
    const onChange = jest.fn();
    render(<ShadcnValueEditor schema={schema} rule={rule} onChange={onChange} />);

    fireEvent.change(screen.getByDisplayValue('Ada'), { target: { value: 'Grace' } });

    expect(onChange).toHaveBeenCalledWith('Grace');
  });

  test('ShadcnValueEditor supports number, select, multi-select, boolean, and date values', () => {
    const onNumberChange = jest.fn();
    const { rerender } = render(
      <ShadcnValueEditor
        schema={schema}
        rule={{ id: 'r2', field: 'age', operator: 'gt', value: 41 }}
        onChange={onNumberChange}
      />
    );

    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '42' } });
    expect(onNumberChange).toHaveBeenCalledWith(42);

    const onSelectChange = jest.fn();
    rerender(
      <ShadcnValueEditor
        schema={schema}
        rule={{ id: 'r3', field: 'status', operator: 'equals', value: 'active' }}
        onChange={onSelectChange}
      />
    );
    fireEvent.change(screen.getByLabelText(/value/i), { target: { value: 'inactive' } });
    expect(onSelectChange).toHaveBeenCalledWith('inactive');

    const onMultiSelectChange = jest.fn();
    rerender(
      <ShadcnValueEditor
        schema={schema}
        rule={{ id: 'r4', field: 'tags', operator: 'contains', value: ['vip'] }}
        onChange={onMultiSelectChange}
      />
    );
    const multiSelect = screen.getByLabelText(/value/i) as HTMLSelectElement;
    multiSelect.options[0].selected = true;
    multiSelect.options[1].selected = true;
    fireEvent.change(multiSelect);
    expect(onMultiSelectChange).toHaveBeenCalledWith(['vip', 'trial']);

    const onBooleanChange = jest.fn();
    rerender(
      <ShadcnValueEditor
        schema={schema}
        rule={{ id: 'r5', field: 'enabled', operator: 'equals', value: false }}
        onChange={onBooleanChange}
      />
    );
    fireEvent.click(screen.getByRole('checkbox', { name: 'Value' }));
    expect(onBooleanChange).toHaveBeenCalledWith(true);

    const onDateChange = jest.fn();
    rerender(
      <ShadcnValueEditor
        schema={schema}
        rule={{ id: 'r6', field: 'createdAt', operator: 'equals', value: '2026-05-28' }}
        onChange={onDateChange}
      />
    );
    fireEvent.change(screen.getByLabelText('Value'), { target: { value: '2026-05-29' } });
    expect(onDateChange).toHaveBeenCalledWith('2026-05-29');
  });

  test('ShadcnValueEditor renders two number inputs for between operators', () => {
    const onChange = jest.fn();
    render(
      <ShadcnValueEditor
        schema={schema}
        rule={{ id: 'r-between-number', field: 'age', operator: 'between', value: [18, 65] }}
        onChange={onChange}
      />
    );

    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs).toHaveLength(2);

    fireEvent.change(inputs[0], { target: { value: '21' } });
    expect(onChange).toHaveBeenCalledWith([21, 65]);

    fireEvent.change(inputs[1], { target: { value: '60' } });
    expect(onChange).toHaveBeenCalledWith([18, 60]);
  });

  test('ShadcnValueEditor renders two date inputs for between operators', () => {
    const onChange = jest.fn();
    render(
      <ShadcnValueEditor
        schema={schema}
        rule={{
          id: 'r-between-date',
          field: 'createdAt',
          operator: 'between',
          value: ['2026-05-01', '2026-05-31'],
        }}
        onChange={onChange}
      />
    );

    fireEvent.change(screen.getByLabelText('Start value'), { target: { value: '2026-05-03' } });
    expect(onChange).toHaveBeenCalledWith(['2026-05-03', '2026-05-31']);

    fireEvent.change(screen.getByLabelText('End value'), { target: { value: '2026-05-28' } });
    expect(onChange).toHaveBeenCalledWith(['2026-05-01', '2026-05-28']);
  });

  test('ShadcnValueEditor falls back safely for unknown fields and unary operators', () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <ShadcnValueEditor
        schema={schema}
        rule={{ id: 'r7', field: 'missing', operator: 'equals', value: 'fallback' }}
        onChange={onChange}
      />
    );

    fireEvent.change(screen.getByDisplayValue('fallback'), { target: { value: 'typed' } });
    expect(onChange).toHaveBeenCalledWith('typed');

    rerender(
      <ShadcnValueEditor
        schema={schema}
        rule={{ id: 'r8', field: 'nickname', operator: 'isEmpty', value: undefined }}
        onChange={onChange}
      />
    );

    expect(screen.getByLabelText('Value')).toHaveProperty('disabled', true);
  });

  test('ShadcnCombinatorSelector and ShadcnNotToggle emit group-level changes', () => {
    const onCombinatorChange = jest.fn();
    const onNotChange = jest.fn();

    render(
      <>
        <ShadcnCombinatorSelector value="and" onChange={onCombinatorChange} />
        <ShadcnNotToggle checked={false} onChange={onNotChange} />
      </>
    );

    fireEvent.change(screen.getByLabelText(/combinator/i), { target: { value: 'or' } });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Not' }));

    expect(onCombinatorChange).toHaveBeenCalledWith('or');
    expect(onNotChange).toHaveBeenCalledWith(true);
  });

  test('ShadcnFilterRule and ShadcnFilterGroup render usable rule and group controls', () => {
    const onRuleChange = jest.fn();
    const onRemoveRule = jest.fn();
    const onCombinatorChange = jest.fn();
    const onNotChange = jest.fn();
    const onAddRule = jest.fn();
    const onAddGroup = jest.fn();
    const onRemoveGroup = jest.fn();
    const group: FilterGroup = {
      id: 'g1',
      combinator: 'and',
      conditions: [rule],
    };

    render(
      <ShadcnFilterGroup
        group={{ kind: 'group', id: 'g1', group, depth: 0, children: [], aria: { label: 'Group' } }}
        onAddRule={onAddRule}
        onAddGroup={onAddGroup}
        onCombinatorChange={onCombinatorChange}
        onNotChange={onNotChange}
        onRemove={onRemoveGroup}
      >
        <ShadcnFilterRule
          schema={schema}
          rule={{
            kind: 'rule',
            id: 'r1',
            rule,
            field: schema[0],
            errors: [],
            aria: { label: 'Rule' },
          }}
          onChange={onRuleChange}
          onRemove={onRemoveRule}
        />
      </ShadcnFilterGroup>
    );

    expect(screen.getByLabelText('Group')).not.toBeNull();
    expect(screen.getByLabelText('Rule')).not.toBeNull();

    const groupControls = screen.getByLabelText('Group');
    fireEvent.change(within(groupControls).getByLabelText(/combinator/i), {
      target: { value: 'or' },
    });
    fireEvent.click(within(groupControls).getAllByRole('checkbox', { name: 'Not' })[0]);
    fireEvent.click(within(groupControls).getByRole('button', { name: 'Add rule' }));
    fireEvent.click(within(groupControls).getByRole('button', { name: 'Add group' }));
    fireEvent.click(within(groupControls).getByRole('button', { name: 'Remove group' }));
    expect(onCombinatorChange).toHaveBeenCalledWith('g1', 'or');
    expect(onNotChange).toHaveBeenCalledWith('g1', true);
    expect(onAddRule).toHaveBeenCalledWith('g1');
    expect(onAddGroup).toHaveBeenCalledWith('g1');
    expect(onRemoveGroup).toHaveBeenCalledWith('g1');

    const ruleControls = screen.getByLabelText('Rule');
    fireEvent.click(within(ruleControls).getByRole('checkbox', { name: 'Not' }));
    fireEvent.change(within(ruleControls).getByLabelText(/field/i), { target: { value: 'age' } });
    fireEvent.change(within(ruleControls).getByLabelText(/operator/i), {
      target: { value: 'contains' },
    });
    fireEvent.change(within(ruleControls).getByDisplayValue('Ada'), {
      target: { value: 'Katherine' },
    });
    fireEvent.click(within(ruleControls).getByRole('button', { name: 'Remove rule' }));

    expect(onRuleChange).toHaveBeenCalledWith('r1', { not: true });
    expect(onRuleChange).toHaveBeenCalledWith('r1', { field: 'age', operator: 'gt', value: null });
    expect(onRuleChange).toHaveBeenCalledWith('r1', { operator: 'contains' });
    expect(onRuleChange).toHaveBeenCalledWith('r1', { value: 'Katherine' });
    expect(onRemoveRule).toHaveBeenCalledWith('r1');
  });

  test('Shadcn components handle optional branches and empty option lists', () => {
    const onChange = jest.fn();
    const { rerender } = render(<ShadcnNotToggle onChange={onChange} />);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Not' }));
    expect(onChange).toHaveBeenCalledWith(true);

    rerender(
      <ShadcnValueEditor
        schema={schema}
        rule={{ id: 'r9', field: 'missing', operator: 'equals', value: 123 }}
        onChange={onChange}
      />
    );
    expect(screen.getByDisplayValue('123')).not.toBeNull();

    rerender(
      <ShadcnValueEditor
        schema={schema}
        rule={{ id: 'r10', field: 'age', operator: 'gt', value: 'not-a-number' }}
        onChange={onChange}
      />
    );
    expect(screen.getByRole('spinbutton')).toHaveProperty('value', '');

    rerender(
      <ShadcnValueEditor
        schema={schema}
        rule={{ id: 'r11', field: 'emptyStatus', operator: 'equals', value: '' }}
        onChange={onChange}
      />
    );
    expect(screen.getByRole('combobox', { name: 'Value' })).not.toBeNull();

    rerender(
      <ShadcnValueEditor
        schema={schema}
        rule={{ id: 'r12', field: 'emptyTags', operator: 'contains', value: 'vip' }}
        onChange={onChange}
      />
    );
    expect(screen.getByRole('listbox', { name: 'Value' })).not.toBeNull();

    const group: FilterGroup = { id: 'g2', combinator: 'or', conditions: [] };
    rerender(
      <ShadcnFilterGroup
        group={{
          kind: 'group',
          id: 'g2',
          group,
          depth: 1,
          children: [],
          aria: { label: 'Empty group' },
        }}
        onAddRule={jest.fn()}
        onAddGroup={jest.fn()}
        onCombinatorChange={jest.fn()}
        onNotChange={jest.fn()}
      />
    );
    expect(screen.getByLabelText('Empty group')).not.toBeNull();
  });

  test('legacy ValidatedInput export remains available', () => {
    const onChange = jest.fn();
    render(<ValidatedInput placeholder="Filter" onChange={onChange} />);

    fireEvent.change(screen.getByPlaceholderText('Filter'), { target: { value: 'valid' } });

    expect(onChange).toHaveBeenCalledWith('valid', true);
  });
});
