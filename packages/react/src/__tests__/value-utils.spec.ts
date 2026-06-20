import {
  asArrayValue,
  asPairValue,
  asStringValue,
  parseNumberInput,
  updatePairValue,
} from '../value-utils';

describe('asStringValue', () => {
  it('returns string values as-is', () => {
    expect(asStringValue('hello')).toBe('hello');
  });

  it('returns empty string for null/undefined', () => {
    expect(asStringValue(null)).toBe('');
    expect(asStringValue(undefined)).toBe('');
  });

  it('stringifies other types', () => {
    expect(asStringValue(42)).toBe('42');
    expect(asStringValue(true)).toBe('true');
  });
});

describe('asArrayValue', () => {
  it('returns array elements stringified', () => {
    expect(asArrayValue(['a', 'b'])).toEqual(['a', 'b']);
    expect(asArrayValue([1, 2])).toEqual(['1', '2']);
  });

  it('returns empty array for non-arrays', () => {
    expect(asArrayValue(null)).toEqual([]);
    expect(asArrayValue('hello')).toEqual([]);
    expect(asArrayValue(undefined)).toEqual([]);
  });
});

describe('asPairValue', () => {
  it('extracts first two elements from array', () => {
    expect(asPairValue([10, 20])).toEqual([10, 20]);
    expect(asPairValue([10, 20, 30])).toEqual([10, 20]);
  });

  it('returns undefined pair for non-arrays', () => {
    expect(asPairValue(null)).toEqual([undefined, undefined]);
    expect(asPairValue('hello')).toEqual([undefined, undefined]);
  });
});

describe('parseNumberInput', () => {
  it('parses numeric strings', () => {
    expect(parseNumberInput('42')).toBe(42);
    expect(parseNumberInput('3.14')).toBe(3.14);
  });

  it('returns undefined for empty string', () => {
    expect(parseNumberInput('')).toBeUndefined();
  });
});

describe('updatePairValue', () => {
  it('updates the first element', () => {
    expect(updatePairValue([10, 20], 0, 99)).toEqual([99, 20]);
  });

  it('updates the second element', () => {
    expect(updatePairValue([10, 20], 1, 99)).toEqual([10, 99]);
  });

  it('initializes from non-array value', () => {
    expect(updatePairValue(null, 0, 5)).toEqual([5, undefined]);
  });
});
