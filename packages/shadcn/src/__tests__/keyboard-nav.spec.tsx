import { fireEvent, render } from '@testing-library/react';
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
    { id: 'r1', field: 'name', operator: 'equals', value: 'Ada' },
    {
      id: 'g1',
      combinator: 'or',
      children: [{ id: 'r2', field: 'age', operator: 'gt', value: 30 }],
    },
  ],
};

function item(container: HTMLElement, id: string): HTMLElement {
  const el = container.querySelector<HTMLElement>(`[data-node-id="${id}"][role="treeitem"]`);
  if (!el) throw new Error(`treeitem ${id} not found`);
  return el;
}

describe('ShadcnFilterBuilder keyboard navigation', () => {
  it('renders an ARIA tree with one treeitem per node and roving tabindex', () => {
    const { container } = render(
      <ShadcnFilterBuilder schema={schema} defaultValue={filter} onChange={jest.fn()} />
    );

    expect(container.querySelector('[role="tree"]')).not.toBeNull();
    // root + r1 + g1 + r2
    expect(container.querySelectorAll('[role="treeitem"]')).toHaveLength(4);

    // Only the first treeitem (the root) is tabbable initially.
    expect(item(container, 'root').tabIndex).toBe(0);
    expect(item(container, 'r1').tabIndex).toBe(-1);
    expect(item(container, 'g1').tabIndex).toBe(-1);
    expect(item(container, 'r2').tabIndex).toBe(-1);

    // Groups advertise their expanded state.
    expect(item(container, 'root').getAttribute('aria-expanded')).toBe('true');
    expect(item(container, 'g1').getAttribute('aria-expanded')).toBe('true');
    expect(item(container, 'r1').getAttribute('aria-expanded')).toBeNull();
  });

  it('moves row focus with Arrow keys and updates aria-selected / tabindex', () => {
    const { container } = render(
      <ShadcnFilterBuilder schema={schema} defaultValue={filter} onChange={jest.fn()} />
    );

    const root = item(container, 'root');
    root.focus();
    fireEvent.keyDown(root, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(item(container, 'r1'));
    expect(item(container, 'r1').getAttribute('aria-selected')).toBe('true');
    expect(item(container, 'r1').tabIndex).toBe(0);
    expect(item(container, 'root').tabIndex).toBe(-1);

    fireEvent.keyDown(item(container, 'r1'), { key: 'ArrowDown' });
    expect(document.activeElement).toBe(item(container, 'g1'));

    fireEvent.keyDown(item(container, 'g1'), { key: 'ArrowUp' });
    expect(document.activeElement).toBe(item(container, 'r1'));
  });

  it('jumps to the first and last treeitem with Home / End', () => {
    const { container } = render(
      <ShadcnFilterBuilder schema={schema} defaultValue={filter} onChange={jest.fn()} />
    );

    const r1 = item(container, 'r1');
    r1.focus();
    fireEvent.keyDown(r1, { key: 'End' });
    expect(document.activeElement).toBe(item(container, 'r2'));

    fireEvent.keyDown(item(container, 'r2'), { key: 'Home' });
    expect(document.activeElement).toBe(item(container, 'root'));
  });

  it('enters a row with Enter and returns to the row with Escape', () => {
    const { container } = render(
      <ShadcnFilterBuilder schema={schema} defaultValue={filter} onChange={jest.fn()} />
    );

    const r1 = item(container, 'r1');
    r1.focus();
    fireEvent.keyDown(r1, { key: 'Enter' });
    // Focus moved into the first control inside the row (not the row itself).
    const focused = document.activeElement as HTMLElement;
    expect(focused).not.toBe(r1);
    expect(r1.contains(focused)).toBe(true);

    fireEvent.keyDown(focused, { key: 'Escape' });
    expect(document.activeElement).toBe(r1);
  });

  it('deletes the focused rule with Delete', () => {
    const onChange = jest.fn();
    const { container } = render(
      <ShadcnFilterBuilder schema={schema} defaultValue={filter} onChange={onChange} />
    );

    const r1 = item(container, 'r1');
    r1.focus();
    fireEvent.keyDown(r1, { key: 'Delete' });

    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0][0] as Filter;
    expect((next as { children: { id: string }[] }).children.map((c) => c.id)).not.toContain('r1');
  });

  it('clones the focused rule with Ctrl/Cmd+D', () => {
    const onChange = jest.fn();
    const { container } = render(
      <ShadcnFilterBuilder schema={schema} defaultValue={filter} onChange={onChange} />
    );

    const r1 = item(container, 'r1');
    r1.focus();
    fireEvent.keyDown(r1, { key: 'd', ctrlKey: true });

    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0][0] as { children: unknown[] };
    expect(next.children).toHaveLength(3);
  });

  it('never deletes the structural root group via keyboard', () => {
    const onChange = jest.fn();
    const { container } = render(
      <ShadcnFilterBuilder schema={schema} defaultValue={filter} onChange={onChange} />
    );

    const root = item(container, 'root');
    root.focus();
    fireEvent.keyDown(root, { key: 'Delete' });
    fireEvent.keyDown(root, { key: 'd', ctrlKey: true });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('drops keyboard mutations in read-only mode', () => {
    const onChange = jest.fn();
    const { container } = render(
      <ShadcnFilterBuilder schema={schema} defaultValue={filter} onChange={onChange} readOnly />
    );

    const r1 = item(container, 'r1');
    r1.focus();
    fireEvent.keyDown(r1, { key: 'Delete' });
    fireEvent.keyDown(r1, { key: 'd', ctrlKey: true });

    expect(onChange).not.toHaveBeenCalled();
    // Navigation still works for reading.
    fireEvent.keyDown(r1, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(item(container, 'g1'));
  });
});
