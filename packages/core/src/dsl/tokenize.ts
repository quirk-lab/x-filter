import type { Token, TokenType } from './types';

const SINGLE_CHARS: Record<string, TokenType> = {
  ':': 'COLON',
  '(': 'LPAREN',
  ')': 'RPAREN',
  '[': 'LBRACKET',
  ']': 'RBRACKET',
  '{': 'LBRACE',
  '}': 'RBRACE',
  ',': 'COMMA',
};

const KEYWORDS: Record<string, TokenType> = {
  AND: 'AND',
  OR: 'OR',
  NOT: 'NOT',
};

const isAlphaNumeric = (ch: string): boolean => /[a-zA-Z0-9_]/.test(ch);

function scanString(input: string, pos: number): { value: string; end: number; ok: boolean } {
  let i = pos;
  let value = '';
  while (i < input.length && input[i] !== '"') {
    if (input[i] === '\\' && i + 1 < input.length) {
      i++;
      const ch = input[i];
      if (ch === 'n') value += '\n';
      else if (ch === 't') value += '\t';
      else if (ch === '\\') value += '\\';
      else if (ch === '"') value += '"';
      else value += ch;
    } else {
      value += input[i];
    }
    i++;
  }
  if (i >= input.length) {
    return { value, end: i, ok: false };
  }
  return { value, end: i + 1, ok: true };
}

function scanIdentifier(input: string, pos: number): { value: string; end: number } {
  let i = pos;
  while (i < input.length) {
    const ch = input[i];
    if (isAlphaNumeric(ch)) {
      i++;
      continue;
    }
    if (
      ch === '.' &&
      i + 1 < input.length &&
      input[i + 1] !== '.' &&
      isAlphaNumeric(input[i + 1])
    ) {
      i++;
      continue;
    }
    break;
  }
  return { value: input.slice(pos, i), end: i };
}

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;

  while (pos < input.length) {
    const ch = input[pos];

    if (/\s/.test(ch)) {
      pos++;
      continue;
    }

    const singleType = SINGLE_CHARS[ch];
    if (singleType) {
      tokens.push({ type: singleType, value: ch, start: pos, end: pos + 1 });
      pos++;
      continue;
    }

    if (ch === '.' && pos + 1 < input.length && input[pos + 1] === '.') {
      tokens.push({ type: 'DOTDOT', value: '..', start: pos, end: pos + 2 });
      pos += 2;
      continue;
    }

    if (ch === '"') {
      const start = pos;
      const result = scanString(input, pos + 1);
      if (result.ok) {
        tokens.push({ type: 'STRING', value: result.value, start, end: result.end });
      } else {
        tokens.push({ type: 'ERROR', value: result.value, start, end: result.end });
      }
      pos = result.end;
      continue;
    }

    if (isAlphaNumeric(ch)) {
      const start = pos;
      const result = scanIdentifier(input, pos);
      const type = KEYWORDS[result.value.toUpperCase()] ?? 'IDENTIFIER';
      tokens.push({ type, value: result.value, start, end: result.end });
      pos = result.end;
      continue;
    }

    tokens.push({ type: 'ERROR', value: ch, start: pos, end: pos + 1 });
    pos++;
  }

  tokens.push({ type: 'EOF', value: '', start: pos, end: pos });
  return tokens;
}
