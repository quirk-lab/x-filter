import type { Token, TokenType } from './types';

// ── CharCode helpers (avoid per-char regex) ────────────────────────────

const CC_TAB = 9;
const CC_LF = 10;
const CC_CR = 13;
const CC_SPACE = 32;
const CC_DQUOTE = 34;
const CC_LPAREN = 40;
const CC_RPAREN = 41;
const CC_COMMA = 44;
const CC_MINUS = 45;
const CC_DOT = 46;
const CC_0 = 48;
const CC_9 = 57;
const CC_COLON = 58;
const CC_LBRACKET = 91;
const CC_RBRACKET = 93;
const CC_LBRACE = 123;
const CC_RBRACE = 125;

function isWhitespace(cc: number): boolean {
  return cc === CC_SPACE || cc === CC_TAB || cc === CC_LF || cc === CC_CR || cc === 11 || cc === 12;
}

function isDigitCode(cc: number): boolean {
  return cc >= CC_0 && cc <= CC_9;
}

function isAlphaCode(cc: number): boolean {
  return (cc >= 65 && cc <= 90) || (cc >= 97 && cc <= 122) || cc === 95; // A-Z, a-z, _
}

function isAlphaNumCode(cc: number): boolean {
  return isAlphaCode(cc) || isDigitCode(cc);
}

// ── SINGLE_CHARS map (charCode → TokenType) ────────────────────────────

const SINGLE_CHAR_MAP: Record<number, TokenType> = {
  [CC_COLON]: 'COLON',
  [CC_LPAREN]: 'LPAREN',
  [CC_RPAREN]: 'RPAREN',
  [CC_LBRACKET]: 'LBRACKET',
  [CC_RBRACKET]: 'RBRACKET',
  [CC_LBRACE]: 'LBRACE',
  [CC_RBRACE]: 'RBRACE',
  [CC_COMMA]: 'COMMA',
};

const KEYWORDS: Record<string, TokenType> = {
  AND: 'AND',
  OR: 'OR',
  NOT: 'NOT',
};

// ── Scanners ───────────────────────────────────────────────────────────

function scanString(input: string, pos: number): { value: string; end: number; ok: boolean } {
  const parts: string[] = [];
  let i = pos;
  while (i < input.length) {
    const ch = input[i];
    if (ch === '"') {
      return { value: parts.join(''), end: i + 1, ok: true };
    }
    if (ch === '\\' && i + 1 < input.length) {
      i++;
      const esc = input[i];
      if (esc === 'n') parts.push('\n');
      else if (esc === 't') parts.push('\t');
      else if (esc === '\\') parts.push('\\');
      else if (esc === '"') parts.push('"');
      else parts.push(esc);
    } else {
      parts.push(ch);
    }
    i++;
  }
  return { value: parts.join(''), end: i, ok: false };
}

function scanIdentifier(input: string, pos: number): { value: string; end: number } {
  let i = pos;
  while (i < input.length) {
    const cc = input.charCodeAt(i);
    if (isAlphaNumCode(cc)) {
      i++;
      continue;
    }
    // allow dotted identifiers (e.g. "foo.bar") but not ".."
    if (
      cc === CC_DOT &&
      i + 1 < input.length &&
      input.charCodeAt(i + 1) !== CC_DOT &&
      isAlphaNumCode(input.charCodeAt(i + 1))
    ) {
      i++;
      continue;
    }
    break;
  }
  return { value: input.slice(pos, i), end: i };
}

function scanSignedNumber(input: string, pos: number): { value: string; end: number } {
  let i = pos;
  if (input.charCodeAt(i) === CC_MINUS) i++;

  while (i < input.length && isDigitCode(input.charCodeAt(i))) {
    i++;
  }

  if (
    input.charCodeAt(i) === CC_DOT &&
    i + 1 < input.length &&
    input.charCodeAt(i + 1) !== CC_DOT &&
    isDigitCode(input.charCodeAt(i + 1))
  ) {
    i++;
    while (i < input.length && isDigitCode(input.charCodeAt(i))) {
      i++;
    }
  }

  return { value: input.slice(pos, i), end: i };
}

// ── Main tokenizer ─────────────────────────────────────────────────────

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;

  while (pos < input.length) {
    const cc = input.charCodeAt(pos);

    // whitespace
    if (isWhitespace(cc)) {
      pos++;
      continue;
    }

    // single-char tokens
    const singleType = SINGLE_CHAR_MAP[cc];
    if (singleType) {
      tokens.push({ type: singleType, value: input[pos], start: pos, end: pos + 1 });
      pos++;
      continue;
    }

    // ".." (range)
    if (cc === CC_DOT && pos + 1 < input.length && input.charCodeAt(pos + 1) === CC_DOT) {
      tokens.push({ type: 'DOTDOT', value: '..', start: pos, end: pos + 2 });
      pos += 2;
      continue;
    }

    // quoted string
    if (cc === CC_DQUOTE) {
      const start = pos;
      const result = scanString(input, pos + 1);
      if (result.ok) {
        tokens.push({ type: 'STRING', value: result.value, start, end: result.end });
      } else {
        tokens.push({
          type: 'ERROR',
          value: result.value,
          start,
          end: result.end,
          errorCode: 'UNTERMINATED_STRING',
        });
      }
      pos = result.end;
      continue;
    }

    // negative number
    if (cc === CC_MINUS && pos + 1 < input.length && isDigitCode(input.charCodeAt(pos + 1))) {
      const start = pos;
      const result = scanSignedNumber(input, pos);
      tokens.push({ type: 'IDENTIFIER', value: result.value, start, end: result.end });
      pos = result.end;
      continue;
    }

    // identifier or keyword
    if (isAlphaNumCode(cc)) {
      const start = pos;
      const result = scanIdentifier(input, pos);
      const type = KEYWORDS[result.value.toUpperCase()] ?? 'IDENTIFIER';
      tokens.push({ type, value: result.value, start, end: result.end });
      pos = result.end;
      continue;
    }

    // unknown character
    tokens.push({
      type: 'ERROR',
      value: input[pos],
      start: pos,
      end: pos + 1,
      errorCode: 'UNEXPECTED_CHARACTER',
    });
    pos++;
  }

  tokens.push({ type: 'EOF', value: '', start: pos, end: pos });
  return tokens;
}
