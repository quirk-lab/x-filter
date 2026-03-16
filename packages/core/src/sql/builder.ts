import type { FilterGroup, FilterRule, SQLResult } from '../types';
import { isFilterGroup } from '../types';
import { operatorSQLMap } from './operators';

export function buildRuleSQL(rule: FilterRule): SQLResult {
  const mapper = operatorSQLMap[rule.operator];
  const result = mapper
    ? mapper(rule.field, rule.value)
    : { sql: `${rule.field} ${rule.operator} ?`, params: [rule.value] };

  if (rule.not) {
    return { sql: `NOT (${result.sql})`, params: result.params };
  }
  return result;
}

export function buildGroupSQL(group: FilterGroup): SQLResult {
  if (group.conditions.length === 0) {
    return { sql: '', params: [] };
  }

  const parts: SQLResult[] = group.conditions.map((c) => {
    if (isFilterGroup(c)) {
      return buildGroupSQL(c as FilterGroup);
    }
    return buildRuleSQL(c as FilterRule);
  });

  const validParts = parts.filter((p) => p.sql !== '');
  if (validParts.length === 0) {
    return { sql: '', params: [] };
  }

  const combinator = ` ${group.combinator.toUpperCase()} `;
  const sql = validParts.map((p) => p.sql).join(combinator);
  const params = validParts.flatMap((p) => p.params);

  const wrapped = validParts.length > 1 ? `(${sql})` : sql;
  if (group.not) {
    return { sql: `NOT (${wrapped.startsWith('(') ? sql : wrapped})`, params };
  }
  return { sql: wrapped, params };
}
