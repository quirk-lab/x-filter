import { useFilteredArray } from '@x-filter/react';
import type React from 'react';

export * from './components';

export interface FilteredListProps<T> {
  items: (T | null | undefined)[];
  renderItem: (item: T, index: number) => React.ReactNode;
}

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

export type {
  FilterBuilderClassNames,
  FilterBuilderLabels,
  FilterBuilderSlotProps,
  FilterBuilderSlots,
  FilterGroupViewModel,
  FilterNodeViewModel,
  FilterRuleViewModel,
  UseFilterBuilderReturn,
} from '@x-filter/react';
