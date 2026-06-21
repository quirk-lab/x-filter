import { fireEvent, render, screen } from '@testing-library/react';
import { useFilterKeyboardNav } from '../use-filter-keyboard-nav';

type Item = { id: string; kind: 'rule' | 'group' };
const items: Item[] = [
  { id: 'a', kind: 'rule' },
  { id: 'b', kind: 'group' },
  { id: 'c', kind: 'rule' },
];

function Harness(props: {
  onDeleteNode?: (id: string, kind: 'rule' | 'group') => void;
  onCloneNode?: (id: string, kind: 'rule' | 'group') => void;
}) {
  const nav = useFilterKeyboardNav(props);
  return (
    <div {...nav.containerProps}>
      {items.map((item, index) => (
        <div key={item.id} {...nav.getItemProps(item.id, index, item.kind, { label: item.id })}>
          <input aria-label={`${item.id}-input`} />
        </div>
      ))}
    </div>
  );
}

const rows = () => Array.from(document.querySelectorAll('[role="treeitem"]')) as HTMLElement[];

describe('useFilterKeyboardNav', () => {
  it('exposes a single tabbable treeitem initially (roving tabindex)', () => {
    render(<Harness />);
    const [a, b, c] = rows();
    expect(a.tabIndex).toBe(0);
    expect(b.tabIndex).toBe(-1);
    expect(c.tabIndex).toBe(-1);
  });

  it('moves row focus with ArrowDown / ArrowUp', () => {
    render(<Harness />);
    const [a, b] = rows();
    a.focus();
    fireEvent.keyDown(a, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(b);
    fireEvent.keyDown(b, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(a);
  });

  it('jumps to first/last with Home / End', () => {
    render(<Harness />);
    const list = rows();
    list[0].focus();
    fireEvent.keyDown(list[0], { key: 'End' });
    expect(document.activeElement).toBe(list[2]);
    fireEvent.keyDown(list[2], { key: 'Home' });
    expect(document.activeElement).toBe(list[0]);
  });

  it('does not move past the ends', () => {
    render(<Harness />);
    const list = rows();
    list[0].focus();
    fireEvent.keyDown(list[0], { key: 'ArrowUp' });
    expect(document.activeElement).toBe(list[0]);
    list[2].focus();
    fireEvent.keyDown(list[2], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(list[2]);
  });

  it('Enter focuses the first control, Escape returns to the row', () => {
    render(<Harness />);
    const a = rows()[0];
    a.focus();
    fireEvent.keyDown(a, { key: 'Enter' });
    const input = screen.getByLabelText('a-input');
    expect(document.activeElement).toBe(input);

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(document.activeElement).toBe(a);
  });

  it('Delete and Ctrl+D call the node callbacks with id and kind', () => {
    const onDeleteNode = jest.fn();
    const onCloneNode = jest.fn();
    render(<Harness onDeleteNode={onDeleteNode} onCloneNode={onCloneNode} />);
    const b = rows()[1];
    b.focus();

    fireEvent.keyDown(b, { key: 'Delete' });
    expect(onDeleteNode).toHaveBeenCalledWith('b', 'group');

    fireEvent.keyDown(b, { key: 'd', ctrlKey: true });
    expect(onCloneNode).toHaveBeenCalledWith('b', 'group');
  });

  it('does not hijack arrow keys while focus is inside a control', () => {
    render(<Harness />);
    const input = screen.getByLabelText('a-input');
    input.focus();
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    // focus stays in the input; navigation is not triggered
    expect(document.activeElement).toBe(input);
  });

  it('marks the focused row aria-selected and tabbable', () => {
    render(<Harness />);
    const [a, b] = rows();
    a.focus();
    fireEvent.keyDown(a, { key: 'ArrowDown' });
    expect(b.getAttribute('aria-selected')).toBe('true');
    expect(b.tabIndex).toBe(0);
    expect(a.tabIndex).toBe(-1);
  });
});
