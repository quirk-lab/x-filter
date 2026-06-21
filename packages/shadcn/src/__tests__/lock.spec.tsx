import { fireEvent, render, screen, within } from '@testing-library/react';
import type { FieldSchema, Filter } from '@x-filter/core';
import { ShadcnFilterBuilder } from '../index';

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

function lockedRow(container: HTMLElement): HTMLElement {
  const el = container.querySelector('fieldset[data-locked]');
  if (!el) throw new Error('locked rule fieldset not found');
  return el as HTMLElement;
}

describe('ShadcnFilterBuilder lock (atomic path)', () => {
  it('disables every control inside a locked rule and hides its actions', () => {
    const { container } = render(<ShadcnFilterBuilder schema={schema} defaultValue={filter} />);
    const row = lockedRow(container);

    const controls = Array.from(row.querySelectorAll('select, input'));
    expect(controls.length).toBeGreaterThan(0);
    for (const control of controls) {
      expect((control as HTMLInputElement | HTMLSelectElement).disabled).toBe(true);
    }

    expect(within(row).queryByRole('button', { name: 'Remove rule' })).toBeNull();
    expect(within(row).queryByRole('button', { name: 'Clone rule' })).toBeNull();
  });

  it('keeps unlocked rules fully editable with their actions', () => {
    const onChange = jest.fn();
    render(<ShadcnFilterBuilder schema={schema} defaultValue={filter} onChange={onChange} />);

    // The free rule (Age greater than) stays editable.
    const freeRow = screen.getByRole('group', { name: 'Rule Age greater than' });
    const select = within(freeRow).getByLabelText('Field') as HTMLSelectElement;
    expect(select.disabled).toBe(false);

    const removeButtons = within(freeRow).getAllByRole('button', { name: 'Remove rule' });
    fireEvent.click(removeButtons[0]);
    const next = onChange.mock.calls.at(-1)?.[0] as Filter;
    expect(next.children.some((c) => 'id' in c && c.id === 'r-free')).toBe(false);
  });

  it('disables a locked group combinator and hides its add/clone/remove actions', () => {
    const { container } = render(<ShadcnFilterBuilder schema={schema} defaultValue={filter} />);

    const lockedGroup = container.querySelector('[role="group"][data-locked]') as HTMLElement;
    expect(lockedGroup).not.toBeNull();

    const combinator = within(lockedGroup).getByLabelText('Combinator') as HTMLSelectElement;
    expect(combinator.disabled).toBe(true);

    expect(within(lockedGroup).queryByRole('button', { name: 'Add rule' })).toBeNull();
    expect(within(lockedGroup).queryByRole('button', { name: 'Add group' })).toBeNull();
    expect(within(lockedGroup).queryByRole('button', { name: 'Clone group' })).toBeNull();
    expect(within(lockedGroup).queryByRole('button', { name: 'Remove group' })).toBeNull();
  });
});

describe('ShadcnFilterBuilder lock (fallback path)', () => {
  it('honors locked state when a custom actions className forces the fallback', () => {
    const { container } = render(
      <ShadcnFilterBuilder
        schema={schema}
        defaultValue={filter}
        classNames={{ actions: 'custom-actions' }}
      />
    );
    const row = lockedRow(container);
    const controls = Array.from(row.querySelectorAll('select, input'));
    for (const control of controls) {
      expect((control as HTMLInputElement | HTMLSelectElement).disabled).toBe(true);
    }
    expect(within(row).queryByRole('button', { name: 'Remove rule' })).toBeNull();
  });
});
