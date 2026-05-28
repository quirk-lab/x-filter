import { closestCenter, DndContext, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS as DndCss } from '@dnd-kit/utilities';
import type { CSSProperties, ReactNode } from 'react';

export interface SortableFilterContextProps {
  items: string[];
  children: ReactNode;
  onMove?: (activeId: string, overId: string) => void;
}

export function SortableFilterContext({ items, children, onMove }: SortableFilterContextProps) {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onMove?.(String(active.id), String(over.id));
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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
        type="button"
      >
        Drag {id}
      </button>
      {children}
    </div>
  );
}
