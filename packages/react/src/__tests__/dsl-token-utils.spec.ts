import {
  dslToTokenChips,
  foldPendingIntoDsl,
  hasUnclosedQuote,
  removeConditionFromDsl,
  removeLastChipFromDsl,
} from '../dsl-token-utils';

describe('dslToTokenChips', () => {
  it('splits a scalar condition into field/operator/value chips sharing a condition range', () => {
    const chips = dslToTokenChips('status:equals:active');

    expect(chips.map((c) => [c.type, c.text])).toEqual([
      ['field', 'status'],
      ['operator', 'equals'],
      ['value', 'active'],
    ]);
    expect(chips.every((c) => c.conditionRange?.[0] === 0 && c.conditionRange?.[1] === 20)).toBe(
      true
    );
  });

  it('emits a combinator chip between conditions', () => {
    const chips = dslToTokenChips('status:equals:active AND age:gt:18');

    expect(chips.map((c) => c.type)).toEqual([
      'field',
      'operator',
      'value',
      'combinator',
      'field',
      'operator',
      'value',
    ]);
    expect(chips[3]).toMatchObject({ type: 'combinator', text: 'AND' });
  });

  it('handles a field-only fragment', () => {
    const chips = dslToTokenChips('status');
    expect(chips).toHaveLength(1);
    expect(chips[0]).toMatchObject({ type: 'field', text: 'status' });
    expect(chips[0].conditionRange).toEqual([0, 6]);
  });

  it('handles a field:operator fragment with no value', () => {
    const chips = dslToTokenChips('status:equals');
    expect(chips.map((c) => c.type)).toEqual(['field', 'operator']);
    expect(chips[1].conditionRange).toEqual([0, 13]);
  });

  it('keeps a quoted string value as a single chip', () => {
    const chips = dslToTokenChips('name:contains:"Ada Lovelace"');
    const value = chips.find((c) => c.type === 'value');
    expect(value?.text).toBe('"Ada Lovelace"');
  });

  it('keeps an array value as a single chip', () => {
    const chips = dslToTokenChips('tags:in:[a,b]');
    expect(chips.find((c) => c.type === 'value')?.text).toBe('[a,b]');
  });

  it('keeps a range value as a single chip', () => {
    const chips = dslToTokenChips('age:between:{1..10}');
    expect(chips.find((c) => c.type === 'value')?.text).toBe('{1..10}');
  });

  it('emits group chips for parentheses', () => {
    const chips = dslToTokenChips('(status:equals:active)');
    expect(chips.map((c) => c.type)).toEqual(['group', 'field', 'operator', 'value', 'group']);
    expect(chips[0].text).toBe('(');
    expect(chips[4].text).toBe(')');
  });

  it('returns an empty list for empty input', () => {
    expect(dslToTokenChips('')).toEqual([]);
  });
});

describe('removeLastChipFromDsl', () => {
  it('drops the value first, leaving a no-value condition', () => {
    expect(removeLastChipFromDsl('status:equals:active')).toBe('status:equals');
  });

  it('drops the operator next', () => {
    expect(removeLastChipFromDsl('status:equals')).toBe('status');
  });

  it('drops the field last, leaving an empty string', () => {
    expect(removeLastChipFromDsl('status')).toBe('');
  });

  it('drops the trailing value of a multi-condition expression', () => {
    expect(removeLastChipFromDsl('status:equals:active AND age:gt:18')).toBe(
      'status:equals:active AND age:gt'
    );
  });

  it('returns empty string when there are no chips', () => {
    expect(removeLastChipFromDsl('')).toBe('');
  });
});

describe('removeConditionFromDsl', () => {
  it('removes the leading condition and its trailing combinator', () => {
    const dsl = 'status:equals:active AND age:gt:18';
    expect(removeConditionFromDsl(dsl, [0, 20])).toBe('age:gt:18');
  });

  it('removes the trailing condition and its leading combinator', () => {
    const dsl = 'status:equals:active AND age:gt:18';
    const ageValue = dslToTokenChips(dsl).find((c) => c.text === '18');
    expect(ageValue?.conditionRange).toBeDefined();
    const range = ageValue?.conditionRange as [number, number];
    expect(removeConditionFromDsl(dsl, range)).toBe('status:equals:active');
  });

  it('removes the only condition, returning an empty string', () => {
    expect(removeConditionFromDsl('status:equals:active', [0, 20])).toBe('');
  });
});

describe('foldPendingIntoDsl', () => {
  it('returns the pending text when the draft is empty', () => {
    expect(foldPendingIntoDsl('', 'status')).toBe('status');
  });

  it('appends the pending text with a separating space', () => {
    expect(foldPendingIntoDsl('status:equals:active', 'AND')).toBe('status:equals:active AND');
  });

  it('returns the trimmed draft when pending is blank', () => {
    expect(foldPendingIntoDsl('status:equals:active ', '   ')).toBe('status:equals:active');
  });
});

describe('hasUnclosedQuote', () => {
  it('detects an unbalanced quote', () => {
    expect(hasUnclosedQuote('name:contains:"foo')).toBe(true);
  });

  it('treats balanced quotes as closed', () => {
    expect(hasUnclosedQuote('name:contains:"foo"')).toBe(false);
  });

  it('ignores escaped quotes', () => {
    expect(hasUnclosedQuote('name:contains:"a\\"b"')).toBe(false);
  });
});
