import type { FilterGroup, FilterRule, SQLResult } from '../types';
import { isFilterGroup } from '../types';
import { type OperatorMapper, operatorSQLMap } from './operators';

const IDENTIFIER_SEGMENT = /^[A-Za-z_][A-Za-z0-9_]*$/;

export interface SQLBuildOptions {
  fieldMap?: Record<string, string>;
  quoteIdentifier?: (identifier: string) => string;
  operatorMap?: Partial<Record<string, OperatorMapper>>;
}

function resolveFieldIdentifier(field: string, options: SQLBuildOptions = {}): string {
  const mappedField = options.fieldMap?.[field] ?? field;
  const segments = mappedField.split('.');

  if (segments.length === 0 || segments.some((segment) => !IDENTIFIER_SEGMENT.test(segment))) {
    throw new Error(`Unsafe SQL field identifier: ${field}`);
  }

  if (!options.quoteIdentifier) {
    return mappedField;
  }

  return segments.map(options.quoteIdentifier).join('.');
}

function resolveOperatorMapper(operator: string, options: SQLBuildOptions = {}): OperatorMapper {
  const mapper = options.operatorMap?.[operator] ?? operatorSQLMap[operator];
  if (!mapper) {
    throw new Error(`Unsupported SQL operator: ${operator}`);
  }
  return mapper;
}

function resolveCombinator(combinator: string): 'AND' | 'OR' {
  if (combinator === 'and') return 'AND';
  if (combinator === 'or') return 'OR';
  throw new Error(`Invalid SQL combinator: ${combinator}`);
}

export function buildRuleSQL(rule: FilterRule, options: SQLBuildOptions = {}): SQLResult {
  const field = resolveFieldIdentifier(rule.field, options);
  const mapper = resolveOperatorMapper(rule.operator, options);
  const result = mapper(field, rule.value);

  if (rule.not) {
    return { sql: `NOT (${result.sql})`, params: result.params };
  }
  return result;
}

export function buildGroupSQL(group: FilterGroup, options: SQLBuildOptions = {}): SQLResult {
  if (group.conditions.length === 0) {
    return { sql: '', params: [] };
  }

  const parts: SQLResult[] = group.conditions.map((c) => {
    if (isFilterGroup(c)) {
      return buildGroupSQL(c as FilterGroup, options);
    }
    return buildRuleSQL(c as FilterRule, options);
  });

  const validParts = parts.filter((p) => p.sql !== '');
  if (validParts.length === 0) {
    return { sql: '', params: [] };
  }

  const combinator = ` ${resolveCombinator(group.combinator)} `;
  const sql = validParts.map((p) => p.sql).join(combinator);
  const params = validParts.flatMap((p) => p.params);

  const wrapped = validParts.length > 1 ? `(${sql})` : sql;
  if (group.not) {
    return { sql: `NOT (${wrapped.startsWith('(') ? sql : wrapped})`, params };
  }
  return { sql: wrapped, params };
}
