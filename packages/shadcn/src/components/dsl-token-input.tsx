import type { CompletionItem, FieldSchema, Filter } from '@x-filter/core';
import { formatDSL, getDslCompletions, tryParseDSL } from '@x-filter/core';
import type { DslTokenChip, FilterBuilderLabels } from '@x-filter/react';
import {
  dslToTokenChips,
  foldPendingIntoDsl,
  hasUnclosedQuote,
  removeConditionFromDsl,
  removeLastChipFromDsl,
  replaceCurrentSegment,
} from '@x-filter/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ShadcnCompletionMenu } from './completion-menu';
import { Badge, Button, cn } from './primitives';

export interface ShadcnDslTokenInputProps {
  filter: Filter;
  schema: FieldSchema[];
  className?: string;
  completionMenuClassName?: string;
  labels?: FilterBuilderLabels;
  onCommit: (filter: Filter) => void;
}

const formatParseError = (errors: { code: string; message: string }[]): string =>
  errors.map((error) => `[${error.code}] ${error.message}`).join('; ');

/** Formats a filter for editing, treating an empty root group (`()`) as blank. */
function dslForFilter(filter: Filter): string {
  const formatted = formatDSL(filter);
  return formatted === '()' ? '' : formatted;
}

type ChipGroup =
  | { kind: 'condition'; key: string; range: readonly [number, number]; chips: DslTokenChip[] }
  | { kind: 'token'; key: string; chip: DslTokenChip };

function groupChips(chips: DslTokenChip[]): ChipGroup[] {
  const groups: ChipGroup[] = [];
  let i = 0;
  while (i < chips.length) {
    const chip = chips[i];
    if (chip.conditionRange) {
      const range = chip.conditionRange;
      const group = [chip];
      let j = i + 1;
      while (
        j < chips.length &&
        chips[j].conditionRange?.[0] === range[0] &&
        chips[j].conditionRange?.[1] === range[1]
      ) {
        group.push(chips[j]);
        j++;
      }
      groups.push({ kind: 'condition', key: `cond-${range[0]}-${range[1]}`, range, chips: group });
      i = j;
    } else {
      groups.push({ kind: 'token', key: chip.id, chip });
      i++;
    }
  }
  return groups;
}

/**
 * GitHub-search-bar style DSL editor: the committed expression renders as
 * color-coded token chips, while a trailing input drives autocomplete. Selecting
 * a value completion (or pressing space) folds the in-progress text into a chip;
 * Backspace on an empty input removes the last chip. Edits are applied on
 * "Apply" (mirrors `ShadcnDslEditor`).
 */
export function ShadcnDslTokenInput({
  filter,
  schema,
  className,
  completionMenuClassName,
  labels,
  onCommit,
}: ShadcnDslTokenInputProps) {
  const [dsl, setDsl] = useState<string>(() => dslForFilter(filter));
  const [pending, setPending] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const prevFilterRef = useRef(filter);
  useEffect(() => {
    if (prevFilterRef.current !== filter) {
      prevFilterRef.current = filter;
      setDsl(dslForFilter(filter));
      setPending('');
      setParseError(null);
    }
  }, [filter]);

  const chips = useMemo(() => dslToTokenChips(dsl), [dsl]);
  const groups = useMemo(() => groupChips(chips), [chips]);
  const completions = useMemo(
    () => getDslCompletions({ input: pending, cursor: pending.length, schema }),
    [pending, schema]
  );
  const visibleCompletions = menuOpen ? completions : [];

  const inputLabel = labels?.dslInput ?? 'DSL';
  const applyLabel = labels?.applyDsl ?? 'Apply DSL';

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const commit = useCallback(() => {
    const combined = foldPendingIntoDsl(dsl, pending);
    const result = tryParseDSL(combined);
    if (result.ok) {
      setDsl(formatDSL(result.filter));
      setPending('');
      setParseError(null);
      setMenuOpen(false);
      onCommit(result.filter);
      return;
    }
    setParseError(formatParseError(result.errors));
  }, [dsl, pending, onCommit]);

  const applyCompletion = useCallback(
    (item: CompletionItem) => {
      const { nextDraft } = replaceCurrentSegment(pending, pending.length, item);
      if (item.kind === 'value') {
        setDsl((current) => foldPendingIntoDsl(current, nextDraft));
        setPending('');
        setMenuOpen(false);
      } else {
        // Prime the next segment (operator → value) so completions keep flowing.
        setPending(`${nextDraft}:`);
        setMenuOpen(true);
      }
      setActiveIndex(0);
      focusInput();
    },
    [pending, focusInput]
  );

  const removeCondition = useCallback(
    (range: readonly [number, number]) => {
      setDsl((current) => removeConditionFromDsl(current, range));
      setParseError(null);
      focusInput();
    },
    [focusInput]
  );

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPending(event.target.value);
    setActiveIndex(0);
    setMenuOpen(true);
    setParseError(null);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setMenuOpen(false);
      return;
    }

    if (event.key === 'ArrowDown' && completions.length > 0) {
      event.preventDefault();
      setMenuOpen(true);
      setActiveIndex((index) => (index + 1) % completions.length);
      return;
    }

    if (event.key === 'ArrowUp' && completions.length > 0) {
      event.preventDefault();
      setMenuOpen(true);
      setActiveIndex((index) => (index - 1 + completions.length) % completions.length);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      if (menuOpen && completions.length > 0) {
        applyCompletion(completions[activeIndex] ?? completions[0]);
      } else {
        commit();
      }
      return;
    }

    if (event.key === ' ' && pending.trim() !== '' && !hasUnclosedQuote(pending)) {
      event.preventDefault();
      setDsl((current) => foldPendingIntoDsl(current, pending));
      setPending('');
      setMenuOpen(false);
      return;
    }

    if (event.key === 'Backspace' && pending === '') {
      event.preventDefault();
      setDsl((current) => removeLastChipFromDsl(current));
    }
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex min-h-9 flex-wrap items-center gap-1 rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm focus-within:ring-1 focus-within:ring-ring">
        {groups.map((group) =>
          group.kind === 'condition' ? (
            <span
              className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-1 py-0.5"
              key={group.key}
            >
              {group.chips.map((chip) => (
                <Badge key={chip.id} variant={chip.type}>
                  {chip.text}
                </Badge>
              ))}
              <button
                aria-label={`Remove ${group.chips[0]?.text ?? ''} condition`}
                className="ml-0.5 rounded-sm px-1 text-muted-foreground hover:text-foreground"
                onClick={(event) => {
                  event.stopPropagation();
                  removeCondition(group.range);
                }}
                type="button"
              >
                ×
              </button>
            </span>
          ) : (
            <Badge key={group.key} variant={group.chip.type}>
              {group.chip.text}
            </Badge>
          )
        )}
        <input
          aria-label={inputLabel}
          className="min-w-[8rem] flex-1 border-0 bg-transparent px-1 py-0.5 text-sm outline-none focus-visible:outline-none"
          onChange={handleInputChange}
          onFocus={() => setMenuOpen(true)}
          onKeyDown={handleKeyDown}
          ref={inputRef}
          value={pending}
        />
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={commit}>{applyLabel}</Button>
      </div>
      {parseError ? (
        <div
          className="rounded-md border border-destructive px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {parseError}
        </div>
      ) : null}
      <ShadcnCompletionMenu
        activeIndex={activeIndex}
        className={completionMenuClassName}
        items={visibleCompletions}
        onSelect={applyCompletion}
      />
    </div>
  );
}
