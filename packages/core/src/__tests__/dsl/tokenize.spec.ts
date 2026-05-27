import { tokenize } from '../../dsl/tokenize';
import type { Token, TokenType } from '../../dsl/types';

const types = (tokens: Token[]): TokenType[] => tokens.map((t) => t.type);
const values = (tokens: Token[]): string[] => tokens.map((t) => t.value);

describe('tokenize', () => {
  describe('empty and whitespace', () => {
    it('returns only EOF for empty input', () => {
      const tokens = tokenize('');
      expect(tokens).toEqual([{ type: 'EOF', value: '', start: 0, end: 0 }]);
    });

    it('returns only EOF for whitespace-only input', () => {
      const tokens = tokenize('   \t\n  ');
      expect(types(tokens)).toEqual(['EOF']);
    });
  });

  describe('identifiers', () => {
    it('tokenizes a single identifier', () => {
      const tokens = tokenize('status');
      expect(types(tokens)).toEqual(['IDENTIFIER', 'EOF']);
      expect(tokens[0].value).toBe('status');
    });

    it('tokenizes identifier with underscores', () => {
      const tokens = tokenize('my_field');
      expect(tokens[0]).toMatchObject({ type: 'IDENTIFIER', value: 'my_field' });
    });

    it('tokenizes identifier starting with digits', () => {
      const tokens = tokenize('123abc');
      expect(tokens[0]).toMatchObject({ type: 'IDENTIFIER', value: '123abc' });
    });

    it('tokenizes dotted identifier as single token', () => {
      const tokens = tokenize('user.name');
      expect(tokens[0]).toMatchObject({ type: 'IDENTIFIER', value: 'user.name' });
    });

    it('handles multi-level dotted identifier', () => {
      const tokens = tokenize('a.b.c');
      expect(tokens[0]).toMatchObject({ type: 'IDENTIFIER', value: 'a.b.c' });
    });

    it('stops dot-scanning at consecutive dots (..)', () => {
      const tokens = tokenize('a..b');
      expect(types(tokens)).toEqual(['IDENTIFIER', 'DOTDOT', 'IDENTIFIER', 'EOF']);
      expect(values(tokens)).toEqual(['a', '..', 'b', '']);
    });

    it('stops dot-scanning when dot is not followed by alphanumeric', () => {
      const tokens = tokenize('a.(b');
      expect(types(tokens)).toEqual(['IDENTIFIER', 'ERROR', 'LPAREN', 'IDENTIFIER', 'EOF']);
    });
  });

  describe('keywords', () => {
    it.each([
      ['AND', 'AND'],
      ['OR', 'OR'],
      ['NOT', 'NOT'],
      ['and', 'AND'],
      ['or', 'OR'],
      ['not', 'NOT'],
      ['And', 'AND'],
      ['Or', 'OR'],
      ['Not', 'NOT'],
    ] as [string, TokenType][])('tokenizes "%s" as %s', (input, expectedType) => {
      const tokens = tokenize(input);
      expect(tokens[0].type).toBe(expectedType);
      expect(tokens[0].value).toBe(input);
    });
  });

  describe('single-character tokens', () => {
    it('tokenizes colon', () => {
      expect(tokenize(':')[0]).toMatchObject({ type: 'COLON', value: ':' });
    });

    it('tokenizes parentheses', () => {
      const tokens = tokenize('()');
      expect(types(tokens)).toEqual(['LPAREN', 'RPAREN', 'EOF']);
    });

    it('tokenizes brackets', () => {
      const tokens = tokenize('[]');
      expect(types(tokens)).toEqual(['LBRACKET', 'RBRACKET', 'EOF']);
    });

    it('tokenizes braces', () => {
      const tokens = tokenize('{}');
      expect(types(tokens)).toEqual(['LBRACE', 'RBRACE', 'EOF']);
    });

    it('tokenizes comma', () => {
      expect(tokenize(',')[0]).toMatchObject({ type: 'COMMA', value: ',' });
    });

    it('tokenizes dotdot', () => {
      expect(tokenize('..')[0]).toMatchObject({ type: 'DOTDOT', value: '..' });
    });
  });

  describe('strings', () => {
    it('tokenizes simple quoted string', () => {
      const tokens = tokenize('"hello world"');
      expect(tokens[0]).toMatchObject({ type: 'STRING', value: 'hello world' });
    });

    it('tokenizes empty string', () => {
      const tokens = tokenize('""');
      expect(tokens[0]).toMatchObject({ type: 'STRING', value: '' });
    });

    it('handles escape: \\"', () => {
      const tokens = tokenize('"hello \\"world\\""');
      expect(tokens[0]).toMatchObject({ type: 'STRING', value: 'hello "world"' });
    });

    it('handles escape: \\n', () => {
      const tokens = tokenize('"line1\\nline2"');
      expect(tokens[0]).toMatchObject({ type: 'STRING', value: 'line1\nline2' });
    });

    it('handles escape: \\t', () => {
      const tokens = tokenize('"col1\\tcol2"');
      expect(tokens[0]).toMatchObject({ type: 'STRING', value: 'col1\tcol2' });
    });

    it('handles escape: \\\\', () => {
      const tokens = tokenize('"back\\\\slash"');
      expect(tokens[0]).toMatchObject({ type: 'STRING', value: 'back\\slash' });
    });

    it('handles unknown escape as literal', () => {
      const tokens = tokenize('"hello\\xworld"');
      expect(tokens[0]).toMatchObject({ type: 'STRING', value: 'helloxworld' });
    });

    it('returns ERROR for unterminated string', () => {
      const tokens = tokenize('"hello');
      expect(tokens[0].type).toBe('ERROR');
      expect(tokens[0].value).toBe('hello');
    });

    it('returns ERROR for unterminated string with escapes', () => {
      const tokens = tokenize('"hello \\"world');
      expect(tokens[0].type).toBe('ERROR');
    });
  });

  describe('error tokens', () => {
    it('produces ERROR for @', () => {
      const tokens = tokenize('@');
      expect(tokens[0]).toMatchObject({ type: 'ERROR', value: '@' });
    });

    it('produces ERROR for #', () => {
      const tokens = tokenize('#');
      expect(tokens[0]).toMatchObject({ type: 'ERROR', value: '#' });
    });

    it('produces ERROR for standalone dot', () => {
      const tokens = tokenize('.');
      expect(tokens[0]).toMatchObject({ type: 'ERROR', value: '.' });
    });
  });

  describe('whitespace handling', () => {
    it('skips spaces between tokens', () => {
      const tokens = tokenize('a  b  c');
      expect(types(tokens)).toEqual(['IDENTIFIER', 'IDENTIFIER', 'IDENTIFIER', 'EOF']);
    });

    it('skips tabs and newlines', () => {
      const tokens = tokenize('a\t\nb');
      expect(types(tokens)).toEqual(['IDENTIFIER', 'IDENTIFIER', 'EOF']);
    });
  });

  describe('full conditions', () => {
    it('tokenizes field:operator:value', () => {
      const tokens = tokenize('status:equals:active');
      expect(types(tokens)).toEqual([
        'IDENTIFIER',
        'COLON',
        'IDENTIFIER',
        'COLON',
        'IDENTIFIER',
        'EOF',
      ]);
      expect(values(tokens)).toEqual(['status', ':', 'equals', ':', 'active', '']);
    });

    it('tokenizes complex expression with parens and operators', () => {
      const tokens = tokenize('(a:eq:1 AND b:eq:2) OR c:eq:3');
      expect(types(tokens)).toEqual([
        'LPAREN',
        'IDENTIFIER',
        'COLON',
        'IDENTIFIER',
        'COLON',
        'IDENTIFIER',
        'AND',
        'IDENTIFIER',
        'COLON',
        'IDENTIFIER',
        'COLON',
        'IDENTIFIER',
        'RPAREN',
        'OR',
        'IDENTIFIER',
        'COLON',
        'IDENTIFIER',
        'COLON',
        'IDENTIFIER',
        'EOF',
      ]);
    });

    it('tokenizes array value', () => {
      const tokens = tokenize('tags:in:[a,b,c]');
      expect(types(tokens)).toEqual([
        'IDENTIFIER',
        'COLON',
        'IDENTIFIER',
        'COLON',
        'LBRACKET',
        'IDENTIFIER',
        'COMMA',
        'IDENTIFIER',
        'COMMA',
        'IDENTIFIER',
        'RBRACKET',
        'EOF',
      ]);
    });

    it('tokenizes range value', () => {
      const tokens = tokenize('age:between:{18..65}');
      expect(types(tokens)).toEqual([
        'IDENTIFIER',
        'COLON',
        'IDENTIFIER',
        'COLON',
        'LBRACE',
        'IDENTIFIER',
        'DOTDOT',
        'IDENTIFIER',
        'RBRACE',
        'EOF',
      ]);
    });
  });

  describe('position tracking', () => {
    it('tracks positions for simple condition', () => {
      const tokens = tokenize('ab:cd:ef');
      expect(tokens[0]).toMatchObject({ start: 0, end: 2 }); // ab
      expect(tokens[1]).toMatchObject({ start: 2, end: 3 }); // :
      expect(tokens[2]).toMatchObject({ start: 3, end: 5 }); // cd
      expect(tokens[3]).toMatchObject({ start: 5, end: 6 }); // :
      expect(tokens[4]).toMatchObject({ start: 6, end: 8 }); // ef
      expect(tokens[5]).toMatchObject({ start: 8, end: 8 }); // EOF
    });

    it('tracks positions with spaces', () => {
      const tokens = tokenize('a AND b');
      expect(tokens[0]).toMatchObject({ start: 0, end: 1 }); // a
      expect(tokens[1]).toMatchObject({ start: 2, end: 5 }); // AND
      expect(tokens[2]).toMatchObject({ start: 6, end: 7 }); // b
    });

    it('tracks positions for quoted string', () => {
      const tokens = tokenize('"hello"');
      expect(tokens[0]).toMatchObject({ type: 'STRING', start: 0, end: 7 });
    });

    it('tracks positions for dotdot', () => {
      const tokens = tokenize('..');
      expect(tokens[0]).toMatchObject({ start: 0, end: 2 });
    });

    it('tracks positions for error token', () => {
      const tokens = tokenize(' @');
      expect(tokens[0]).toMatchObject({ type: 'ERROR', start: 1, end: 2 });
    });
  });
});
