import { fireEvent, render, screen } from '@testing-library/react';
import { MoveControls } from '../move-controls';
import type { FilterGroupViewModel, FilterNodeViewModel } from '../types';

const makeGroup = (children: FilterNodeViewModel[]): FilterGroupViewModel => ({
  kind: 'group',
  id: 'root',
  group: { id: 'root', combinator: 'and', children: [] },
  depth: 0,
  children,
  aria: { label: 'Filter group root' },
});

const makeRule = (id: string): FilterNodeViewModel => ({
  kind: 'rule',
  id,
  rule: { id, field: 'name', operator: 'equals', value: 'test' },
  errors: [],
  aria: { label: 'Rule name equals' },
});

const boundedCanMoveChild = (
  group: FilterGroupViewModel,
  _child: FilterNodeViewModel,
  targetIndex: number
): boolean => targetIndex >= 0 && targetIndex < group.children.length;

describe('MoveControls', () => {
  it('renders nothing when dnd is false', () => {
    const group = makeGroup([makeRule('r1')]);
    const { container } = render(
      <MoveControls
        dnd={false}
        group={group}
        child={group.children[0]}
        index={0}
        canMoveChild={() => true}
        moveChild={() => {}}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders up and down buttons when dnd is true', () => {
    const group = makeGroup([makeRule('r1'), makeRule('r2')]);
    render(
      <MoveControls
        dnd={true}
        group={group}
        child={group.children[0]}
        index={0}
        canMoveChild={() => true}
        moveChild={() => {}}
      />
    );
    expect(screen.getByRole('button', { name: /move r1 up/i })).not.toBeNull();
    expect(screen.getByRole('button', { name: /move r1 down/i })).not.toBeNull();
  });

  it('disables up button at first index', () => {
    const group = makeGroup([makeRule('r1'), makeRule('r2')]);
    render(
      <MoveControls
        dnd={true}
        group={group}
        child={group.children[0]}
        index={0}
        canMoveChild={boundedCanMoveChild}
        moveChild={() => {}}
      />
    );
    expect(screen.getByRole('button', { name: /move r1 up/i })).toHaveProperty('disabled', true);
  });

  it('disables down button at last index', () => {
    const group = makeGroup([makeRule('r1'), makeRule('r2')]);
    render(
      <MoveControls
        dnd={true}
        group={group}
        child={group.children[1]}
        index={1}
        canMoveChild={boundedCanMoveChild}
        moveChild={() => {}}
      />
    );
    expect(screen.getByRole('button', { name: /move r2 down/i })).toHaveProperty('disabled', true);
  });

  it('calls moveChild with up direction', () => {
    const group = makeGroup([makeRule('r1'), makeRule('r2')]);
    const moveChild = jest.fn();
    render(
      <MoveControls
        dnd={true}
        group={group}
        child={group.children[1]}
        index={1}
        canMoveChild={() => true}
        moveChild={moveChild}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /move r2 up/i }));
    expect(moveChild).toHaveBeenCalledWith(group, group.children[1], 1, 'up');
  });

  it('calls moveChild with down direction', () => {
    const group = makeGroup([makeRule('r1'), makeRule('r2')]);
    const moveChild = jest.fn();
    render(
      <MoveControls
        dnd={true}
        group={group}
        child={group.children[0]}
        index={0}
        canMoveChild={() => true}
        moveChild={moveChild}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /move r1 down/i }));
    expect(moveChild).toHaveBeenCalledWith(group, group.children[0], 0, 'down');
  });

  it('disables buttons when canMoveChild returns false', () => {
    const group = makeGroup([makeRule('r1'), makeRule('r2')]);
    render(
      <MoveControls
        dnd={true}
        group={group}
        child={group.children[0]}
        index={0}
        canMoveChild={() => false}
        moveChild={() => {}}
      />
    );
    expect(screen.getByRole('button', { name: /move r1 up/i })).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: /move r1 down/i })).toHaveProperty('disabled', true);
  });
});
