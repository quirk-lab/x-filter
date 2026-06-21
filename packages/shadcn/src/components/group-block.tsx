import type { Combinator } from '@x-filter/core';
import type { FilterGroupViewModel } from '@x-filter/react';
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
              <Button variant="outline" onClick={() => onAddRule(group.id)}>
                Add rule
              </Button>
              <Button variant="outline" onClick={() => onAddGroup(group.id)}>
                Add group
              </Button>
              {onClone ? (
                <Button variant="outline" onClick={() => onClone(group.id)}>
                  Clone group
                </Button>
              ) : null}
              {onRemove ? (
                <Button variant="destructive" onClick={() => onRemove(group.id)}>
                  Remove group
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
