import type { SQLResult } from '../types';

type OperatorMapper = (field: string, value: unknown) => SQLResult;

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
    const arr = v as [unknown, unknown];
    return { sql: `${f} BETWEEN ? AND ?`, params: [arr[0], arr[1]] };
  },
  before: (f, v) => ({ sql: `${f} < ?`, params: [v] }),
  after: (f, v) => ({ sql: `${f} > ?`, params: [v] }),
  isEmpty: (f) => ({ sql: `${f} IS NULL`, params: [] }),
  isNotEmpty: (f) => ({ sql: `${f} IS NOT NULL`, params: [] }),
};
