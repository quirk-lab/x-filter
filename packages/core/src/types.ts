export type FieldType = 'text' | 'number' | 'date' | 'select' | 'multiSelect' | 'boolean';

export interface OperatorDef {
  name: string;
  label: string;
  arity: 'unary' | 'binary' | 'ternary';
}

export interface Option {
  value: string;
  label: string;
}

export interface FieldSchema {
  name: string;
  label: string;
  type: FieldType;
  operators?: OperatorDef[];
  values?: Option[];
  defaultOperator?: string;
  defaultValue?: unknown;
}

export interface FilterRule {
  id: string;
  field: string;
  operator: string;
  value: unknown;
  not?: boolean;
}

export interface FilterGroup {
  id: string;
  combinator: Combinator;
  not?: boolean;
  conditions: (FilterRule | FilterGroup)[];
}

export interface FilterGroupIC {
  id: string;
  not?: boolean;
  conditions: (FilterRule | FilterGroupIC | Combinator)[];
}

export type Combinator = 'and' | 'or';

export type Filter = FilterGroup;
export type FilterIC = FilterGroupIC;
export type FilterAny = Filter | FilterIC;

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, ValidationError[]>;
}

export interface ValidationError {
  type: 'invalidField' | 'invalidOperator' | 'invalidValue' | 'missingValue';
  message: string;
}

export interface SQLResult {
  sql: string;
  params: unknown[];
}

export function isFilterRule(node: unknown): node is FilterRule {
  return (
    typeof node === 'object' &&
    node !== null &&
    'id' in node &&
    'field' in node &&
    'operator' in node
  );
}

export function isFilterGroup(node: unknown): node is FilterGroup {
  return (
    typeof node === 'object' &&
    node !== null &&
    'id' in node &&
    'combinator' in node &&
    'conditions' in node
  );
}
