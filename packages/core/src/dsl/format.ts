import type { Filter } from '../types';
import { filterToAst } from './convert';
import type { ASTCondition, ASTNode, ASTValue } from './types';

const PREC_OR = 1;
const PREC_AND = 2;
const PREC_NOT = 3;

function needsQuoting(s: string): boolean {
  if (s.length === 0) return true;
  if (!/^[a-zA-Z0-9_.]+$/.test(s)) return true;
  if (s.includes('..')) return true;
  const upper = s.toUpperCase();
  if (upper === 'AND' || upper === 'OR' || upper === 'NOT') return true;
  if (s === 'true' || s === 'false') return true;
  if (/^\d+(\.\d+)?$/.test(s)) return true;
  return false;
}

function escapeString(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function formatValueNode(value: ASTValue): string {
  switch (value.type) {
    case 'string':
      return needsQuoting(value.value) ? `"${escapeString(value.value)}"` : value.value;
    case 'number':
      return String(value.value);
    case 'boolean':
      return String(value.value);
    case 'array':
      return `[${value.value.map(formatValueNode).join(',')}]`;
    case 'range':
      return `{${formatValueNode(value.from)}..${formatValueNode(value.to)}}`;
  }
}

function formatCondition(node: ASTCondition): string {
  if (node.value === null) {
    return `${node.field}:${node.operator}`;
  }
  return `${node.field}:${node.operator}:${formatValueNode(node.value)}`;
}

function formatNode(node: ASTNode, parentPrec: number): string {
  switch (node.type) {
    case 'condition':
      return formatCondition(node);

    case 'not':
      return `NOT ${formatNode(node.operand, PREC_NOT)}`;

    case 'binary': {
      const prec = node.operator === 'and' ? PREC_AND : PREC_OR;
      const left = formatNode(node.left, prec);
      const right = formatNode(node.right, prec);
      const op = node.operator === 'and' ? 'AND' : 'OR';
      const result = `${left} ${op} ${right}`;
      return prec < parentPrec ? `(${result})` : result;
    }

    case 'group':
      return `(${formatNode(node.expression, 0)})`;
  }
}

export function formatAST(ast: ASTNode): string {
  return formatNode(ast, 0);
}

export function formatDSL(filter: Filter): string {
  return formatAST(filterToAst(filter));
}
