import { ReactNode, useEffect } from 'react';
import type { QueryBuilderConfig, QueryField, QueryRule } from '@x-filter/core';
import { useQueryBuilder, UseQueryBuilderApi } from '../hooks/useQueryBuilder';

export interface QueryBuilderProps {
  name: string;
  fields: QueryField[];
  config?: QueryBuilderConfig;
  initialRules?: QueryRule[];
  onChange?: (rules: QueryRule[], api: UseQueryBuilderApi) => void;
  children: (api: UseQueryBuilderApi) => ReactNode;
}

export const QueryBuilder = ({
  name,
  fields,
  config,
  initialRules,
  onChange,
  children
}: QueryBuilderProps) => {
  const api = useQueryBuilder({ name, fields, config });

  useEffect(() => {
    if (initialRules?.length) {
      api.replaceRules(initialRules);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    onChange?.(api.state.rules, api);
  }, [api.state.rules, api, onChange]);

  return <>{children(api)}</>;
};
