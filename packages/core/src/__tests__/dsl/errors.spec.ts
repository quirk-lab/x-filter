import { parse, parseDSL, tryParseDSL } from '../../dsl/parse';
import { tokenize } from '../../dsl/tokenize';

const parseInput = (input: string) => parse(tokenize(input));

describe('error handling', () => {
  describe('parse error codes', () => {
    it('EMPTY_EXPRESSION for empty input', () => {
      const result = parseInput('');
      expect(result.ok).toBe(false);
      expect(result.errors).toEqual([
        expect.objectContaining({ code: 'EMPTY_EXPRESSION', start: 0, end: 0 }),
      ]);
    });

    it('EMPTY_EXPRESSION for whitespace-only input', () => {
      const result = parseInput('   ');
      expect(result.ok).toBe(false);
      expect(result.errors[0].code).toBe('EMPTY_EXPRESSION');
    });

    it('UNTERMINATED_STRING for unclosed quote', () => {
      const result = parseInput('"hello');
      expect(result.ok).toBe(false);
      expect(result.errors[0]).toMatchObject({ code: 'UNTERMINATED_STRING' });
    });

    it('UNTERMINATED_STRING for string with escape at end', () => {
      const result = parseInput('"hello\\');
      expect(result.ok).toBe(false);
      expect(result.errors[0].code).toBe('UNTERMINATED_STRING');
    });

    it('EXPECTED_COLON when field has no colon', () => {
      const result = parseInput('status');
      expect(result.ok).toBe(false);
      expect(result.errors[0]).toMatchObject({ code: 'EXPECTED_COLON' });
    });

    it('EXPECTED_OPERATOR when colon not followed by identifier', () => {
      const result = parseInput('field:)');
      expect(result.ok).toBe(false);
      expect(result.errors[0]).toMatchObject({ code: 'EXPECTED_OPERATOR' });
    });

    it('EXPECTED_OPERATOR when colon followed by string', () => {
      const result = parseInput('field:"value"');
      expect(result.ok).toBe(false);
      expect(result.errors[0]).toMatchObject({ code: 'EXPECTED_OPERATOR' });
    });

    it('EXPECTED_RPAREN for unclosed paren', () => {
      const result = parseInput('(a:eq:1');
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.code === 'EXPECTED_RPAREN')).toBe(true);
    });

    it('EXPECTED_RBRACKET for unclosed bracket', () => {
      const result = parseInput('f:op:[a,b');
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.code === 'EXPECTED_RBRACKET')).toBe(true);
    });

    it('EXPECTED_RBRACE for unclosed brace', () => {
      const result = parseInput('f:op:{1..5');
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.code === 'EXPECTED_RBRACE')).toBe(true);
    });

    it('EXPECTED_DOTDOT for missing range separator', () => {
      const result = parseInput('f:op:{1,5}');
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.code === 'EXPECTED_DOTDOT')).toBe(true);
    });

    it('EMPTY_EXPRESSION for empty parens', () => {
      const result = parseInput('()');
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.code === 'EMPTY_EXPRESSION')).toBe(true);
    });

    it('UNEXPECTED_TOKEN for trailing tokens', () => {
      const result = parseInput('a:eq:1 )');
      expect(result.errors.some((e) => e.code === 'UNEXPECTED_TOKEN')).toBe(true);
    });

    it('UNEXPECTED_TOKEN for unknown character', () => {
      const result = parseInput('@');
      expect(result.ok).toBe(false);
      expect(result.errors[0]).toMatchObject({ code: 'UNEXPECTED_TOKEN' });
    });

    it('UNEXPECTED_TOKEN for NOT followed by nothing', () => {
      const result = parseInput('NOT');
      expect(result.ok).toBe(false);
      expect(result.errors[0]).toMatchObject({ code: 'UNEXPECTED_TOKEN' });
    });

    it('UNEXPECTED_TOKEN for NOT followed by EOF', () => {
      const result = parseInput('NOT   ');
      expect(result.ok).toBe(false);
      expect(result.errors[0].code).toBe('UNEXPECTED_TOKEN');
    });

    it('UNEXPECTED_TOKEN for bare RPAREN', () => {
      const result = parseInput(')');
      expect(result.ok).toBe(false);
      expect(result.errors[0].code).toBe('UNEXPECTED_TOKEN');
    });

    it('UNEXPECTED_TOKEN for value in value position that is a symbol', () => {
      const result = parseInput('f:op:)');
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.code === 'UNEXPECTED_TOKEN')).toBe(true);
    });
  });

  describe('error position accuracy', () => {
    it('points to correct position for missing colon', () => {
      const result = parseInput('status');
      expect(result.errors[0]).toMatchObject({ start: 6, end: 6 });
    });

    it('points to correct position for bad character', () => {
      const result = parseInput('  @');
      expect(result.errors[0]).toMatchObject({ start: 2, end: 3 });
    });

    it('points to correct position for unterminated string', () => {
      const result = parseInput('"hello');
      expect(result.errors[0]).toMatchObject({ start: 0, end: 6 });
    });

    it('points to correct position for empty parens', () => {
      const result = parseInput('()');
      const emptyExpr = result.errors.find((e) => e.code === 'EMPTY_EXPRESSION');
      expect(emptyExpr).toBeDefined();
      expect(emptyExpr?.start).toBe(0);
    });

    it('points to trailing token position', () => {
      const result = parseInput('a:eq:1 extra');
      const trailing = result.errors.find((e) => e.code === 'UNEXPECTED_TOKEN');
      expect(trailing).toBeDefined();
      expect(trailing?.start).toBe(7);
    });
  });

  describe('parseDSL throws', () => {
    it('throws on empty input', () => {
      expect(() => parseDSL('')).toThrow();
    });

    it('throws with error code in message', () => {
      expect(() => parseDSL('')).toThrow('EMPTY_EXPRESSION');
    });

    it('throws with position info', () => {
      expect(() => parseDSL('@')).toThrow(/\d+:\d+/);
    });

    it('throws on invalid syntax', () => {
      expect(() => parseDSL('field:')).toThrow();
    });

    it('throws on unterminated string', () => {
      expect(() => parseDSL('"hello')).toThrow();
    });
  });

  describe('tryParseDSL', () => {
    it('returns ok:false with errors for invalid input', () => {
      const result = tryParseDSL('');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].code).toBe('EMPTY_EXPRESSION');
      }
    });

    it('returns ok:false for unterminated string', () => {
      const result = tryParseDSL('"hello');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors[0].code).toBe('UNTERMINATED_STRING');
      }
    });

    it('returns ok:true with filter for valid input', () => {
      const result = tryParseDSL('status:equals:active');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.filter).toBeDefined();
        expect(result.filter.combinator).toBe('and');
      }
    });

    it('returns ok:false for trailing tokens', () => {
      const result = tryParseDSL('a:eq:1 )');
      expect(result.ok).toBe(false);
    });

    it('accepts custom id generator', () => {
      let c = 0;
      const gen = () => `test-${c++}`;
      const result = tryParseDSL('a:eq:1', gen);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.filter.id).toBe('test-1');
      }
    });
  });

  describe('multiple errors', () => {
    it('reports error and still parses trailing tokens check', () => {
      const result = parseInput('(a:eq:1');
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('reports range missing dotdot with recovery', () => {
      const result = parseInput('f:op:{1}');
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('parseValueItem edge cases', () => {
    it('reports error for non-value token inside array', () => {
      const result = parseInput('f:op:[(,b]');
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.code === 'UNEXPECTED_TOKEN')).toBe(true);
    });

    it('reports error for non-value token as range from', () => {
      const result = parseInput('f:op:{(..5}');
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.code === 'UNEXPECTED_TOKEN')).toBe(true);
    });

    it('reports error for non-value token as range to', () => {
      const result = parseInput('f:op:{1..)}');
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.code === 'UNEXPECTED_TOKEN')).toBe(true);
    });

    it('handles range with invalid from followed by rbrace', () => {
      const result = parseInput('f:op:{)}');
      expect(result.ok).toBe(false);
    });

    it('handles range with valid from but missing dotdot followed by rbrace', () => {
      const result = parseInput('f:op:{1}');
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.code === 'EXPECTED_DOTDOT')).toBe(true);
    });

    it('handles range with valid from and dotdot but invalid to followed by rbrace', () => {
      const result = parseInput('f:op:{1..)}');
      expect(result.ok).toBe(false);
    });
  });
});
