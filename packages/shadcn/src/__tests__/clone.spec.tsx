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

describe('ShadcnFilterBuilder clone (atomic path)', () => {
  it('clones a rule, inserting a duplicate after the source', () => {
    const onChange = jest.fn();
    render(<ShadcnFilterBuilder schema={schema} defaultValue={ruleFilter} onChange={onChange} />);

    expect(screen.getAllByRole('button', { name: 'Clone rule' })).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Clone rule' }));

    const next = onChange.mock.calls.at(-1)?.[0] as Filter;
    expect(next.children).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Clone rule' })).toHaveLength(2);
  });

  it('clones a non-root group and omits the control on the root', () => {
    render(<ShadcnFilterBuilder schema={schema} defaultValue={groupFilter} />);

    // only g1 is clonable, never the root
    expect(screen.getAllByRole('button', { name: 'Clone group' })).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Clone group' }));
    expect(screen.getAllByRole('button', { name: 'Clone group' })).toHaveLength(2);
  });

  it('renders no Clone group control for an empty root', () => {
    render(
      <ShadcnFilterBuilder
        schema={schema}
        defaultValue={{ id: 'root', combinator: 'and', children: [] }}
      />
    );
    expect(screen.queryAllByRole('button', { name: 'Clone group' })).toHaveLength(0);
  });
});

describe('ShadcnFilterBuilder clone (fallback path)', () => {
  it('renders and wires clone controls when a custom actions className forces fallback', () => {
    const mixedFilter: Filter = {
      id: 'root',
      combinator: 'and',
      children: [
        { id: 'r1', field: 'name', operator: 'equals', value: 'a' },
        { id: 'g1', combinator: 'or', children: [] },
      ],
    };
    render(
      <ShadcnFilterBuilder
        schema={schema}
        defaultValue={mixedFilter}
        classNames={{ actions: 'custom-actions' }}
      />
    );

    expect(screen.getAllByRole('button', { name: 'Clone rule' }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('button', { name: 'Clone group' }).length).toBeGreaterThanOrEqual(1);

    fireEvent.click(screen.getAllByRole('button', { name: 'Clone rule' })[0]);
    expect(screen.getAllByRole('button', { name: 'Clone rule' })).toHaveLength(2);
  });
});
