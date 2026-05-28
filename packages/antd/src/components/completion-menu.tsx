import type { CompletionItem } from '@x-filter/core';

export interface AntdCompletionMenuProps {
  items: CompletionItem[];
  activeIndex: number;
  className?: string;
  onSelect: (item: CompletionItem) => void;
}

export function AntdCompletionMenu({
  items,
  activeIndex,
  className,
  onSelect,
}: AntdCompletionMenuProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className={className} role="listbox">
      {items.map((item, index) => (
        <button
          aria-selected={index === activeIndex}
          key={`${item.kind}-${item.value}`}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onSelect(item)}
          role="option"
          type="button"
          tabIndex={-1}
        >
          <span>{item.label}</span>
          {item.detail ? <small> {item.detail}</small> : null}
        </button>
      ))}
    </div>
  );
}
