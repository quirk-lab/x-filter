import type { FilterAny, FilterGroup, SQLResult } from '../types';
import { isFilterGroupIC } from '../ic';
import { convertFromIC } from '../ic';
import { buildGroupSQL } from './builder';

export type { SQLResult } from '../types';

export function toSQL(filter: FilterAny): SQLResult {
  if (isFilterGroupIC(filter)) {
    const standardFilter = convertFromIC(filter);
    return buildGroupSQL(standardFilter);
  }
  return buildGroupSQL(filter as FilterGroup);
}
