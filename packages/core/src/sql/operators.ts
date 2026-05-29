import type { SQLResult } from '../types';

export type OperatorMapper = (field: string, value: unknown) => SQLResult;

function assertArrayValue(value: unknown, operator: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`SQL operator "${operator}" requires an array value`);
  }
  return value;
}

export const operatorSQLMap: Record<string, OperatorMapper> = {
  equals: (f, v) => ({ sql: `${f} = ?`, params: [v] }),
  notEquals: (f, v) => ({ sql: `${f} <> ?`, params: [v] }),
  contains: (f, v) => ({ sql: `${f} LIKE ?`, params: [`%${v}%`] }),
  notContains: (f, v) => ({ sql: `${f} NOT LIKE ?`, params: [`%${v}%`] }),
  startsWith: (f, v) => ({ sql: `${f} LIKE ?`, params: [`${v}%`] }),
  endsWith: (f, v) => ({ sql: `${f} LIKE ?`, params: [`%${v}`] }),
  gt: (f, v) => ({ sql: `${f} > ?`, params: [v] }),
  gte: (f, v) => ({ sql: `${f} >= ?`, params: [v] }),
  lt: (f, v) => ({ sql: `${f} < ?`, params: [v] }),
  lte: (f, v) => ({ sql: `${f} <= ?`, params: [v] }),
  between: (f, v) => {
    if (!Array.isArray(v) || v.length !== 2) {
      throw new Error('SQL operator "between" requires an array of 2 values');
    }
    const arr = v as [unknown, unknown];
    return { sql: `${f} BETWEEN ? AND ?`, params: [arr[0], arr[1]] };
  },
  in: (f, v) => {
    const arr = assertArrayValue(v, 'in');
    if (arr.length === 0) return { sql: '1 = 0', params: [] };
    return { sql: `${f} IN (${arr.map(() => '?').join(', ')})`, params: arr };
  },
  notIn: (f, v) => {
    const arr = assertArrayValue(v, 'notIn');
    if (arr.length === 0) return { sql: '1 = 1', params: [] };
    return { sql: `${f} NOT IN (${arr.map(() => '?').join(', ')})`, params: arr };
  },
  before: (f, v) => ({ sql: `${f} < ?`, params: [v] }),
  after: (f, v) => ({ sql: `${f} > ?`, params: [v] }),
  isEmpty: (f) => ({ sql: `${f} IS NULL`, params: [] }),
  isNotEmpty: (f) => ({ sql: `${f} IS NOT NULL`, params: [] }),
};
