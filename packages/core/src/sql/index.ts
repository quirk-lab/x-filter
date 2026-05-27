import { convertFromIC, isFilterGroupIC } from '../ic';
import type { FilterAny, FilterGroup, SQLResult } from '../types';
import { buildGroupSQL } from './builder';

export type { SQLResult } from '../types';

export function toSQL(filter: FilterAny): SQLResult {
  if (isFilterGroupIC(filter)) {
    const standardFilter = convertFromIC(filter);
    return buildGroupSQL(standardFilter);
  }
  return buildGroupSQL(filter as FilterGroup);
}
