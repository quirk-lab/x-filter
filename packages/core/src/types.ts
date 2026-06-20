export type FieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'time'
  | 'dateTime'
  | 'select'
  | 'multiSelect'
  | 'boolean';

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
  /** When true, the rule is read-only: edit/remove/move mutations are ignored. */
  locked?: boolean;
}

export interface FilterGroup {
  id: string;
  combinator: Combinator;
  not?: boolean;
  /** When true, the group is read-only: edits to it and adds into it are ignored. */
  locked?: boolean;
  children: (FilterRule | FilterGroup)[];
}

export interface FilterGroupIC {
  id: string;
  not?: boolean;
  /** When true, the group is read-only: edits to it and adds into it are ignored. */
  locked?: boolean;
  children: (FilterRule | FilterGroupIC | Combinator)[];
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
  type:
    | 'invalidField'
    | 'invalidOperator'
    | 'invalidValue'
    | 'missingValue'
    | 'invalidGroup'
    | 'invalidCombinator';
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
    'children' in node
  );
}

/** True when a rule/group carries `locked: true`. Safe for `undefined`/`null`. */
export function isLocked(node: { locked?: boolean } | null | undefined): boolean {
  return node?.locked === true;
}
