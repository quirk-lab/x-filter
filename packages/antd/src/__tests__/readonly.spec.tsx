import { render, screen } from '@testing-library/react';
import type { FieldSchema, Filter } from '@x-filter/core';
import { AntdFilterBuilder } from '../index';

const schema: FieldSchema[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    operators: [{ name: 'equals', label: 'equals', arity: 'binary' }],
  },
  {
    name: 'age',
    label: 'Age',
    type: 'number',
    operators: [{ name: 'gt', label: 'greater than', arity: 'binary' }],
  },
];

// No node carries `locked` — read-only must be what disables everything.
const filter: Filter = {
  id: 'root',
  combinator: 'and',
  children: [
    { id: 'r-name', field: 'name', operator: 'equals', value: 'a' },
    {
      id: 'g-1',
      combinator: 'or',
      children: [{ id: 'r-age', field: 'age', operator: 'gt', value: 18 }],
    },
  ],
};

describe('AntdFilterBuilder readOnly', () => {
  it('disables every select and input and hides all action buttons', () => {
    const { container } = render(
      <AntdFilterBuilder schema={schema} defaultValue={filter} readOnly />
    );

    const selects = container.querySelectorAll('.ant-select');
    expect(selects.length).toBeGreaterThan(0);
    expect(container.querySelectorAll('.ant-select:not(.ant-select-disabled)')).toHaveLength(0);

    const inputs = Array.from(container.querySelectorAll('input')) as HTMLInputElement[];
    expect(inputs.length).toBeGreaterThan(0);
    for (const input of inputs) {
      expect(input.disabled).toBe(true);
    }

    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('hides the DSL editor even when dsl is enabled', () => {
    const { container } = render(
      <AntdFilterBuilder schema={schema} defaultValue={filter} dsl readOnly />
    );
    expect(container.querySelector('textarea')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Apply DSL' })).toBeNull();
  });

  it('suppresses drag-and-drop move controls even when dnd is enabled', () => {
    render(<AntdFilterBuilder schema={schema} defaultValue={filter} dnd readOnly />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('stays fully editable when readOnly is false', () => {
    const { container } = render(
      <AntdFilterBuilder schema={schema} defaultValue={filter} dsl readOnly={false} />
    );
    expect(container.querySelectorAll('.ant-select-disabled')).toHaveLength(0);
    expect(container.querySelector('textarea')).not.toBeNull();
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
  });

  it('honors readOnly through the fallback render path (custom actions className)', () => {
    const { container } = render(
      <AntdFilterBuilder
        schema={schema}
        defaultValue={filter}
        classNames={{ actions: 'custom-actions' }}
        readOnly
      />
    );
    expect(container.querySelectorAll('.ant-select:not(.ant-select-disabled)')).toHaveLength(0);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
