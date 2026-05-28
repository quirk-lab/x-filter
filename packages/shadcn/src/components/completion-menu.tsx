import type { CompletionItem } from '@x-filter/core';
import { cn } from './primitives';

export interface ShadcnCompletionMenuProps {
  items: CompletionItem[];
  activeIndex: number;
  className?: string;
  onSelect: (item: CompletionItem) => void;
}

export function ShadcnCompletionMenu({
  items,
  activeIndex,
  className,
  onSelect,
}: ShadcnCompletionMenuProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className={cn('rounded-md border bg-background p-1', className)} role="listbox">
      {items.map((item, index) => (
        <button
          aria-selected={index === activeIndex}
          className={cn(
            'w-full cursor-pointer rounded-sm px-2 py-1 text-left text-sm',
            index === activeIndex && 'bg-accent text-accent-foreground'
          )}
          key={`${item.kind}-${item.value}`}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onSelect(item)}
          role="option"
          type="button"
          tabIndex={-1}
        >
          <span>{item.label}</span>
          {item.detail ? <span className="ml-2 text-xs opacity-70">{item.detail}</span> : null}
        </button>
      ))}
    </div>
  );
}
