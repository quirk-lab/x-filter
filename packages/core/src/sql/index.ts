import { convertFromIC, isFilterGroupIC } from '../ic';
import type { FilterAny, FilterGroup, SQLResult } from '../types';
import { buildGroupSQL, type SQLBuildOptions } from './builder';

export type { SQLResult } from '../types';
export type { SQLBuildOptions } from './builder';
export type { OperatorMapper } from './operators';

export function toSQL(filter: FilterAny, options?: SQLBuildOptions): SQLResult {
  if (isFilterGroupIC(filter)) {
    const standardFilter = convertFromIC(filter);
    return buildGroupSQL(standardFilter, options);
  }
  return buildGroupSQL(filter as FilterGroup, options);
}
