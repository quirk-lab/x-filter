import { render } from '@testing-library/react';
import type { FieldSchema, Filter } from '@x-filter/core';
import { AntdFilterBuilder } from '../index';

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
  conditions: [
    { id: 'r1', field: 'name', operator: 'equals', value: 'Ada' },
    {
      id: 'g1',
      combinator: 'or',
      conditions: [{ id: 'r2', field: 'age', operator: 'gt', value: 30 }],
    },
  ],
};

test('AntdFilterBuilder has no obvious accessibility violations with DSL and DnD enabled', async () => {
  const { container } = render(
    <AntdFilterBuilder schema={schema} value={filter} onChange={jest.fn()} dsl dnd />
  );

  expectNoAxeViolations(await axe(container));
});
