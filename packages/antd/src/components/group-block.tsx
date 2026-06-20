import type { Combinator } from '@x-filter/core';
import type { FilterGroupViewModel } from '@x-filter/react';
import { Button, Card, Space } from 'antd';
import type { ReactNode } from 'react';
import { AntdCombinatorSelector } from './combinator-selector';
import { AntdNotToggle } from './not-toggle';

export interface AntdFilterGroupProps {
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

export function AntdFilterGroup({
  group,
  children,
  className,
  onCombinatorChange,
  onNotChange,
  onAddRule,
  onAddGroup,
  onRemove,
  onClone,
}: AntdFilterGroupProps) {
  // A locked group freezes its own controls and hides structural actions.
  const locked = group.locked;
  return (
    <Card
      aria-describedby={group.aria.describedBy}
      aria-label={group.aria.label}
      className={className}
      data-locked={locked || undefined}
      role="group"
      size="small"
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Space style={locked ? { opacity: 0.6 } : undefined} wrap>
          <AntdCombinatorSelector
            value={'combinator' in group.group ? group.group.combinator : 'and'}
            disabled={locked}
            onChange={(combinator) => onCombinatorChange(group.id, combinator)}
          />
          <AntdNotToggle
            checked={Boolean(group.group.not)}
            disabled={locked}
            onChange={(not) => onNotChange(group.id, not)}
          />
          {locked ? null : (
            <>
              <Button onClick={() => onAddRule(group.id)}>Add rule</Button>
              <Button onClick={() => onAddGroup(group.id)}>Add group</Button>
              {onClone ? <Button onClick={() => onClone(group.id)}>Clone group</Button> : null}
              {onRemove ? (
                <Button danger onClick={() => onRemove(group.id)}>
                  Remove group
                </Button>
              ) : null}
            </>
          )}
        </Space>
        {children ? <Space direction="vertical">{children}</Space> : null}
      </Space>
    </Card>
  );
}
