import { formatDSL, tryParseDSL } from '@x-filter/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { UseFilterDslOptions, UseFilterDslReturn } from './types';

export function useFilterDsl(options: UseFilterDslOptions): UseFilterDslReturn {
  const { filter, onCommit } = options;

  const [draftDSL, setDraftDSLState] = useState<string>(() => formatDSL(filter));
  const [parseError, setParseError] = useState<string | null>(null);
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  const prevFilterRef = useRef(filter);
  useEffect(() => {
    if (prevFilterRef.current !== filter) {
      prevFilterRef.current = filter;
      setDraftDSLState(formatDSL(filter));
      setParseError(null);
    }
  }, [filter]);

  const setDraftDSL = useCallback((dsl: string) => {
    setDraftDSLState(dsl);
    setParseError(null);
  }, []);

  const commitDSL = useCallback((): boolean => {
    const result = tryParseDSL(draftDSL);
    if (result.ok) {
      setParseError(null);
      prevFilterRef.current = result.filter;
      onCommitRef.current(result.filter);
      return true;
    }
    setParseError(result.errors.map((e) => `[${e.code}] ${e.message}`).join('; '));
    return false;
  }, [draftDSL]);

  const resetDraft = useCallback(() => {
    setDraftDSLState(formatDSL(filter));
    setParseError(null);
  }, [filter]);

  return {
    draftDSL,
    setDraftDSL,
    parseError,
    commitDSL,
    resetDraft,
  };
}
