import { render, screen } from '@testing-library/react';
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
  children: [{ id: 'r1', field: 'name', operator: 'equals', value: 'Ada' }],
};

test('rule rows stack vertically on mobile and go horizontal at the sm breakpoint', () => {
  const { container } = render(<ShadcnFilterBuilder schema={schema} value={filter} />);

  const fieldset = container.querySelector('fieldset');
  expect(fieldset).not.toBeNull();
  // Mobile-first: column stack; horizontal row from the `sm` breakpoint up.
  expect(fieldset?.className).toContain('flex-col');
  expect(fieldset?.className).toContain('sm:flex-row');
});

test('drag handle is a touch-friendly target with touch-action disabled', () => {
  render(<ShadcnFilterBuilder dnd schema={schema} value={filter} />);

  const handle = screen.getByRole('button', { name: /drag r1/i });
  expect(handle.className).toContain('touch-none');
  expect(handle.className).toContain('min-h-11');
});
