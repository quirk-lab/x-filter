import { fireEvent, render, screen, within } from '@testing-library/react';
import type { FieldSchema, Filter } from '@x-filter/core';
import { ShadcnFilterBuilder } from '../index';

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
      { value: 'in progress', label: 'In progress' },
      { value: 'true', label: 'True string' },
    ],
  },
  {
    name: 'priority',
    label: 'Priority',
    type: 'select',
    operators: [{ name: 'equals', label: 'equals', arity: 'binary' }],
    values: [{ value: 'high', label: 'High' }],
  },
];

const filter: Filter = { id: 'root', combinator: 'and', conditions: [] };

test('ShadcnFilterBuilder commits valid DSL and shows parse errors for invalid DSL', () => {
  const onChange = jest.fn();
  render(<ShadcnFilterBuilder schema={schema} value={filter} onChange={onChange} dsl />);

  fireEvent.change(screen.getByLabelText(/dsl/i), { target: { value: 'status:equals:open' } });
  fireEvent.click(screen.getByRole('button', { name: /apply dsl/i }));

  expect(onChange).toHaveBeenCalled();

  fireEvent.change(screen.getByLabelText(/dsl/i), { target: { value: '@@@' } });
  fireEvent.click(screen.getByRole('button', { name: /apply dsl/i }));

  expect(screen.getByText(/unexpected/i)).not.toBeNull();
});

test('ShadcnFilterBuilder renders field, operator, and value completions with listbox roles', () => {
  render(<ShadcnFilterBuilder schema={schema} value={filter} dsl />);

  const input = screen.getByLabelText(/dsl/i);
  fireEvent.focus(input);

  expect(screen.getByRole('listbox')).not.toBeNull();
  expect(screen.getByRole('option', { name: /status/i })).not.toBeNull();
  expect(screen.getByRole('option', { name: /priority/i })).not.toBeNull();

  fireEvent.change(input, { target: { value: 'status:' } });
  expect(screen.getByRole('option', { name: /^equals/i })).not.toBeNull();
  expect(screen.getByRole('option', { name: /not equals/i })).not.toBeNull();

  fireEvent.change(input, { target: { value: 'status:equals:' } });
  expect(screen.getByRole('option', { name: /open/i })).not.toBeNull();
  expect(screen.getByRole('option', { name: /closed/i })).not.toBeNull();
});

test('ShadcnFilterBuilder omits DSL input unless dsl is true', () => {
  const { rerender } = render(<ShadcnFilterBuilder schema={schema} value={filter} />);

  expect(screen.queryByLabelText(/dsl/i)).toBeNull();

  rerender(<ShadcnFilterBuilder schema={schema} value={filter} dsl={false} />);

  expect(screen.queryByLabelText(/dsl/i)).toBeNull();
});

test('ShadcnFilterBuilder applies DSL editor and completion menu classNames', () => {
  const { container } = render(
    <ShadcnFilterBuilder
      schema={schema}
      value={filter}
      dsl
      classNames={{ dslEditor: 'custom-dsl-editor', completionMenu: 'custom-completion-menu' }}
    />
  );

  fireEvent.focus(screen.getByLabelText(/dsl/i));

  expect(container.querySelector('.custom-dsl-editor')).not.toBeNull();
  expect(within(container).getByRole('listbox').className).toContain('custom-completion-menu');
});
