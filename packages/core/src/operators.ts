import type { FieldType, OperatorDef } from './types';

const textOperators: OperatorDef[] = [
  { name: 'equals', label: 'equals', arity: 'binary' },
  { name: 'notEquals', label: 'not equals', arity: 'binary' },
  { name: 'contains', label: 'contains', arity: 'binary' },
  { name: 'notContains', label: 'not contains', arity: 'binary' },
  { name: 'startsWith', label: 'starts with', arity: 'binary' },
  { name: 'endsWith', label: 'ends with', arity: 'binary' },
  { name: 'isEmpty', label: 'is empty', arity: 'unary' },
  { name: 'isNotEmpty', label: 'is not empty', arity: 'unary' },
];

const numberOperators: OperatorDef[] = [
  { name: 'equals', label: 'equals', arity: 'binary' },
  { name: 'notEquals', label: 'not equals', arity: 'binary' },
  { name: 'gt', label: '>', arity: 'binary' },
  { name: 'gte', label: '>=', arity: 'binary' },
  { name: 'lt', label: '<', arity: 'binary' },
  { name: 'lte', label: '<=', arity: 'binary' },
  { name: 'between', label: 'between', arity: 'ternary' },
  { name: 'isEmpty', label: 'is empty', arity: 'unary' },
  { name: 'isNotEmpty', label: 'is not empty', arity: 'unary' },
];

// Shared by `date`, `time`, and `dateTime`: equality, ordering (before/after),
// range (between), and emptiness. The value editor varies per type, but the
// operator semantics are identical.
const temporalOperators: OperatorDef[] = [
  { name: 'equals', label: 'equals', arity: 'binary' },
  { name: 'notEquals', label: 'not equals', arity: 'binary' },
  { name: 'before', label: 'before', arity: 'binary' },
  { name: 'after', label: 'after', arity: 'binary' },
  { name: 'between', label: 'between', arity: 'ternary' },
  { name: 'isEmpty', label: 'is empty', arity: 'unary' },
  { name: 'isNotEmpty', label: 'is not empty', arity: 'unary' },
];

const selectOperators: OperatorDef[] = [
  { name: 'equals', label: 'equals', arity: 'binary' },
  { name: 'notEquals', label: 'not equals', arity: 'binary' },
  { name: 'isEmpty', label: 'is empty', arity: 'unary' },
  { name: 'isNotEmpty', label: 'is not empty', arity: 'unary' },
];

const multiSelectOperators: OperatorDef[] = [
  { name: 'contains', label: 'contains', arity: 'binary' },
  { name: 'notContains', label: 'not contains', arity: 'binary' },
  { name: 'isEmpty', label: 'is empty', arity: 'unary' },
  { name: 'isNotEmpty', label: 'is not empty', arity: 'unary' },
];

const booleanOperators: OperatorDef[] = [{ name: 'equals', label: 'equals', arity: 'binary' }];

export const defaultOperators: Record<FieldType, OperatorDef[]> = {
  text: textOperators,
  number: numberOperators,
  date: temporalOperators,
  time: temporalOperators,
  dateTime: temporalOperators,
  select: selectOperators,
  multiSelect: multiSelectOperators,
  boolean: booleanOperators,
};

export function getOperators(fieldType: FieldType, customOperators?: OperatorDef[]): OperatorDef[] {
  return customOperators ?? defaultOperators[fieldType] ?? [];
}
