import { convertFromIC, isFilterGroupIC } from '../ic';
import type { FilterAny, FilterGroup, FilterRule } from '../types';
import { isFilterGroup } from '../types';

/**
 * A JsonLogic expression. See https://jsonlogic.com for the spec. The shape is
 * intentionally permissive: operators map to either a single operand or an
 * array of operands, and `{ var: 'field' }` is the variable accessor.
 */
export type JsonLogic =
  | boolean
  | number
  | string
  | null
  | JsonLogic[]
  | { [operator: string]: JsonLogic | JsonLogic[] };

export interface JsonLogicBuildOptions {
  /** Maps public field names to the variable path used in the output. */
  fieldMap?: Record<string, string>;
}

type JsonLogicMapper = (variable: JsonLogic, value: unknown) => JsonLogic;

function assertArray(value: unknown, operator: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`JsonLogic operator "${operator}" requires an array value`);
  }
  return value;
}

function assertPair(value: unknown, operator: string): [unknown, unknown] {
  if (!Array.isArray(value) || value.length !== 2) {
    throw new Error(`JsonLogic operator "${operator}" requires an array of 2 values`);
  }
  return value as [unknown, unknown];
}

const operatorMap: Record<string, JsonLogicMapper> = {
  equals: (v, value) => ({ '==': [v, value as JsonLogic] }),
  notEquals: (v, value) => ({ '!=': [v, value as JsonLogic] }),
  contains: (v, value) => ({ in: [value as JsonLogic, v] }),
  notContains: (v, value) => ({ '!': { in: [value as JsonLogic, v] } }),
  startsWith: (v, value) => ({ startsWith: [v, value as JsonLogic] }),
  endsWith: (v, value) => ({ endsWith: [v, value as JsonLogic] }),
  gt: (v, value) => ({ '>': [v, value as JsonLogic] }),
  gte: (v, value) => ({ '>=': [v, value as JsonLogic] }),
  lt: (v, value) => ({ '<': [v, value as JsonLogic] }),
  lte: (v, value) => ({ '<=': [v, value as JsonLogic] }),
  before: (v, value) => ({ '<': [v, value as JsonLogic] }),
  after: (v, value) => ({ '>': [v, value as JsonLogic] }),
  between: (v, value) => {
    const [min, max] = assertPair(value, 'between');
    return { '<=': [min as JsonLogic, v, max as JsonLogic] };
  },
  in: (v, value) => ({ in: [v, assertArray(value, 'in') as JsonLogic[]] }),
  notIn: (v, value) => ({ '!': { in: [v, assertArray(value, 'notIn') as JsonLogic[]] } }),
  isEmpty: (v) => ({ '==': [v, null] }),
  isNotEmpty: (v) => ({ '!=': [v, null] }),
};

function buildRule(rule: FilterRule, options: JsonLogicBuildOptions): JsonLogic {
  const mapper = operatorMap[rule.operator];
  if (!mapper) {
    throw new Error(`Unsupported JsonLogic operator: ${rule.operator}`);
  }
  const variable: JsonLogic = { var: options.fieldMap?.[rule.field] ?? rule.field };
  const node = mapper(variable, rule.value);
  return rule.not ? { '!': node } : node;
}

function buildGroup(group: FilterGroup, options: JsonLogicBuildOptions): JsonLogic | undefined {
  const parts = group.children
    .map((child) =>
      isFilterGroup(child)
        ? buildGroup(child as FilterGroup, options)
        : buildRule(child as FilterRule, options)
    )
    .filter((part): part is JsonLogic => part !== undefined);

  if (parts.length === 0) {
    return undefined;
  }

  const combinator = group.combinator === 'or' ? 'or' : 'and';
  const inner: JsonLogic = parts.length === 1 ? parts[0] : { [combinator]: parts };
  return group.not ? { '!': inner } : inner;
}

/**
 * Compiles a filter into a JsonLogic rule object. An empty filter compiles to
 * `true` (matches everything, i.e. no constraints).
 */
export function toJsonLogic(filter: FilterAny, options: JsonLogicBuildOptions = {}): JsonLogic {
  const standard = isFilterGroupIC(filter) ? convertFromIC(filter) : (filter as FilterGroup);
  return buildGroup(standard, options) ?? true;
}
