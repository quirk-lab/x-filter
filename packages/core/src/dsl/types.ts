import type { FieldSchema } from '../types';

export type TokenType =
  | 'IDENTIFIER'
  | 'STRING'
  | 'COLON'
  | 'LPAREN'
  | 'RPAREN'
  | 'LBRACKET'
  | 'RBRACKET'
  | 'LBRACE'
  | 'RBRACE'
  | 'DOTDOT'
  | 'COMMA'
  | 'AND'
  | 'OR'
  | 'NOT'
  | 'EOF'
  | 'ERROR';

export interface Token {
  type: TokenType;
  value: string;
  start: number;
  end: number;
}

export type ASTNode = ASTCondition | ASTGroup | ASTBinary | ASTNot;

export interface ASTCondition {
  type: 'condition';
  field: string;
  operator: string;
  value: ASTValue | null;
  start: number;
  end: number;
}

export type ASTValue =
  | { type: 'string'; value: string }
  | { type: 'number'; value: number }
  | { type: 'boolean'; value: boolean }
  | { type: 'array'; value: ASTValue[] }
  | { type: 'range'; from: ASTValue; to: ASTValue };

export interface ASTGroup {
  type: 'group';
  expression: ASTNode | null;
  start: number;
  end: number;
}

export interface ASTBinary {
  type: 'binary';
  operator: 'and' | 'or';
  left: ASTNode;
  right: ASTNode;
  start: number;
  end: number;
}

export interface ASTNot {
  type: 'not';
  operand: ASTNode;
  start: number;
  end: number;
}

export interface ParseError {
  code: string;
  message: string;
  start: number;
  end: number;
}

export interface ParseResult {
  ok: boolean;
  ast?: ASTNode;
  errors: ParseError[];
}

export type CompletionKind = 'field' | 'operator' | 'value';

export interface CompletionItem {
  kind: CompletionKind;
  label: string;
  value: string;
  detail?: string;
}

export interface CompletionContext {
  input: string;
  cursor: number;
  schema: FieldSchema[];
}
