import type { FilterGroup, FilterRule, ValidationError } from '@x-filter/core';
import { getOperators, isFilterGroup, isFilterRule } from '@x-filter/core';
import { useMemo } from 'react';
import type {
  FilterGroupViewModel,
  FilterNodeViewModel,
  FilterRuleViewModel,
  UseFilterViewModelOptions,
  UseFilterViewModelReturn,
} from './types';

const EMPTY_ERRORS: Record<string, ValidationError[]> = {};

export function useFilterViewModel(options: UseFilterViewModelOptions): UseFilterViewModelReturn {
  const { filter, schema, errors } = options;
  const validationErrors = errors ?? EMPTY_ERRORS;

  const root = useMemo(() => {
    const fieldsByName = new Map(schema.map((field) => [field.name, field]));

    const buildRuleViewModel = (rule: FilterRule): FilterRuleViewModel => {
      const field = fieldsByName.get(rule.field);
      const operator = field
        ? getOperators(field.type, field.operators).find(
            (candidate) => candidate.name === rule.operator
          )
        : undefined;
      const ruleErrors = validationErrors[rule.id] ?? [];
      const fieldLabel = field?.label ?? rule.field;
      const operatorLabel = operator?.label ?? rule.operator;

      return {
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
    };

    const buildGroupViewModel = (group: FilterGroup, depth: number): FilterGroupViewModel => ({
      kind: 'group',
      id: group.id,
      group,
      depth,
      children: group.children.flatMap((child): FilterNodeViewModel[] => {
        if (isFilterRule(child)) {
          return [buildRuleViewModel(child)];
        }

        if (isFilterGroup(child)) {
          return [buildGroupViewModel(child, depth + 1)];
        }

        return [];
      }),
      aria: {
        label: `Filter group ${group.id}`,
      },
    });

    return buildGroupViewModel(filter, 0);
  }, [filter, schema, validationErrors]);

  return {
    root,
    schema,
  };
}
