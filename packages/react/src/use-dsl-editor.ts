import { formatDSL, getDslCompletions, tryParseDSL } from '@x-filter/core';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { UseDslEditorOptions, UseDslEditorReturn } from './types';

const formatParseError = (errors: { code: string; message: string }[]): string =>
  errors.length > 0
    ? errors.map((error) => `[${error.code}] ${error.message}`).join('; ')
    : 'Failed to parse DSL expression';

export function useDslEditor(options: UseDslEditorOptions): UseDslEditorReturn {
  const { filter, schema, onCommit, cursor } = options;

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

  const completions = useMemo(
    () =>
      getDslCompletions({
        input: draftDSL,
        cursor: cursor ?? draftDSL.length,
        schema,
      }),
    [cursor, draftDSL, schema]
  );

  const commit = useCallback((): boolean => {
    const result = tryParseDSL(draftDSL);
    if (result.ok) {
      setParseError(null);
      prevFilterRef.current = result.filter;
      onCommitRef.current(result.filter);
      return true;
    }

    setParseError(formatParseError(result.errors));
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
    completions,
    commit,
    resetDraft,
  };
}
