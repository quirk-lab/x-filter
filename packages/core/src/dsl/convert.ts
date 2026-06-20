import type { IdGenerator } from '../id';
import { generateId } from '../id';
import type { Filter, FilterGroup, FilterRule } from '../types';
import { isFilterRule } from '../types';
import type { ASTCondition, ASTNode, ASTValue } from './types';

function convertASTValue(value: ASTValue): unknown {
  switch (value.type) {
    case 'string':
      return value.value;
    case 'number':
      return value.value;
    case 'boolean':
      return value.value;
    case 'array':
      return value.value.map(convertASTValue);
    case 'range':
      return [convertASTValue(value.from), convertASTValue(value.to)];
  }
}

function collectOperands(node: ASTNode, op: 'and' | 'or', out: ASTNode[]): void {
  if (node.type === 'binary' && node.operator === op) {
    collectOperands(node.left, op, out);
    collectOperands(node.right, op, out);
  } else {
    out.push(node);
  }
}

function convertNode(node: ASTNode, gen: IdGenerator): FilterRule | FilterGroup {
  switch (node.type) {
    case 'condition':
      return {
        id: gen(),
        field: node.field,
        operator: node.operator,
        value: node.value ? convertASTValue(node.value) : undefined,
      };

    case 'not': {
      const inner = convertNode(node.operand, gen);
      return { ...inner, not: !inner.not };
    }

    case 'group':
      if (node.expression === null) {
        return { id: gen(), combinator: 'and', children: [] };
      }
      return convertNode(node.expression, gen);

    case 'binary': {
      const operands: ASTNode[] = [];
      collectOperands(node, node.operator, operands);
      return {
        id: gen(),
        combinator: node.operator,
        children: operands.map((op) => convertNode(op, gen)),
      };
    }
  }
}

export function astToFilter(ast: ASTNode, idGenerator: IdGenerator = generateId): Filter {
  const result = convertNode(ast, idGenerator);
  if ('combinator' in result) return result;
  return { id: idGenerator(), combinator: 'and', children: [result] };
}

function convertValueToAST(value: unknown): ASTValue | null {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string') return { type: 'string', value };
  if (typeof value === 'number') return { type: 'number', value };
  if (typeof value === 'boolean') return { type: 'boolean', value };
  if (Array.isArray(value)) {
    return {
      type: 'array',
      value: value.map((v) => convertValueToAST(v)).filter((v): v is ASTValue => v !== null),
    };
  }
  return { type: 'string', value: String(value) };
}

function convertRuleValueToAST(rule: FilterRule): ASTValue | null {
  if (rule.operator === 'between' && Array.isArray(rule.value) && rule.value.length === 2) {
    const from = convertValueToAST(rule.value[0]);
    const to = convertValueToAST(rule.value[1]);
    if (from && to) {
      return { type: 'range', from, to };
    }
  }
  return convertValueToAST(rule.value);
}

function convertRuleToAST(rule: FilterRule): ASTNode {
  const condition: ASTCondition = {
    type: 'condition',
    field: rule.field,
    operator: rule.operator,
    value: convertRuleValueToAST(rule),
    start: 0,
    end: 0,
  };
  if (rule.not) {
    return { type: 'not', operand: condition, start: 0, end: 0 };
  }
  return condition;
}

function convertGroupToAST(group: FilterGroup): ASTNode {
  let ast: ASTNode;

  if (group.children.length === 0) {
    ast = { type: 'group', expression: null, start: 0, end: 0 };
  } else if (group.children.length === 1) {
    ast = convertFilterNodeToAST(group.children[0]);
  } else {
    const nodes = group.children.map(convertFilterNodeToAST);
    ast = nodes.reduce(
      (left, right): ASTNode => ({
        type: 'binary',
        operator: group.combinator,
        left,
        right,
        start: 0,
        end: 0,
      })
    );
  }

  if (group.not) {
    return { type: 'not', operand: ast, start: 0, end: 0 };
  }
  return ast;
}

function convertFilterNodeToAST(node: FilterRule | FilterGroup): ASTNode {
  if (isFilterRule(node)) return convertRuleToAST(node);
  return convertGroupToAST(node);
}

export function filterToAst(filter: Filter): ASTNode {
  return convertGroupToAST(filter);
}
