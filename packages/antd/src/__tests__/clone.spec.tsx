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

const ruleFilter: Filter = {
  id: 'root',
  combinator: 'and',
  children: [{ id: 'r1', field: 'name', operator: 'equals', value: 'a' }],
};

const groupFilter: Filter = {
  id: 'root',
  combinator: 'and',
  children: [
    {
      id: 'g1',
      combinator: 'or',
      children: [{ id: 'r1', field: 'name', operator: 'equals', value: 'a' }],
    },
  ],
};

describe('AntdFilterBuilder clone', () => {
  it('clones a rule after the source (atomic path)', () => {
    const onChange = jest.fn();
    render(<AntdFilterBuilder schema={schema} defaultValue={ruleFilter} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Clone rule' }));

    const next = onChange.mock.calls.at(-1)?.[0] as Filter;
    expect(next.children).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Clone rule' })).toHaveLength(2);
  });

  it('clones a non-root group and never the root', () => {
    render(<AntdFilterBuilder schema={schema} defaultValue={groupFilter} />);

    expect(screen.getAllByRole('button', { name: 'Clone group' })).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Clone group' }));
    expect(screen.getAllByRole('button', { name: 'Clone group' })).toHaveLength(2);
  });

  it('wires clone controls in the fallback path', () => {
    const mixedFilter: Filter = {
      id: 'root',
      combinator: 'and',
      children: [
        { id: 'r1', field: 'name', operator: 'equals', value: 'a' },
        { id: 'g1', combinator: 'or', children: [] },
      ],
    };
    render(
      <AntdFilterBuilder
        schema={schema}
        defaultValue={mixedFilter}
        classNames={{ actions: 'custom-actions' }}
      />
    );

    expect(screen.getAllByRole('button', { name: 'Clone rule' }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('button', { name: 'Clone group' }).length).toBeGreaterThanOrEqual(1);
  });
});
