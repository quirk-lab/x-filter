import { render, screen } from '@testing-library/react';
import type { FieldSchema, Filter, ValidationError } from '@x-filter/core';
import { ShadcnFilterBuilder } from '../index';

const { axe } = jest.requireActual('jest-axe') as {
  axe: (container: Element) => Promise<unknown>;
};

function expectNoAxeViolations(results: unknown) {
  (
    expect(results) as unknown as jest.Matchers<void> & { toHaveNoViolations(): void }
  ).toHaveNoViolations();
}

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
    operators: [{ name: 'gt', label: '>', arity: 'binary' }],
  },
];

const filter: Filter = {
  id: 'root',
  combinator: 'and',
  children: [
    { id: 'r1', field: 'name', operator: 'equals', value: 'Ada' },
    {
      id: 'g1',
      combinator: 'or',
      children: [{ id: 'r2', field: 'age', operator: 'gt', value: 30 }],
    },
  ],
};

const rangeSchema: FieldSchema[] = [
  {
    name: 'age',
    label: 'Age',
    type: 'number',
    operators: [{ name: 'between', label: 'between', arity: 'ternary' }],
  },
  {
    name: 'createdAt',
    label: 'Created at',
    type: 'date',
    operators: [{ name: 'between', label: 'between', arity: 'ternary' }],
  },
];

const rangeFilter: Filter = {
  id: 'root',
  combinator: 'and',
  children: [
    { id: 'age-range', field: 'age', operator: 'between', value: [18, 65] },
    {
      id: 'created-range',
      field: 'createdAt',
      operator: 'between',
      value: ['2026-01-01', '2026-12-31'],
    },
  ],
};

test('ShadcnFilterBuilder has no obvious accessibility violations with DSL and DnD enabled', async () => {
  const { container } = render(
    <ShadcnFilterBuilder schema={schema} value={filter} onChange={jest.fn()} dsl dnd />
  );

  expectNoAxeViolations(await axe(container));
}, 30000);

test('ShadcnFilterBuilder gives ternary value inputs distinct accessible names', () => {
  render(<ShadcnFilterBuilder schema={rangeSchema} value={rangeFilter} onChange={jest.fn()} />);

  expect(screen.getAllByLabelText('Start value')).toHaveLength(2);
  expect(screen.getAllByLabelText('End value')).toHaveLength(2);
  expect(screen.queryAllByLabelText('Value')).toHaveLength(0);
});

test('ShadcnFilterBuilder associates inline validation errors for assistive tech', async () => {
  const errors: Record<string, ValidationError[]> = {
    r1: [{ type: 'missingValue', message: 'Value is required' }],
  };

  const { container } = render(
    <ShadcnFilterBuilder schema={schema} value={filter} onChange={jest.fn()} errors={errors} />
  );

  const valueInput = screen.getByRole('textbox', { name: 'Value' });
  expect(valueInput.getAttribute('aria-invalid')).toBe('true');
  expect(valueInput.getAttribute('aria-describedby')).toBe('r1-errors');
  expect(screen.getByText('Value is required').getAttribute('id')).toBe('r1-errors');

  expectNoAxeViolations(await axe(container));
}, 30000);
