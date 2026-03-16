import { parse } from '../../dsl/parse';
import { tokenize } from '../../dsl/tokenize';
import type { ASTNode, ParseResult } from '../../dsl/types';

const p = (input: string): ParseResult => parse(tokenize(input));

const expectOk = (input: string): ASTNode => {
  const result = p(input);
  expect(result.ok).toBe(true);
  expect(result.errors).toEqual([]);
  expect(result.ast).toBeDefined();
  return result.ast as ASTNode;
};

const expectFail = (input: string, code?: string): ParseResult => {
  const result = p(input);
  expect(result.ok).toBe(false);
  expect(result.errors.length).toBeGreaterThan(0);
  if (code) expect(result.errors[0].code).toBe(code);
  return result;
};

describe('parse', () => {
  describe('simple conditions', () => {
    it('parses field:operator:value', () => {
      const ast = expectOk('status:equals:active');
      expect(ast).toMatchObject({
        type: 'condition',
        field: 'status',
        operator: 'equals',
        value: { type: 'string', value: 'active' },
      });
    });

    it('parses condition with quoted string value', () => {
      const ast = expectOk('name:equals:"John Doe"');
      expect(ast).toMatchObject({
        type: 'condition',
        field: 'name',
        operator: 'equals',
        value: { type: 'string', value: 'John Doe' },
      });
    });

    it('parses condition with number value', () => {
      const ast = expectOk('age:equals:42');
      expect(ast).toMatchObject({
        type: 'condition',
        field: 'age',
        operator: 'equals',
        value: { type: 'number', value: 42 },
      });
    });

    it('parses condition with decimal number value', () => {
      const ast = expectOk('score:gt:3.14');
      expect(ast).toMatchObject({
        type: 'condition',
        value: { type: 'number', value: 3.14 },
      });
    });

    it('parses condition with boolean true', () => {
      const ast = expectOk('active:equals:true');
      expect(ast).toMatchObject({
        type: 'condition',
        value: { type: 'boolean', value: true },
      });
    });

    it('parses condition with boolean false', () => {
      const ast = expectOk('active:equals:false');
      expect(ast).toMatchObject({
        type: 'condition',
        value: { type: 'boolean', value: false },
      });
    });

    it('parses unary condition (no value)', () => {
      const ast = expectOk('status:isEmpty');
      expect(ast).toMatchObject({
        type: 'condition',
        field: 'status',
        operator: 'isEmpty',
        value: null,
      });
    });

    it('parses dotted field name', () => {
      const ast = expectOk('user.name:equals:john');
      expect(ast).toMatchObject({
        type: 'condition',
        field: 'user.name',
        operator: 'equals',
      });
    });
  });

  describe('array values', () => {
    it('parses array value', () => {
      const ast = expectOk('tags:contains:[a,b,c]');
      expect(ast).toMatchObject({
        type: 'condition',
        value: {
          type: 'array',
          value: [
            { type: 'string', value: 'a' },
            { type: 'string', value: 'b' },
            { type: 'string', value: 'c' },
          ],
        },
      });
    });

    it('parses empty array', () => {
      const ast = expectOk('tags:contains:[]');
      expect(ast).toMatchObject({
        type: 'condition',
        value: { type: 'array', value: [] },
      });
    });

    it('parses array with quoted strings', () => {
      const ast = expectOk('tags:in:["hello world","foo bar"]');
      expect(ast).toMatchObject({
        type: 'condition',
        value: {
          type: 'array',
          value: [
            { type: 'string', value: 'hello world' },
            { type: 'string', value: 'foo bar' },
          ],
        },
      });
    });

    it('parses array with numbers', () => {
      const ast = expectOk('ids:in:[1,2,3]');
      expect(ast).toMatchObject({
        type: 'condition',
        value: {
          type: 'array',
          value: [
            { type: 'number', value: 1 },
            { type: 'number', value: 2 },
            { type: 'number', value: 3 },
          ],
        },
      });
    });
  });

  describe('range values', () => {
    it('parses range value', () => {
      const ast = expectOk('age:between:{18..65}');
      expect(ast).toMatchObject({
        type: 'condition',
        value: {
          type: 'range',
          from: { type: 'number', value: 18 },
          to: { type: 'number', value: 65 },
        },
      });
    });

    it('parses range with string values', () => {
      const ast = expectOk('name:between:{abc..xyz}');
      expect(ast).toMatchObject({
        type: 'condition',
        value: {
          type: 'range',
          from: { type: 'string', value: 'abc' },
          to: { type: 'string', value: 'xyz' },
        },
      });
    });
  });

  describe('NOT expressions', () => {
    it('parses NOT condition', () => {
      const ast = expectOk('NOT status:equals:active');
      expect(ast).toMatchObject({
        type: 'not',
        operand: {
          type: 'condition',
          field: 'status',
          operator: 'equals',
          value: { type: 'string', value: 'active' },
        },
      });
    });

    it('parses NOT with group', () => {
      const ast = expectOk('NOT (a:eq:1 OR b:eq:2)');
      expect(ast).toMatchObject({
        type: 'not',
        operand: {
          type: 'group',
          expression: {
            type: 'binary',
            operator: 'or',
          },
        },
      });
    });
  });

  describe('binary expressions', () => {
    it('parses AND expression', () => {
      const ast = expectOk('a:eq:1 AND b:eq:2');
      expect(ast).toMatchObject({
        type: 'binary',
        operator: 'and',
        left: { type: 'condition', field: 'a' },
        right: { type: 'condition', field: 'b' },
      });
    });

    it('parses OR expression', () => {
      const ast = expectOk('a:eq:1 OR b:eq:2');
      expect(ast).toMatchObject({
        type: 'binary',
        operator: 'or',
        left: { type: 'condition', field: 'a' },
        right: { type: 'condition', field: 'b' },
      });
    });

    it('AND binds tighter than OR (precedence)', () => {
      const ast = expectOk('a:eq:1 OR b:eq:2 AND c:eq:3');
      expect(ast).toMatchObject({
        type: 'binary',
        operator: 'or',
        left: { type: 'condition', field: 'a' },
        right: {
          type: 'binary',
          operator: 'and',
          left: { type: 'condition', field: 'b' },
          right: { type: 'condition', field: 'c' },
        },
      });
    });

    it('respects parenthesized grouping', () => {
      const ast = expectOk('(a:eq:1 OR b:eq:2) AND c:eq:3');
      expect(ast).toMatchObject({
        type: 'binary',
        operator: 'and',
        left: {
          type: 'group',
          expression: { type: 'binary', operator: 'or' },
        },
        right: { type: 'condition', field: 'c' },
      });
    });

    it('parses nested groups', () => {
      const ast = expectOk('(a:eq:1 AND (b:eq:2 OR c:eq:3))');
      expect(ast).toMatchObject({
        type: 'group',
        expression: {
          type: 'binary',
          operator: 'and',
          right: {
            type: 'group',
            expression: { type: 'binary', operator: 'or' },
          },
        },
      });
    });

    it('parses multiple chained ANDs', () => {
      const ast = expectOk('a:eq:1 AND b:eq:2 AND c:eq:3');
      expect(ast).toMatchObject({
        type: 'binary',
        operator: 'and',
        left: {
          type: 'binary',
          operator: 'and',
          left: { type: 'condition', field: 'a' },
          right: { type: 'condition', field: 'b' },
        },
        right: { type: 'condition', field: 'c' },
      });
    });

    it('parses multiple chained ORs', () => {
      const ast = expectOk('a:eq:1 OR b:eq:2 OR c:eq:3');
      expect(ast).toMatchObject({
        type: 'binary',
        operator: 'or',
        left: {
          type: 'binary',
          operator: 'or',
          left: { type: 'condition', field: 'a' },
          right: { type: 'condition', field: 'b' },
        },
        right: { type: 'condition', field: 'c' },
      });
    });
  });

  describe('keywords as field names', () => {
    it('treats AND as field name when followed by colon', () => {
      const ast = expectOk('and:eq:1');
      expect(ast).toMatchObject({
        type: 'condition',
        field: 'and',
        operator: 'eq',
      });
    });

    it('treats OR as field name when followed by colon', () => {
      const ast = expectOk('or:eq:1');
      expect(ast).toMatchObject({
        type: 'condition',
        field: 'or',
      });
    });

    it('treats NOT as field name when followed by colon', () => {
      const ast = expectOk('not:eq:1');
      expect(ast).toMatchObject({
        type: 'condition',
        field: 'not',
      });
    });

    it('keywords as field in compound expression', () => {
      const ast = expectOk('and:eq:1 AND or:eq:2');
      expect(ast).toMatchObject({
        type: 'binary',
        operator: 'and',
        left: { type: 'condition', field: 'and' },
        right: { type: 'condition', field: 'or' },
      });
    });
  });

  describe('position tracking', () => {
    it('records correct start/end for condition', () => {
      const ast = expectOk('status:equals:active');
      expect(ast.start).toBe(0);
      expect(ast.end).toBe(20);
    });

    it('records correct positions for binary', () => {
      const ast = expectOk('a:eq:1 AND b:eq:2');
      expect(ast.start).toBe(0);
      expect(ast.end).toBe(17);
    });

    it('records correct positions for NOT', () => {
      const ast = expectOk('NOT a:eq:1');
      expect(ast.start).toBe(0);
      expect(ast.end).toBe(10);
    });
  });

  describe('error cases', () => {
    it('returns error for empty input', () => {
      expectFail('', 'EMPTY_EXPRESSION');
    });

    it('returns error for identifier without colon', () => {
      expectFail('status', 'EXPECTED_COLON');
    });

    it('returns error for missing operator after colon', () => {
      expectFail('field:)', 'EXPECTED_OPERATOR');
    });

    it('returns error for unterminated parenthesis', () => {
      const result = p('(a:eq:1');
      expect(result.errors.some((e) => e.code === 'EXPECTED_RPAREN')).toBe(true);
    });

    it('returns error for empty parens', () => {
      const result = p('()');
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.code === 'EMPTY_EXPRESSION')).toBe(true);
    });

    it('returns error for unknown character', () => {
      expectFail('@', 'UNEXPECTED_TOKEN');
    });

    it('returns error for trailing tokens', () => {
      const result = p('a:eq:1 )');
      expect(result.errors.some((e) => e.code === 'UNEXPECTED_TOKEN')).toBe(true);
    });

    it('returns error for NOT followed by nothing', () => {
      expectFail('NOT', 'UNEXPECTED_TOKEN');
    });

    it('returns error for unterminated string', () => {
      expectFail('"hello', 'UNTERMINATED_STRING');
    });

    it('returns error for missing closing bracket', () => {
      const result = p('tags:in:[a,b');
      expect(result.errors.some((e) => e.code === 'EXPECTED_RBRACKET')).toBe(true);
    });

    it('returns error for missing closing brace', () => {
      const result = p('age:between:{1..5');
      expect(result.errors.some((e) => e.code === 'EXPECTED_RBRACE')).toBe(true);
    });

    it('returns error for missing dotdot in range', () => {
      const result = p('age:between:{1,5}');
      expect(result.errors.some((e) => e.code === 'EXPECTED_DOTDOT')).toBe(true);
    });
  });
});
