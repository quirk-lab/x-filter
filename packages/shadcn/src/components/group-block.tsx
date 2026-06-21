import type { Combinator } from '@x-filter/core';
import type { FilterGroupViewModel } from '@x-filter/react';
import { Copy, Plus, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { ShadcnCombinatorSelector } from './combinator-selector';
import { ShadcnNotToggle } from './not-toggle';
import { Button, Card, cn } from './primitives';

export interface ShadcnFilterGroupProps {
  group: FilterGroupViewModel;
  children?: ReactNode;
  className?: string;
  onCombinatorChange: (groupId: string, combinator: Combinator) => void;
  onNotChange: (groupId: string, not: boolean) => void;
  onAddRule: (groupId: string) => void;
  onAddGroup: (groupId: string) => void;
  onRemove?: (groupId: string) => void;
  onClone?: (groupId: string) => void;
}

export function ShadcnFilterGroup({
  group,
  children,
  className,
  onCombinatorChange,
  onNotChange,
  onAddRule,
  onAddGroup,
  onRemove,
  onClone,
}: ShadcnFilterGroupProps) {
  // A locked group freezes its own controls and hides structural actions
  // (add / clone / remove). Children render their own locked state independently.
  const locked = group.locked;
  return (
    <Card
      aria-describedby={group.aria.describedBy}
      aria-label={group.aria.label}
      className={className}
      data-locked={locked || undefined}
      role="group"
    >
      <div className="flex flex-col gap-4">
        <div
          className={cn(
            'flex flex-nowrap items-center gap-2 overflow-x-auto',
            locked && 'opacity-60'
          )}
        >
          <ShadcnCombinatorSelector
            value={'combinator' in group.group ? group.group.combinator : 'and'}
            disabled={locked}
            onChange={(combinator) => onCombinatorChange(group.id, combinator)}
          />
          <ShadcnNotToggle
            checked={Boolean(group.group.not)}
            disabled={locked}
            onChange={(not) => onNotChange(group.id, not)}
          />
          {locked ? null : (
            <>
              <Button
                aria-label="Add rule"
                className="h-9 w-9 shrink-0 p-0"
                variant="outline"
                onClick={() => onAddRule(group.id)}
              >
                <Plus aria-hidden="true" size={15} />
              </Button>
              <Button
                aria-label="Add group"
                className="h-9 w-9 shrink-0 p-0"
                variant="outline"
                onClick={() => onAddGroup(group.id)}
              >
                <Plus aria-hidden="true" size={15} />
              </Button>
              {onClone ? (
                <Button
                  aria-label="Clone group"
                  className="h-9 w-9 shrink-0 p-0"
                  variant="outline"
                  onClick={() => onClone(group.id)}
                >
                  <Copy aria-hidden="true" size={15} />
                </Button>
              ) : null}
              {onRemove ? (
                <Button
                  aria-label="Remove group"
                  className="h-9 w-9 shrink-0 p-0"
                  variant="ghost-destructive"
                  onClick={() => onRemove(group.id)}
                >
                  <Trash2 aria-hidden="true" size={15} />
                </Button>
              ) : null}
            </>
          )}
        </div>
        {children ? <div className={cn('flex flex-col gap-3')}>{children}</div> : null}
      </div>
    </Card>
  );
}
