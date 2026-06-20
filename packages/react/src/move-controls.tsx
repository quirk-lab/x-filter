import type { FilterGroupViewModel, FilterNodeViewModel } from './types';

export interface MoveControlsProps {
  dnd: boolean;
  group: FilterGroupViewModel;
  child: FilterNodeViewModel;
  index: number;
  canMoveChild: (
    group: FilterGroupViewModel,
    child: FilterNodeViewModel,
    targetIndex: number
  ) => boolean;
  moveChild: (
    group: FilterGroupViewModel,
    child: FilterNodeViewModel,
    index: number,
    direction: 'up' | 'down'
  ) => void;
}

export function MoveControls({
  dnd,
  group,
  child,
  index,
  canMoveChild,
  moveChild,
}: MoveControlsProps) {
  if (!dnd) return null;

  const canMoveUp = canMoveChild(group, child, index - 1);
  const canMoveDown = canMoveChild(group, child, index + 1);

  return (
    <span>
      <button
        aria-label={`Move ${child.id} up`}
        disabled={!canMoveUp}
        type="button"
        onClick={() => moveChild(group, child, index, 'up')}
      >
        Move {child.id} up
      </button>
      <button
        aria-label={`Move ${child.id} down`}
        disabled={!canMoveDown}
        type="button"
        onClick={() => moveChild(group, child, index, 'down')}
      >
        Move {child.id} down
      </button>
    </span>
  );
}
