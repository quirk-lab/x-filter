import { render, screen, within } from '@testing-library/react';
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

function allControls(container: HTMLElement): (HTMLInputElement | HTMLSelectElement)[] {
  return Array.from(container.querySelectorAll('select, input, textarea')) as (
    | HTMLInputElement
    | HTMLSelectElement
  )[];
}

describe('ShadcnFilterBuilder readOnly', () => {
  it('disables every control and hides all action buttons', () => {
    const { container } = render(
      <ShadcnFilterBuilder schema={schema} defaultValue={filter} readOnly />
    );

    const controls = allControls(container);
    expect(controls.length).toBeGreaterThan(0);
    for (const control of controls) {
      expect(control.disabled).toBe(true);
    }

    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('hides the DSL editor even when dsl is enabled', () => {
    render(<ShadcnFilterBuilder schema={schema} defaultValue={filter} dsl readOnly />);
    expect(screen.queryByLabelText('DSL')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Apply DSL' })).toBeNull();
  });

  it('suppresses drag-and-drop move controls even when dnd is enabled', () => {
    render(<ShadcnFilterBuilder schema={schema} defaultValue={filter} dnd readOnly />);
    // Move controls render buttons; read-only removes them entirely.
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('marks every group and rule as locked in the DOM', () => {
    const { container } = render(
      <ShadcnFilterBuilder schema={schema} defaultValue={filter} readOnly />
    );
    // root group + nested group both flagged, plus rule rows.
    expect(container.querySelectorAll('[data-locked]').length).toBeGreaterThanOrEqual(2);
  });

  it('stays fully editable when readOnly is false', () => {
    render(<ShadcnFilterBuilder schema={schema} defaultValue={filter} dsl readOnly={false} />);

    const nameRow = screen.getByRole('group', { name: 'Rule Name equals' });
    const field = within(nameRow).getByLabelText('Field') as HTMLSelectElement;
    expect(field.disabled).toBe(false);

    expect(screen.getByLabelText('DSL')).not.toBeNull();
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
  });

  it('honors readOnly through the fallback render path (custom actions className)', () => {
    const { container } = render(
      <ShadcnFilterBuilder
        schema={schema}
        defaultValue={filter}
        classNames={{ actions: 'custom-actions' }}
        readOnly
      />
    );
    const controls = allControls(container);
    for (const control of controls) {
      expect(control.disabled).toBe(true);
    }
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
