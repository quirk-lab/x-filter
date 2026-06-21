import { convertFromIC, isFilterGroupIC } from '../ic';
import type { FilterAny, FilterGroup, FilterRule } from '../types';
import { isFilterGroup } from '../types';

/** A MongoDB query document (the kind you pass to `collection.find(...)`). */
export type MongoQuery = Record<string, unknown>;

export interface MongoBuildOptions {
  /** Maps public field names to the document field path used in the output. */
  fieldMap?: Record<string, string>;
}

type MongoMapper = (field: string, value: unknown) => MongoQuery;

const REGEX_SPECIAL = /[.*+?^${}()|[\]\\]/g;

function escapeRegex(value: unknown): string {
  return String(value).replace(REGEX_SPECIAL, '\\$&');
}

function assertArray(value: unknown, operator: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`MongoDB operator "${operator}" requires an array value`);
  }
  return value;
}

function assertPair(value: unknown, operator: string): [unknown, unknown] {
  if (!Array.isArray(value) || value.length !== 2) {
    throw new Error(`MongoDB operator "${operator}" requires an array of 2 values`);
  }
  return value as [unknown, unknown];
}

const operatorMap: Record<string, MongoMapper> = {
  equals: (f, v) => ({ [f]: { $eq: v } }),
  notEquals: (f, v) => ({ [f]: { $ne: v } }),
  contains: (f, v) => ({ [f]: { $regex: escapeRegex(v) } }),
  notContains: (f, v) => ({ [f]: { $not: { $regex: escapeRegex(v) } } }),
  startsWith: (f, v) => ({ [f]: { $regex: `^${escapeRegex(v)}` } }),
  endsWith: (f, v) => ({ [f]: { $regex: `${escapeRegex(v)}$` } }),
  gt: (f, v) => ({ [f]: { $gt: v } }),
  gte: (f, v) => ({ [f]: { $gte: v } }),
  lt: (f, v) => ({ [f]: { $lt: v } }),
  lte: (f, v) => ({ [f]: { $lte: v } }),
  before: (f, v) => ({ [f]: { $lt: v } }),
  after: (f, v) => ({ [f]: { $gt: v } }),
  between: (f, v) => {
    const [min, max] = assertPair(v, 'between');
    return { [f]: { $gte: min, $lte: max } };
  },
  in: (f, v) => ({ [f]: { $in: assertArray(v, 'in') } }),
  notIn: (f, v) => ({ [f]: { $nin: assertArray(v, 'notIn') } }),
  isEmpty: (f) => ({ [f]: { $eq: null } }),
  isNotEmpty: (f) => ({ [f]: { $ne: null } }),
};

function buildRule(rule: FilterRule, options: MongoBuildOptions): MongoQuery {
  const mapper = operatorMap[rule.operator];
  if (!mapper) {
    throw new Error(`Unsupported MongoDB operator: ${rule.operator}`);
  }
  const field = options.fieldMap?.[rule.field] ?? rule.field;
  const node = mapper(field, rule.value);
  return rule.not ? { $nor: [node] } : node;
}

function buildGroup(group: FilterGroup, options: MongoBuildOptions): MongoQuery | undefined {
  const parts = group.children
    .map((child) =>
      isFilterGroup(child)
        ? buildGroup(child as FilterGroup, options)
        : buildRule(child as FilterRule, options)
    )
    .filter((part): part is MongoQuery => part !== undefined);

  if (parts.length === 0) {
    return undefined;
  }

  const combinator = group.combinator === 'or' ? '$or' : '$and';
  const inner: MongoQuery = parts.length === 1 ? parts[0] : { [combinator]: parts };
  return group.not ? { $nor: [inner] } : inner;
}

/**
 * Compiles a filter into a MongoDB query document. An empty filter compiles to
 * `{}` (matches all documents).
 */
export function toMongoQuery(filter: FilterAny, options: MongoBuildOptions = {}): MongoQuery {
  const standard = isFilterGroupIC(filter) ? convertFromIC(filter) : (filter as FilterGroup);
  return buildGroup(standard, options) ?? {};
}
