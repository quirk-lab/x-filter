import { fireEvent, render, screen } from '@testing-library/react';
import type { FieldSchema, Filter } from '@x-filter/core';
import { ShadcnDslTokenInput } from '../index';

const schema: FieldSchema[] = [
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    operators: [
      { name: 'equals', label: 'equals', arity: 'binary' },
      { name: 'notEquals', label: 'not equals', arity: 'binary' },
    ],
    values: [
      { value: 'open', label: 'Open' },
      { value: 'closed', label: 'Closed' },
    ],
  },
  {
    name: 'priority',
    label: 'Priority',
    type: 'number',
    operators: [{ name: 'gt', label: '>', arity: 'binary' }],
  },
];

const emptyFilter: Filter = { id: 'root', combinator: 'and', children: [] };

const singleConditionFilter: Filter = {
  id: 'root',
  combinator: 'and',
  children: [{ id: 'r1', field: 'status', operator: 'equals', value: 'open' }],
};

const twoConditionFilter: Filter = {
  id: 'root',
  combinator: 'and',
  children: [
    { id: 'r1', field: 'status', operator: 'equals', value: 'open' },
    { id: 'r2', field: 'priority', operator: 'gt', value: 5 },
  ],
};

describe('ShadcnDslTokenInput', () => {
  it('renders a condition as field/operator/value chips with a remove control', () => {
    render(
      <ShadcnDslTokenInput filter={singleConditionFilter} schema={schema} onCommit={jest.fn()} />
    );

    expect(screen.getByText('status')).toBeTruthy();
    expect(screen.getByText('equals')).toBeTruthy();
    expect(screen.getByText('open')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Remove status condition' })).toBeTruthy();
  });

  it('renders a combinator chip between conditions', () => {
    render(
      <ShadcnDslTokenInput filter={twoConditionFilter} schema={schema} onCommit={jest.fn()} />
    );

    expect(screen.getByText('AND')).toBeTruthy();
    expect(screen.getByText('priority')).toBeTruthy();
  });

  it('removes a condition when its remove control is clicked (without committing)', () => {
    const onCommit = jest.fn();
    render(
      <ShadcnDslTokenInput filter={singleConditionFilter} schema={schema} onCommit={onCommit} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remove status condition' }));

    expect(screen.queryByText('status')).toBeNull();
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('removes the last chip on Backspace when the input is empty', () => {
    render(
      <ShadcnDslTokenInput filter={singleConditionFilter} schema={schema} onCommit={jest.fn()} />
    );

    const input = screen.getByRole('textbox', { name: 'DSL' });
    fireEvent.keyDown(input, { key: 'Backspace' });

    // value chip dropped, operator chip remains
    expect(screen.queryByText('open')).toBeNull();
    expect(screen.getByText('equals')).toBeTruthy();
  });

  it('tokenizes a value completion into a chip', () => {
    render(<ShadcnDslTokenInput filter={emptyFilter} schema={schema} onCommit={jest.fn()} />);

    const input = screen.getByRole('textbox', { name: 'DSL' });
    fireEvent.change(input, { target: { value: 'status:equals:' } });

    // value completion menu shows option labels
    fireEvent.click(screen.getByRole('option', { name: 'Open' }));

    expect(screen.getByText('status')).toBeTruthy();
    expect(screen.getByText('open')).toBeTruthy();
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('commits the combined draft on Apply', () => {
    const onCommit = jest.fn();
    render(<ShadcnDslTokenInput filter={emptyFilter} schema={schema} onCommit={onCommit} />);

    const input = screen.getByRole('textbox', { name: 'DSL' });
    fireEvent.change(input, { target: { value: 'status:equals:open' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply DSL' }));

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith(
      expect.objectContaining({
        children: [expect.objectContaining({ field: 'status', operator: 'equals', value: 'open' })],
      })
    );
  });

  it('surfaces a parse error for an invalid draft', () => {
    const onCommit = jest.fn();
    render(<ShadcnDslTokenInput filter={emptyFilter} schema={schema} onCommit={onCommit} />);

    const input = screen.getByRole('textbox', { name: 'DSL' });
    fireEvent.change(input, { target: { value: '(' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply DSL' }));

    expect(screen.getByRole('alert')).toBeTruthy();
    expect(onCommit).not.toHaveBeenCalled();
  });
});
