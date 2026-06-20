import { convertFromIC, isFilterGroupIC } from '../ic';
import type { FilterAny, FilterGroup, FilterRule } from '../types';
import { isFilterGroup } from '../types';

/** An Elasticsearch Query DSL clause (the `query` body of a search request). */
export type ElasticQuery = Record<string, unknown>;

export interface ElasticBuildOptions {
  /** Maps public field names to the indexed field used in the output. */
  fieldMap?: Record<string, string>;
}

type ElasticMapper = (field: string, value: unknown) => ElasticQuery;

const WILDCARD_SPECIAL = /[\\*?]/g;

function escapeWildcard(value: unknown): string {
  return String(value).replace(WILDCARD_SPECIAL, '\\$&');
}

function assertArray(value: unknown, operator: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`Elasticsearch operator "${operator}" requires an array value`);
  }
  return value;
}

function assertPair(value: unknown, operator: string): [unknown, unknown] {
  if (!Array.isArray(value) || value.length !== 2) {
    throw new Error(`Elasticsearch operator "${operator}" requires an array of 2 values`);
  }
  return value as [unknown, unknown];
}

function mustNot(clause: ElasticQuery): ElasticQuery {
  return { bool: { must_not: [clause] } };
}

const operatorMap: Record<string, ElasticMapper> = {
  equals: (f, v) => ({ term: { [f]: v } }),
  notEquals: (f, v) => mustNot({ term: { [f]: v } }),
  contains: (f, v) => ({ wildcard: { [f]: `*${escapeWildcard(v)}*` } }),
  notContains: (f, v) => mustNot({ wildcard: { [f]: `*${escapeWildcard(v)}*` } }),
  startsWith: (f, v) => ({ prefix: { [f]: v } }),
  endsWith: (f, v) => ({ wildcard: { [f]: `*${escapeWildcard(v)}` } }),
  gt: (f, v) => ({ range: { [f]: { gt: v } } }),
  gte: (f, v) => ({ range: { [f]: { gte: v } } }),
  lt: (f, v) => ({ range: { [f]: { lt: v } } }),
  lte: (f, v) => ({ range: { [f]: { lte: v } } }),
  before: (f, v) => ({ range: { [f]: { lt: v } } }),
  after: (f, v) => ({ range: { [f]: { gt: v } } }),
  between: (f, v) => {
    const [min, max] = assertPair(v, 'between');
    return { range: { [f]: { gte: min, lte: max } } };
  },
  in: (f, v) => ({ terms: { [f]: assertArray(v, 'in') } }),
  notIn: (f, v) => mustNot({ terms: { [f]: assertArray(v, 'notIn') } }),
  isEmpty: (f) => mustNot({ exists: { field: f } }),
  isNotEmpty: (f) => ({ exists: { field: f } }),
};

function buildRule(rule: FilterRule, options: ElasticBuildOptions): ElasticQuery {
  const mapper = operatorMap[rule.operator];
  if (!mapper) {
    throw new Error(`Unsupported Elasticsearch operator: ${rule.operator}`);
  }
  const field = options.fieldMap?.[rule.field] ?? rule.field;
  const node = mapper(field, rule.value);
  return rule.not ? mustNot(node) : node;
}

function buildGroup(group: FilterGroup, options: ElasticBuildOptions): ElasticQuery | undefined {
  const parts = group.children
    .map((child) =>
      isFilterGroup(child)
        ? buildGroup(child as FilterGroup, options)
        : buildRule(child as FilterRule, options)
    )
    .filter((part): part is ElasticQuery => part !== undefined);

  if (parts.length === 0) {
    return undefined;
  }

  let inner: ElasticQuery;
  if (parts.length === 1) {
    inner = parts[0];
  } else if (group.combinator === 'or') {
    inner = { bool: { should: parts, minimum_should_match: 1 } };
  } else {
    inner = { bool: { must: parts } };
  }

  return group.not ? mustNot(inner) : inner;
}

/**
 * Compiles a filter into an Elasticsearch Query DSL clause. An empty filter
 * compiles to `{ match_all: {} }` (matches everything).
 */
export function toElasticQuery(filter: FilterAny, options: ElasticBuildOptions = {}): ElasticQuery {
  const standard = isFilterGroupIC(filter) ? convertFromIC(filter) : (filter as FilterGroup);
  return buildGroup(standard, options) ?? { match_all: {} };
}
