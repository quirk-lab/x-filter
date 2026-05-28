import { fireEvent, render, screen } from '@testing-library/react';
import type { FieldSchema, Filter } from '@x-filter/core';
import { ShadcnFilterBuilder } from '../index';

const schema: FieldSchema[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    operators: [{ name: 'equals', label: 'equals', arity: 'binary' }],
  },
];

const filter: Filter = {
  id: 'root',
  combinator: 'and',
  conditions: [
    { id: 'r1', field: 'name', operator: 'equals', value: 'Ada' },
    { id: 'r2', field: 'name', operator: 'equals', value: 'Grace' },
  ],
};

function renderWithDnd(onChange = jest.fn()) {
  const props: React.ComponentProps<typeof ShadcnFilterBuilder> & { dnd: boolean } = {
    schema,
    value: filter,
    onChange,
    dnd: true,
  };

  render(<ShadcnFilterBuilder {...props} />);
  return onChange;
}

test('ShadcnFilterBuilder exposes keyboard move action when dnd is enabled', () => {
  const onChange = renderWithDnd();

  fireEvent.click(screen.getByRole('button', { name: /move r2 up/i }));

  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({
      conditions: [expect.objectContaining({ id: 'r2' }), expect.objectContaining({ id: 'r1' })],
    })
  );
});

test('ShadcnFilterBuilder moves a rule down through the DnD adapter boundary', () => {
  const onChange = renderWithDnd();

  fireEvent.click(screen.getByRole('button', { name: /move r1 down/i }));

  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({
      conditions: [expect.objectContaining({ id: 'r2' }), expect.objectContaining({ id: 'r1' })],
    })
  );
});

test('ShadcnFilterBuilder moves a child group through the keyboard fallback', () => {
  const onChange = jest.fn();
  const props: React.ComponentProps<typeof ShadcnFilterBuilder> & { dnd: boolean } = {
    schema,
    value: {
      id: 'root',
      combinator: 'and',
      conditions: [
        { id: 'g1', combinator: 'and', conditions: [] },
        { id: 'g2', combinator: 'and', conditions: [] },
      ],
    },
    onChange,
    dnd: true,
  };
  render(<ShadcnFilterBuilder {...props} />);

  fireEvent.click(screen.getByRole('button', { name: /move g2 up/i }));

  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({
      conditions: [expect.objectContaining({ id: 'g2' }), expect.objectContaining({ id: 'g1' })],
    })
  );
});

test('ShadcnFilterBuilder omits keyboard move controls unless dnd is enabled', () => {
  const { rerender } = render(<ShadcnFilterBuilder schema={schema} value={filter} />);

  expect(screen.queryByRole('button', { name: /move r2 up/i })).toBeNull();

  const props: React.ComponentProps<typeof ShadcnFilterBuilder> & { dnd: boolean } = {
    schema,
    value: filter,
    dnd: false,
  };
  rerender(<ShadcnFilterBuilder {...props} />);

  expect(screen.queryByRole('button', { name: /move r2 up/i })).toBeNull();
});

test('ShadcnFilterBuilder disables invalid edge moves', () => {
  renderWithDnd();

  expect(screen.getByRole<HTMLButtonElement>('button', { name: /move r1 up/i }).disabled).toBe(
    true
  );
  expect(screen.getByRole<HTMLButtonElement>('button', { name: /move r2 down/i }).disabled).toBe(
    true
  );
});
