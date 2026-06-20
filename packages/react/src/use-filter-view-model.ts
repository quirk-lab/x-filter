import type { FieldSchema, FilterGroup, FilterRule, ValidationError } from '@x-filter/core';
import { getOperators, isFilterGroup, isFilterRule } from '@x-filter/core';
import { useMemo, useRef } from 'react';
import type {
  FilterGroupViewModel,
  FilterNodeViewModel,
  FilterRuleViewModel,
  UseFilterViewModelOptions,
  UseFilterViewModelReturn,
} from './types';

const EMPTY_ERRORS: Record<string, ValidationError[]> = {};
// Shared stable reference for rules with no validation errors. Without this,
// `validationErrors[rule.id] ?? []` would allocate a fresh `[]` on every build
// and defeat the identity cache (the cache key includes the errors array ref).
const EMPTY_RULE_ERRORS: ValidationError[] = [];

type RuleCacheEntry = { errorsRef: ValidationError[]; vm: FilterRuleViewModel };
type GroupCacheEntry = {
  depth: number;
  childRefs: (FilterNodeViewModel | undefined)[];
  vm: FilterGroupViewModel;
};

/**
 * Identity-aware ViewModel projection of a `Filter` tree.
 *
 * Reuses ViewModel nodes whose source `FilterRule` / `FilterGroup` is `===` to
 * the previous render AND whose `errors[ruleId]` array is `===`. This reuses
 * the structural sharing already performed by the core mutators
 * (`packages/core/src/mutations.ts`), so a single-node mutation only
 * allocates ViewModels along the mutated spine.
 *
 * The cache lives in `useRef` (per hook instance) and is invalidated when the
 * `schema` reference changes. It is concurrency-safe by construction: the
 * whole tree is a single pure snapshot from one `useMemo` run, so abandoned
 * concurrent renders cannot tear the tree.
 *
 * For the cache to be effective, callers must supply an `errors` object whose
 * per-rule arrays are referentially stable across mutations — use
 * `useFilterValidation` (which wraps the identity-aware `validate`) or
 * memoize `errors` equivalently.
 */
export function useFilterViewModel(options: UseFilterViewModelOptions): UseFilterViewModelReturn {
  const { filter, schema, errors } = options;
  const validationErrors = errors ?? EMPTY_ERRORS;

  const ruleCacheRef = useRef<WeakMap<FilterRule, RuleCacheEntry> | undefined>(undefined);
  const groupCacheRef = useRef<WeakMap<FilterGroup, GroupCacheEntry> | undefined>(undefined);
  const schemaRef = useRef<FieldSchema[] | undefined>(undefined);

  const root = useMemo(() => {
    // Schema identity changed → resolved field/operator metadata changes for
    // every node, so drop both caches. (Per ADR 0001; module-level caches would
    // leak across instances and concurrent renders, hence useRef scoping.)
    if (schemaRef.current !== schema) {
      schemaRef.current = schema;
      ruleCacheRef.current = new WeakMap<FilterRule, RuleCacheEntry>();
      groupCacheRef.current = new WeakMap<FilterGroup, GroupCacheEntry>();
    }
    const ruleCache = ruleCacheRef.current as WeakMap<FilterRule, RuleCacheEntry>;
    const groupCache = groupCacheRef.current as WeakMap<FilterGroup, GroupCacheEntry>;
    const fieldsByName = new Map(schema.map((field) => [field.name, field]));

    const buildRuleViewModel = (rule: FilterRule): FilterRuleViewModel => {
      const ruleErrors = validationErrors[rule.id] ?? EMPTY_RULE_ERRORS;
      const cached = ruleCache.get(rule);
      if (cached && cached.errorsRef === ruleErrors) {
        return cached.vm;
      }

      const field = fieldsByName.get(rule.field);
      const operator = field
        ? getOperators(field.type, field.operators).find(
            (candidate) => candidate.name === rule.operator
          )
        : undefined;
      const fieldLabel = field?.label ?? rule.field;
      const operatorLabel = operator?.label ?? rule.operator;

      const vm: FilterRuleViewModel = {
        kind: 'rule',
        id: rule.id,
        rule,
        field,
        operator,
        errors: ruleErrors,
        aria: {
          label: `Rule ${fieldLabel} ${operatorLabel}`,
          ...(ruleErrors.length > 0 ? { describedBy: `${rule.id}-errors` } : {}),
        },
      };
      ruleCache.set(rule, { errorsRef: ruleErrors, vm });
      return vm;
    };

    const buildGroupViewModel = (group: FilterGroup, depth: number): FilterGroupViewModel => {
      const children = group.children.flatMap((child): FilterNodeViewModel[] => {
        if (isFilterRule(child)) {
          return [buildRuleViewModel(child)];
        }

        if (isFilterGroup(child)) {
          return [buildGroupViewModel(child, depth + 1)];
        }

        return [];
      });

      const cached = groupCache.get(group);
      if (
        cached &&
        cached.depth === depth &&
        cached.childRefs.length === children.length &&
        cached.childRefs.every((ref, index) => ref === children[index])
      ) {
        return cached.vm;
      }

      const vm: FilterGroupViewModel = {
        kind: 'group',
        id: group.id,
        group,
        depth,
        children,
        aria: {
          label: `Filter group ${group.id}`,
        },
      };
      groupCache.set(group, { depth, childRefs: children, vm });
      return vm;
    };

    return buildGroupViewModel(filter, 0);
  }, [filter, schema, validationErrors]);

  return {
    root,
    schema,
  };
}
