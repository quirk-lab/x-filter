import type { Token } from '@x-filter/core';
import { formatDSL, tokenize, tryParseDSL } from '@x-filter/core';

export type DslChipType = 'field' | 'operator' | 'value' | 'combinator' | 'group';

export interface DslTokenChip {
  id: string;
  type: DslChipType;
  text: string;
  start: number;
  end: number;
  /** [start, end) of the enclosing condition; set on field/operator/value chips. */
  conditionRange?: readonly [number, number];
}

function isValueLike(token: Token | undefined): boolean {
  return !!token && (token.type === 'IDENTIFIER' || token.type === 'STRING');
}

interface ValueSpan {
  start: number;
  end: number;
  nextIndex: number;
}

/**
 * Resolves the span of a condition value starting at token index `j`. Handles
 * scalars (`IDENTIFIER`/`STRING`), arrays (`[...]`) and ranges (`{...}`).
 */
function scanValueSpan(tokens: Token[], j: number): ValueSpan | undefined {
  const token = tokens[j];
  if (!token) return undefined;

  if (token.type === 'LBRACKET' || token.type === 'LBRACE') {
    const closer = token.type === 'LBRACKET' ? 'RBRACKET' : 'RBRACE';
    let k = j;
    while (k < tokens.length && tokens[k].type !== closer && tokens[k].type !== 'EOF') {
      k++;
    }
    const closed = tokens[k]?.type === closer;
    const endToken = closed ? tokens[k] : tokens[k - 1];
    return {
      start: token.start,
      end: endToken?.end ?? token.end,
      nextIndex: closed ? k + 1 : k,
    };
  }

  if (isValueLike(token)) {
    return { start: token.start, end: token.end, nextIndex: j + 1 };
  }

  return undefined;
}

/**
 * Tokenizes a DSL string into display chips. Conditions (`field:op:value`) emit
 * up to three chips sharing a `conditionRange`; combinators and parentheses emit
 * standalone chips. Colons are dropped (they are structural, not displayable).
 */
export function dslToTokenChips(dsl: string): DslTokenChip[] {
  const tokens = tokenize(dsl).filter((token) => token.type !== 'EOF');
  const chips: DslTokenChip[] = [];
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];

    if (token.type === 'AND' || token.type === 'OR' || token.type === 'NOT') {
      chips.push({
        id: `combinator-${token.start}`,
        type: 'combinator',
        text: token.value.toUpperCase(),
        start: token.start,
        end: token.end,
      });
      i++;
      continue;
    }

    if (token.type === 'LPAREN' || token.type === 'RPAREN') {
      chips.push({
        id: `group-${token.start}`,
        type: 'group',
        text: token.value,
        start: token.start,
        end: token.end,
      });
      i++;
      continue;
    }

    if (isValueLike(token)) {
      const fieldToken = token;
      let j = i + 1;
      let operatorToken: Token | undefined;
      let value: ValueSpan | undefined;

      if (tokens[j]?.type === 'COLON') {
        j++;
        if (isValueLike(tokens[j])) {
          operatorToken = tokens[j];
          j++;
          if (tokens[j]?.type === 'COLON') {
            j++;
            value = scanValueSpan(tokens, j);
            if (value) {
              j = value.nextIndex;
            }
          }
        }
      }

      const conditionEnd = value?.end ?? operatorToken?.end ?? fieldToken.end;
      const conditionRange = [fieldToken.start, conditionEnd] as const;

      chips.push({
        id: `field-${fieldToken.start}`,
        type: 'field',
        text: fieldToken.value,
        start: fieldToken.start,
        end: fieldToken.end,
        conditionRange,
      });
      if (operatorToken) {
        chips.push({
          id: `operator-${operatorToken.start}`,
          type: 'operator',
          text: operatorToken.value,
          start: operatorToken.start,
          end: operatorToken.end,
          conditionRange,
        });
      }
      if (value) {
        chips.push({
          id: `value-${value.start}`,
          type: 'value',
          text: dsl.slice(value.start, value.end),
          start: value.start,
          end: value.end,
          conditionRange,
        });
      }

      i = j;
      continue;
    }

    // Structural / stray tokens (COLON, COMMA, brackets, ERROR): not displayed.
    i++;
  }

  return chips;
}

/**
 * Removes a whole condition (by its `[start, end)` range) plus one adjacent
 * combinator. Re-canonicalizes via parse → format when the result still parses;
 * otherwise returns a whitespace-collapsed fallback.
 */
export function removeConditionFromDsl(dsl: string, range: readonly [number, number]): string {
  const [start, end] = range;
  let before = dsl.slice(0, start);
  let after = dsl.slice(end);

  const beforeWithoutCombinator = before.replace(/\s*(?:AND|OR|NOT)\s*$/i, '');
  if (beforeWithoutCombinator !== before) {
    before = beforeWithoutCombinator;
  } else {
    after = after.replace(/^\s*(?:AND|OR|NOT)\s*/i, '');
  }

  const result = `${before} ${after}`.replace(/\s+/g, ' ').trim();
  if (result === '') return '';

  const parsed = tryParseDSL(result);
  return parsed.ok ? formatDSL(parsed.filter) : result;
}

/**
 * Removes the last displayed chip, stripping any now-dangling trailing colon(s)
 * and whitespace. Operates purely on string offsets (no reparse required).
 */
export function removeLastChipFromDsl(dsl: string): string {
  const chips = dslToTokenChips(dsl);
  if (chips.length === 0) return '';
  const last = chips[chips.length - 1];
  return dsl.slice(0, last.start).replace(/[\s:]+$/, '');
}

/** Appends in-progress (`pending`) text to the committed draft with one space. */
export function foldPendingIntoDsl(dsl: string, pending: string): string {
  const trimmedDsl = dsl.trimEnd();
  const trimmedPending = pending.trim();
  if (!trimmedPending) return trimmedDsl;
  if (!trimmedDsl) return trimmedPending;
  return `${trimmedDsl} ${trimmedPending}`;
}

/** True when `text` has an odd number of unescaped double quotes (open string). */
export function hasUnclosedQuote(text: string): boolean {
  let open = false;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\\') {
      i++;
      continue;
    }
    if (text[i] === '"') {
      open = !open;
    }
  }
  return open;
}
