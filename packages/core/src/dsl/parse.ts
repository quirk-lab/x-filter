import type { IdGenerator } from '../id';
import { generateId } from '../id';
import type { Filter } from '../types';
import { astToFilter } from './convert';
import { tokenize } from './tokenize';
import type {
  ASTCondition,
  ASTNode,
  ASTValue,
  ParseError,
  ParseResult,
  Token,
  TokenType,
} from './types';

function isIdentLike(token: Token): boolean {
  return (
    token.type === 'IDENTIFIER' ||
    token.type === 'AND' ||
    token.type === 'OR' ||
    token.type === 'NOT'
  );
}

function interpretBareValue(text: string): ASTValue {
  if (text === 'true') return { type: 'boolean', value: true };
  if (text === 'false') return { type: 'boolean', value: false };
  if (/^\d+(\.\d+)?$/.test(text)) return { type: 'number', value: Number(text) };
  return { type: 'string', value: text };
}

export function parse(tokens: Token[]): ParseResult {
  const errors: ParseError[] = [];
  let pos = 0;
  let lastEnd = 0;

  const peek = (): Token => tokens[pos] ?? tokens[tokens.length - 1];
  const lookAhead = (offset: number): Token | undefined => tokens[pos + offset];

  function advance(): Token {
    const t = tokens[pos++];
    lastEnd = t.end;
    return t;
  }

  function expect(type: TokenType, code: string): Token | undefined {
    if (peek().type === type) return advance();
    const t = peek();
    errors.push({
      code,
      message: `Expected ${type}, got ${t.type}${t.value ? ` "${t.value}"` : ''}`,
      start: t.start,
      end: t.end,
    });
    return undefined;
  }

  function parseExpression(): ASTNode | undefined {
    return parseOr();
  }

  function parseOr(): ASTNode | undefined {
    let left = parseAnd();
    if (!left) return undefined;
    while (peek().type === 'OR' && lookAhead(1)?.type !== 'COLON') {
      advance();
      const right = parseAnd();
      if (!right) return left;
      left = { type: 'binary', operator: 'or', left, right, start: left.start, end: right.end };
    }
    return left;
  }

  function parseAnd(): ASTNode | undefined {
    let left = parseUnary();
    if (!left) return undefined;
    while (peek().type === 'AND' && lookAhead(1)?.type !== 'COLON') {
      advance();
      const right = parseUnary();
      if (!right) return left;
      left = { type: 'binary', operator: 'and', left, right, start: left.start, end: right.end };
    }
    return left;
  }

  function parseUnary(): ASTNode | undefined {
    if (peek().type === 'NOT' && lookAhead(1)?.type !== 'COLON') {
      const notToken = advance();
      const operand = parseAtom();
      if (!operand) {
        errors.push({
          code: 'UNEXPECTED_TOKEN',
          message: 'Expected expression after NOT',
          start: notToken.start,
          end: notToken.end,
        });
        return undefined;
      }
      return { type: 'not', operand, start: notToken.start, end: operand.end };
    }
    return parseAtom();
  }

  function parseAtom(): ASTNode | undefined {
    const token = peek();

    if (token.type === 'LPAREN') return parseGroup();

    if (isIdentLike(token)) return parseCondition();

    if (token.type === 'ERROR') {
      const t = advance();
      errors.push({
        code: t.value.length > 1 ? 'UNTERMINATED_STRING' : 'UNEXPECTED_TOKEN',
        message: t.value.length > 1 ? 'Unterminated string' : `Unexpected character "${t.value}"`,
        start: t.start,
        end: t.end,
      });
      return undefined;
    }

    if (token.type === 'EOF') return undefined;

    const t = advance();
    errors.push({
      code: 'UNEXPECTED_TOKEN',
      message: `Unexpected ${t.type}${t.value ? ` "${t.value}"` : ''}`,
      start: t.start,
      end: t.end,
    });
    return undefined;
  }

  function parseGroup(): ASTNode | undefined {
    const lp = advance();
    const expr = parseExpression();

    if (!expr) {
      errors.push({
        code: 'EMPTY_EXPRESSION',
        message: 'Empty parenthesized expression',
        start: lp.start,
        end: peek().end,
      });
      if (peek().type === 'RPAREN') advance();
      return undefined;
    }

    const rp = expect('RPAREN', 'EXPECTED_RPAREN');
    return {
      type: 'group',
      expression: expr,
      start: lp.start,
      end: rp ? rp.end : expr.end,
    };
  }

  function parseCondition(): ASTCondition | undefined {
    const fieldToken = advance();

    if (!expect('COLON', 'EXPECTED_COLON')) return undefined;

    const opToken = peek();
    if (!isIdentLike(opToken)) {
      errors.push({
        code: 'EXPECTED_OPERATOR',
        message: `Expected operator, got ${opToken.type}${opToken.value ? ` "${opToken.value}"` : ''}`,
        start: opToken.start,
        end: opToken.end,
      });
      return undefined;
    }
    advance();

    let value: ASTValue | null = null;
    if (peek().type === 'COLON') {
      advance();
      const v = parseValue();
      if (v) value = v;
    }

    return {
      type: 'condition',
      field: fieldToken.value,
      operator: opToken.value,
      value,
      start: fieldToken.start,
      end: lastEnd,
    };
  }

  function parseValue(): ASTValue | undefined {
    const token = peek();

    if (token.type === 'LBRACKET') return parseArray();
    if (token.type === 'LBRACE') return parseRange();

    if (token.type === 'STRING') {
      advance();
      return { type: 'string', value: token.value };
    }

    if (isIdentLike(token)) {
      advance();
      return interpretBareValue(token.value);
    }

    errors.push({
      code: 'UNEXPECTED_TOKEN',
      message: `Expected value, got ${token.type}${token.value ? ` "${token.value}"` : ''}`,
      start: token.start,
      end: token.end,
    });
    return undefined;
  }

  function parseValueItem(): ASTValue | undefined {
    const token = peek();

    if (token.type === 'STRING') {
      advance();
      return { type: 'string', value: token.value };
    }

    if (isIdentLike(token)) {
      advance();
      return interpretBareValue(token.value);
    }

    errors.push({
      code: 'UNEXPECTED_TOKEN',
      message: `Expected value item, got ${token.type}${token.value ? ` "${token.value}"` : ''}`,
      start: token.start,
      end: token.end,
    });
    return undefined;
  }

  function parseArray(): ASTValue | undefined {
    advance();
    const items: ASTValue[] = [];

    if (peek().type === 'RBRACKET') {
      advance();
      return { type: 'array', value: items };
    }

    const first = parseValueItem();
    if (first) items.push(first);

    while (peek().type === 'COMMA') {
      advance();
      const item = parseValueItem();
      if (item) items.push(item);
    }

    if (!expect('RBRACKET', 'EXPECTED_RBRACKET')) {
      return { type: 'array', value: items };
    }
    return { type: 'array', value: items };
  }

  function parseRange(): ASTValue | undefined {
    advance();

    const from = parseValueItem();
    if (!from) {
      if (peek().type === 'RBRACE') advance();
      return undefined;
    }

    if (!expect('DOTDOT', 'EXPECTED_DOTDOT')) {
      if (peek().type === 'RBRACE') advance();
      return undefined;
    }

    const to = parseValueItem();
    if (!to) {
      if (peek().type === 'RBRACE') advance();
      return undefined;
    }

    if (!expect('RBRACE', 'EXPECTED_RBRACE')) {
      return { type: 'range', from, to };
    }
    return { type: 'range', from, to };
  }

  const ast = parseExpression();

  if (!ast && errors.length === 0) {
    errors.push({
      code: 'EMPTY_EXPRESSION',
      message: 'Empty expression',
      start: 0,
      end: 0,
    });
  }

  if (ast && peek().type !== 'EOF') {
    const remaining = peek();
    errors.push({
      code: 'UNEXPECTED_TOKEN',
      message: `Unexpected token after expression: ${remaining.type}${remaining.value ? ` "${remaining.value}"` : ''}`,
      start: remaining.start,
      end: remaining.end,
    });
  }

  return {
    ok: errors.length === 0 && ast !== undefined,
    ast,
    errors,
  };
}

export function parseDSL(input: string, idGenerator: IdGenerator = generateId): Filter {
  const tokens = tokenize(input);
  const result = parse(tokens);
  if (!result.ok || !result.ast) {
    throw new Error(
      result.errors.length > 0
        ? result.errors.map((e) => `[${e.code}] ${e.message} (${e.start}:${e.end})`).join('; ')
        : 'Failed to parse DSL expression'
    );
  }
  return astToFilter(result.ast, idGenerator);
}

export function tryParseDSL(
  input: string,
  idGenerator: IdGenerator = generateId
): { ok: true; filter: Filter } | { ok: false; errors: ParseError[] } {
  const tokens = tokenize(input);
  const result = parse(tokens);
  if (!result.ok || !result.ast) {
    return { ok: false, errors: result.errors };
  }
  return { ok: true, filter: astToFilter(result.ast, idGenerator) };
}
