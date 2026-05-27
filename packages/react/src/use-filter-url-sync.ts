import type { Filter } from '@x-filter/core';
import { formatDSL, fromJSON, toJSON, tryParseDSL } from '@x-filter/core';
import { useCallback, useState } from 'react';
import type { UseFilterUrlSyncOptions, UseFilterUrlSyncReturn } from './types';

const defaultGetSearchParams = (): URLSearchParams => {
  if (typeof window === 'undefined') return new URLSearchParams();
  return new URLSearchParams(window.location.search);
};

const defaultSetSearchParams = (params: URLSearchParams): void => {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.search = params.toString();
  window.history.replaceState({}, '', url.toString());
};

export function useFilterUrlSync(options: UseFilterUrlSyncOptions = {}): UseFilterUrlSyncReturn {
  const {
    mode = 'dsl',
    paramName = 'filter',
    getSearchParams = defaultGetSearchParams,
    setSearchParams = defaultSetSearchParams,
  } = options;

  const [error, setError] = useState<string | null>(null);

  const getFilterFromUrl = useCallback((): Filter | null => {
    const params = getSearchParams();
    const raw = params.get(paramName);
    if (!raw) return null;

    try {
      if (mode === 'dsl') {
        const result = tryParseDSL(raw);
        if (result.ok) {
          setError(null);
          return result.filter;
        }
        setError(result.errors.map((e) => e.message).join('; '));
        return null;
      }
      const filter = fromJSON(JSON.parse(raw)) as Filter;
      setError(null);
      return filter;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse filter from URL');
      return null;
    }
  }, [mode, paramName, getSearchParams]);

  const setFilterToUrl = useCallback(
    (filter: Filter): void => {
      const params = getSearchParams();

      if (mode === 'dsl') {
        params.set(paramName, formatDSL(filter));
      } else {
        params.set(paramName, JSON.stringify(toJSON(filter)));
      }

      setSearchParams(params);
      setError(null);
    },
    [mode, paramName, getSearchParams, setSearchParams]
  );

  return {
    getFilterFromUrl,
    setFilterToUrl,
    error,
  };
}
