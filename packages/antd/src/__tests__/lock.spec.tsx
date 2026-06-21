import { fireEvent, render, screen, within } from '@testing-library/react';
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

const filter: Filter = {
  id: 'root',
  combinator: 'and',
  children: [
    { id: 'r-locked', field: 'name', operator: 'equals', value: 'a', locked: true },
    { id: 'r-free', field: 'age', operator: 'gt', value: 18 },
    {
      id: 'g-locked',
      combinator: 'or',
      locked: true,
      children: [{ id: 'r-in', field: 'name', operator: 'equals', value: 'b' }],
    },
  ],
};

function lockedRule(container: HTMLElement): HTMLElement {
  const el = container.querySelector('[data-locked][aria-label^="Rule"]');
  if (!el) throw new Error('locked rule not found');
  return el as HTMLElement;
}

function lockedGroup(container: HTMLElement): HTMLElement {
  const el = container.querySelector('[data-locked][aria-label^="Filter group"]');
  if (!el) throw new Error('locked group not found');
  return el as HTMLElement;
}

describe('AntdFilterBuilder lock (atomic path)', () => {
  it('disables a locked rule and hides its actions', () => {
    const { container } = render(<AntdFilterBuilder schema={schema} defaultValue={filter} />);
    const row = lockedRule(container);

    // Field + operator selects are disabled.
    expect(row.querySelectorAll('.ant-select-disabled').length).toBeGreaterThanOrEqual(2);
    expect(within(row).queryByRole('button', { name: 'Remove rule' })).toBeNull();
    expect(within(row).queryByRole('button', { name: 'Clone rule' })).toBeNull();
  });

  it('keeps unlocked rules editable with their actions', () => {
    const onChange = jest.fn();
    render(<AntdFilterBuilder schema={schema} defaultValue={filter} onChange={onChange} />);

    const freeRow = screen.getByRole('group', { name: 'Rule Age greater than' });
    expect(freeRow.querySelectorAll('.ant-select-disabled')).toHaveLength(0);

    fireEvent.click(within(freeRow).getByRole('button', { name: 'Remove rule' }));
    const next = onChange.mock.calls.at(-1)?.[0] as Filter;
    expect(next.children.some((c) => 'id' in c && c.id === 'r-free')).toBe(false);
  });

  it('disables a locked group combinator and hides structural actions', () => {
    const { container } = render(<AntdFilterBuilder schema={schema} defaultValue={filter} />);
    const group = lockedGroup(container);

    // Only the group's own combinator is disabled; the unlocked child stays editable.
    expect(group.querySelectorAll('.ant-select-disabled')).toHaveLength(1);
    expect(within(group).queryByRole('button', { name: 'Add rule' })).toBeNull();
    expect(within(group).queryByRole('button', { name: 'Add group' })).toBeNull();
    expect(within(group).queryByRole('button', { name: 'Clone group' })).toBeNull();
    expect(within(group).queryByRole('button', { name: 'Remove group' })).toBeNull();
  });
});

describe('AntdFilterBuilder lock (fallback path)', () => {
  it('honors locked state when a custom actions className forces the fallback', () => {
    const { container } = render(
      <AntdFilterBuilder
        schema={schema}
        defaultValue={filter}
        classNames={{ actions: 'custom-actions' }}
      />
    );
    const row = lockedRule(container);
    expect(row.querySelectorAll('.ant-select-disabled').length).toBeGreaterThanOrEqual(2);
    expect(within(row).queryByRole('button', { name: 'Remove rule' })).toBeNull();
  });
});
