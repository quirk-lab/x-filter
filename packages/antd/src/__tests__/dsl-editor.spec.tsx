import { fireEvent, render, screen, within } from '@testing-library/react';
import type { FieldSchema, Filter } from '@x-filter/core';
import { AntdFilterBuilder } from '../index';

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

test('AntdFilterBuilder commits valid DSL and shows parse errors for invalid DSL', () => {
  const onChange = jest.fn();
  render(<AntdFilterBuilder schema={schema} value={filter} onChange={onChange} dsl />);

  fireEvent.change(screen.getByLabelText(/dsl/i), { target: { value: 'status:equals:open' } });
  fireEvent.click(screen.getByRole('button', { name: /apply dsl/i }));

  expect(onChange).toHaveBeenCalled();

  fireEvent.change(screen.getByLabelText(/dsl/i), { target: { value: '@@@' } });
  fireEvent.click(screen.getByRole('button', { name: /apply dsl/i }));

  expect(screen.getByText(/unexpected/i)).not.toBeNull();
});

test('AntdFilterBuilder renders field, operator, and value completions with listbox roles', () => {
  render(<AntdFilterBuilder schema={schema} value={filter} dsl />);

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

test('AntdFilterBuilder applies completions with keyboard navigation and closes with Escape', () => {
  render(<AntdFilterBuilder schema={schema} value={filter} dsl />);

  const input = screen.getByLabelText(/dsl/i);
  fireEvent.focus(input);
  fireEvent.keyDown(input, { key: 'ArrowDown' });
  fireEvent.keyDown(input, { key: 'Enter' });

  expect(input).toHaveProperty('value', 'priority');

  fireEvent.change(input, { target: { value: 'status:' } });
  expect(screen.getByRole('listbox')).not.toBeNull();
  fireEvent.keyDown(input, { key: 'Escape' });

  expect(screen.queryByRole('listbox')).toBeNull();
});

test('AntdFilterBuilder quotes value completions that need DSL string quoting', () => {
  render(<AntdFilterBuilder schema={schema} value={filter} dsl />);

  const input = screen.getByLabelText(/dsl/i);
  fireEvent.change(input, { target: { value: 'status:equals:in' } });
  fireEvent.click(screen.getByRole('option', { name: /in progress/i }));

  expect(input).toHaveProperty('value', 'status:equals:"in progress"');

  fireEvent.change(input, { target: { value: 'status:equals:tr' } });
  fireEvent.click(screen.getByRole('option', { name: /true string/i }));

  expect(input).toHaveProperty('value', 'status:equals:"true"');
});

test('AntdFilterBuilder omits DSL input unless dsl is true', () => {
  const { rerender } = render(<AntdFilterBuilder schema={schema} value={filter} />);

  expect(screen.queryByLabelText(/dsl/i)).toBeNull();

  rerender(<AntdFilterBuilder schema={schema} value={filter} dsl={false} />);

  expect(screen.queryByLabelText(/dsl/i)).toBeNull();
});

test('AntdFilterBuilder applies DSL editor and completion menu classNames', () => {
  const { container } = render(
    <AntdFilterBuilder
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
