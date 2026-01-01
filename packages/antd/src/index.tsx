import type React from 'react';
import { useFilteredArray } from '@x-filter/react';

export interface FilteredListProps<T> {
  items: (T | null | undefined)[];
  renderItem: (item: T, index: number) => React.ReactNode;
}

/**
 * Ant Design-style filtered list component
 */
export function FilteredList<T>({ items, renderItem }: FilteredListProps<T>) {
  const filtered = useFilteredArray(items);

  return (
    <div className="filtered-list">
      {filtered.map((item, index) => (
        <div key={`item-${index}-${String(item)}`} className="list-item">
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}
