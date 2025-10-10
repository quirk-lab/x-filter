import { useCallback, useMemo, useState } from 'react';
import type {
  QueryBuilderConfig,
  QueryDefinition,
  QueryField,
  QueryRule
} from '@x-filter/core';
import {
  addRule as addRuleToDefinition,
  createQueryDefinition,
  replaceRules as replaceRulesInDefinition,
  serializeQuery
} from '@x-filter/core';

export interface UseQueryBuilderArgs {
  name: string;
  fields: QueryField[];
  config?: QueryBuilderConfig;
}

export interface QueryBuilderState {
  definition: QueryDefinition;
  rules: QueryRule[];
}

export interface UseQueryBuilderApi {
  state: QueryBuilderState;
  addRule: (rule: QueryRule) => void;
  replaceRules: (rules: QueryRule[]) => void;
  reset: () => void;
  serialize: () => string;
}

export const useQueryBuilder = ({ name, fields, config }: UseQueryBuilderArgs): UseQueryBuilderApi => {
  const baseDefinition = useMemo(() => createQueryDefinition(name, fields, config), [
    name,
    fields,
    config
  ]);

  const [definition, setDefinition] = useState<QueryDefinition>(baseDefinition);

  const addRule = useCallback(
    (rule: QueryRule) => {
      setDefinition((current) => addRuleToDefinition(current, rule, config));
    },
    [config]
  );

  const replaceRules = useCallback(
    (rules: QueryRule[]) => {
      setDefinition((current) => replaceRulesInDefinition(current, rules, config));
    },
    [config]
  );

  const reset = useCallback(() => {
    setDefinition(baseDefinition);
  }, [baseDefinition]);

  const serialize = useCallback(() => serializeQuery(definition), [definition]);

  return {
    state: {
      definition,
      rules: definition.rules
    },
    addRule,
    replaceRules,
    reset,
    serialize
  };
};
