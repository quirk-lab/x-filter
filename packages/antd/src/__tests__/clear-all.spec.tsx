import { fireEvent, render, screen } from '@testing-library/react';
import type { FieldSchema, Filter } from '@x-filter/core';
import { AntdFilterBuilder } from '../index';

const schema: FieldSchema[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    operators: [{ name: 'equals', label: 'equals', arity: 'binary' }],
  },
];

const withRules: Filter = {
  id: 'root',
  combinator: 'and',
  children: [{ id: 'r1', field: 'name', operator: 'equals', value: 'Ada' }],
};

const empty: Filter = { id: 'root', combinator: 'and', children: [] };

describe('AntdFilterBuilder clear all', () => {
  test('clear all requires a confirm step before emptying the filter', () => {
    const onChange = jest.fn();
    render(<AntdFilterBuilder schema={schema} defaultValue={withRules} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm clear' }));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'root', combinator: 'and', children: [] })
    );
  });

  test('cancel aborts the clear', () => {
    const onChange = jest.fn();
    render(<AntdFilterBuilder schema={schema} defaultValue={withRules} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Clear all' })).not.toBeNull();
  });

  test('clear all is disabled when there is nothing to clear', () => {
    render(<AntdFilterBuilder schema={schema} defaultValue={empty} />);
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Clear all' }).disabled).toBe(
      true
    );
  });

  test('shows an empty-state guide whose CTA adds the first rule', () => {
    const onChange = jest.fn();
    render(<AntdFilterBuilder schema={schema} defaultValue={empty} onChange={onChange} />);

    expect(screen.getByText('No filters yet')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Add your first rule' }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        children: [expect.objectContaining({ id: expect.any(String) })],
      })
    );
  });

  test('read-only hides the clear toolbar and empty-state guide', () => {
    render(<AntdFilterBuilder readOnly schema={schema} defaultValue={empty} />);

    expect(screen.queryByRole('button', { name: 'Clear all' })).toBeNull();
    expect(screen.queryByText('No filters yet')).toBeNull();
  });
});
