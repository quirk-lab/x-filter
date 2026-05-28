import { fireEvent, render, screen } from '@testing-library/react';
import type { FieldSchema, Filter } from '@x-filter/core';
import type { ComponentType } from 'react';
import type { FilterBuilderSlots } from '../types';

export interface FilterBuilderAdapterProps {
  schema: FieldSchema[];
  value?: Filter;
  defaultValue?: Filter;
  onChange?: (filter: Filter) => void;
  slots?: FilterBuilderSlots;
}

const schema: FieldSchema[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    operators: [{ name: 'equals', label: 'equals', arity: 'binary' }],
  },
];

const emptyFilter: Filter = { id: 'root', combinator: 'and', conditions: [] };

const ruleFilter: Filter = {
  id: 'root',
  combinator: 'and',
  conditions: [{ id: 'r1', field: 'name', operator: 'equals', value: 'Ada' }],
};

export function runFilterBuilderAdapterContract(
  name: string,
  Builder: ComponentType<FilterBuilderAdapterProps>
) {
  test(`${name}: adds a rule`, () => {
    const onChange = jest.fn();
    render(<Builder schema={schema} value={emptyFilter} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /add rule/i }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        conditions: [expect.objectContaining({ field: '' })],
      })
    );
  });

  test(`${name}: updates a rule value`, () => {
    const onChange = jest.fn();
    render(<Builder schema={schema} value={ruleFilter} onChange={onChange} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Value' }), {
      target: { value: 'Grace' },
    });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        conditions: [expect.objectContaining({ id: 'r1', value: 'Grace' })],
      })
    );
  });

  test(`${name}: supports defaultValue uncontrolled rendering`, () => {
    render(<Builder schema={schema} defaultValue={ruleFilter} />);

    expect(screen.getByDisplayValue('Ada')).not.toBeNull();
  });

  test(`${name}: supports custom ValueEditor slot`, () => {
    const onChange = jest.fn();
    render(
      <Builder
        schema={schema}
        value={ruleFilter}
        onChange={onChange}
        slots={{
          ValueEditor: ({ actions, rule }) => (
            <button
              type="button"
              onClick={() => actions.updateRule(rule.id, { value: 'Slot value' })}
            >
              Custom value editor
            </button>
          ),
        }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Custom value editor' }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        conditions: [expect.objectContaining({ id: 'r1', value: 'Slot value' })],
      })
    );
  });
}
