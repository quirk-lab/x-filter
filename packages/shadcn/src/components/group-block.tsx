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
}: ShadcnFilterGroupProps) {
  return (
    <Card
      aria-describedby={group.aria.describedBy}
      aria-label={group.aria.label}
      className={className}
      role="group"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <ShadcnCombinatorSelector
            value={'combinator' in group.group ? group.group.combinator : 'and'}
            onChange={(combinator) => onCombinatorChange(group.id, combinator)}
          />
          <ShadcnNotToggle
            checked={Boolean(group.group.not)}
            onChange={(not) => onNotChange(group.id, not)}
          />
          <Button variant="outline" onClick={() => onAddRule(group.id)}>
            Add rule
          </Button>
          <Button variant="outline" onClick={() => onAddGroup(group.id)}>
            Add group
          </Button>
          {onRemove ? (
            <Button variant="destructive" onClick={() => onRemove(group.id)}>
              Remove group
            </Button>
          ) : null}
        </div>
        {children ? <div className={cn('flex flex-col gap-3')}>{children}</div> : null}
      </div>
    </Card>
  );
}
