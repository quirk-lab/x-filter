import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS as DndCss } from '@dnd-kit/utilities';
import type { CSSProperties, ReactNode } from 'react';

export interface SortableFilterContextProps {
  items: string[];
  children: ReactNode;
  onMove?: (activeId: string, overId: string) => void;
}

export function SortableFilterContext({ items, children, onMove }: SortableFilterContextProps) {
  // Mouse for desktop; Touch with a long-press delay so mobile users can still
  // scroll the page without accidentally starting a drag; Keyboard for a11y.
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onMove?.(String(active.id), String(over.id));
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

export interface SortableFilterItemProps {
  id: string;
  children: ReactNode;
}

export function SortableFilterItem({ id, children }: SortableFilterItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style: CSSProperties = {
    transform: DndCss.Transform.toString(transform),
    transition,
  };

  return (
    <div data-sortable-id={id} ref={setNodeRef} style={style}>
      <button
        {...attributes}
        {...listeners}
        aria-label={`Drag ${id}`}
        aria-roledescription="sortable"
        className="inline-flex min-h-11 min-w-11 touch-none items-center justify-center sm:min-h-0 sm:min-w-0"
        type="button"
      >
        Drag {id}
      </button>
      {children}
    </div>
  );
}
