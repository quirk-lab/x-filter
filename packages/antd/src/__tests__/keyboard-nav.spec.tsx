import { fireEvent, render } from '@testing-library/react';
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

describe('AntdFilterBuilder keyboard navigation', () => {
  it('renders an ARIA tree with one treeitem per node and roving tabindex', () => {
    const { container } = render(
      <AntdFilterBuilder schema={schema} defaultValue={filter} onChange={jest.fn()} />
    );

    expect(container.querySelector('[role="tree"]')).not.toBeNull();
    expect(container.querySelectorAll('[role="treeitem"]')).toHaveLength(4);

    expect(item(container, 'root').tabIndex).toBe(0);
    expect(item(container, 'r1').tabIndex).toBe(-1);
    expect(item(container, 'root').getAttribute('aria-expanded')).toBe('true');
    expect(item(container, 'r1').getAttribute('aria-expanded')).toBeNull();
  });

  it('moves row focus with Arrow / Home / End keys', () => {
    const { container } = render(
      <AntdFilterBuilder schema={schema} defaultValue={filter} onChange={jest.fn()} />
    );

    const root = item(container, 'root');
    root.focus();
    fireEvent.keyDown(root, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(item(container, 'r1'));

    fireEvent.keyDown(item(container, 'r1'), { key: 'End' });
    expect(document.activeElement).toBe(item(container, 'r2'));

    fireEvent.keyDown(item(container, 'r2'), { key: 'Home' });
    expect(document.activeElement).toBe(item(container, 'root'));
  });

  it('enters a row with Enter and returns with Escape', () => {
    const { container } = render(
      <AntdFilterBuilder schema={schema} defaultValue={filter} onChange={jest.fn()} />
    );

    const r1 = item(container, 'r1');
    r1.focus();
    fireEvent.keyDown(r1, { key: 'Enter' });
    const focused = document.activeElement as HTMLElement;
    expect(focused).not.toBe(r1);
    expect(r1.contains(focused)).toBe(true);

    fireEvent.keyDown(focused, { key: 'Escape' });
    expect(document.activeElement).toBe(r1);
  });

  it('deletes and clones the focused rule with Delete / Ctrl+D', () => {
    const onChange = jest.fn();
    const { container } = render(
      <AntdFilterBuilder schema={schema} defaultValue={filter} onChange={onChange} />
    );

    item(container, 'r1').focus();
    fireEvent.keyDown(item(container, 'r1'), { key: 'Delete' });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(
      (onChange.mock.calls[0][0] as { children: { id: string }[] }).children.map((c) => c.id)
    ).not.toContain('r1');
  });

  it('never deletes the structural root and drops mutations in read-only mode', () => {
    const onChange = jest.fn();
    const { container, rerender } = render(
      <AntdFilterBuilder schema={schema} defaultValue={filter} onChange={onChange} />
    );

    const root = item(container, 'root');
    root.focus();
    fireEvent.keyDown(root, { key: 'Delete' });
    expect(onChange).not.toHaveBeenCalled();

    rerender(
      <AntdFilterBuilder schema={schema} defaultValue={filter} onChange={onChange} readOnly />
    );
    const r1 = item(container, 'r1');
    r1.focus();
    fireEvent.keyDown(r1, { key: 'Delete' });
    fireEvent.keyDown(r1, { key: 'd', ctrlKey: true });
    expect(onChange).not.toHaveBeenCalled();
  });
});
