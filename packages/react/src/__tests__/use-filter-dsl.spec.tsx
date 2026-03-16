import { act, renderHook } from '@testing-library/react';
import type { FieldSchema, Filter } from '@x-filter/core';
import { formatDSL } from '@x-filter/core';
import { useFilterDsl } from '../use-filter-dsl';

const schema: FieldSchema[] = [{ name: 'name', label: 'Name', type: 'text' }];

const makeFilter = (): Filter => ({
  id: 'root',
  combinator: 'and',
  conditions: [{ id: 'r1', field: 'name', operator: 'equals', value: 'John' }],
});

const makeEmptyFilter = (): Filter => ({
  id: 'root',
  combinator: 'and',
  conditions: [],
});

describe('useFilterDsl', () => {
  it('initializes draftDSL from filter', () => {
    const filter = makeFilter();
    const onCommit = jest.fn();
    const { result } = renderHook(() => useFilterDsl({ filter, schema, onCommit }));

    const expectedDSL = formatDSL(filter);
    expect(result.current.draftDSL).toBe(expectedDSL);
  });

  it('parseError is null initially', () => {
    const filter = makeFilter();
    const onCommit = jest.fn();
    const { result } = renderHook(() => useFilterDsl({ filter, schema, onCommit }));

    expect(result.current.parseError).toBeNull();
  });

  it('setDraftDSL updates draft and clears error', () => {
    const filter = makeFilter();
    const onCommit = jest.fn();
    const { result } = renderHook(() => useFilterDsl({ filter, schema, onCommit }));

    act(() => {
      result.current.commitDSL();
    });

    act(() => {
      result.current.setDraftDSL('name:equals:Jane');
    });

    expect(result.current.draftDSL).toBe('name:equals:Jane');
    expect(result.current.parseError).toBeNull();
  });

  it('setDraftDSL clears a previous error', () => {
    const filter = makeFilter();
    const onCommit = jest.fn();
    const { result } = renderHook(() => useFilterDsl({ filter, schema, onCommit }));

    act(() => {
      result.current.setDraftDSL('this is @@@ invalid');
    });
    act(() => {
      result.current.commitDSL();
    });
    expect(result.current.parseError).not.toBeNull();

    act(() => {
      result.current.setDraftDSL('name:equals:valid');
    });
    expect(result.current.parseError).toBeNull();
  });

  it('commitDSL returns true on valid DSL and calls onCommit', () => {
    const filter = makeFilter();
    const onCommit = jest.fn();
    const { result } = renderHook(() => useFilterDsl({ filter, schema, onCommit }));

    act(() => {
      result.current.setDraftDSL('name:equals:Jane');
    });

    let success = false;
    act(() => {
      success = result.current.commitDSL();
    });

    expect(success).toBe(true);
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith(
      expect.objectContaining({
        conditions: expect.arrayContaining([
          expect.objectContaining({ field: 'name', operator: 'equals' }),
        ]),
      })
    );
    expect(result.current.parseError).toBeNull();
  });

  it('commitDSL returns false on invalid DSL and sets parseError', () => {
    const filter = makeFilter();
    const onCommit = jest.fn();
    const { result } = renderHook(() => useFilterDsl({ filter, schema, onCommit }));

    act(() => {
      result.current.setDraftDSL('this is @@@ invalid');
    });

    let success = true;
    act(() => {
      success = result.current.commitDSL();
    });

    expect(success).toBe(false);
    expect(onCommit).not.toHaveBeenCalled();
    expect(result.current.parseError).toBeTruthy();
    expect(typeof result.current.parseError).toBe('string');
  });

  it('resetDraft resets to current filter DSL', () => {
    const filter = makeFilter();
    const onCommit = jest.fn();
    const { result } = renderHook(() => useFilterDsl({ filter, schema, onCommit }));

    const originalDSL = result.current.draftDSL;

    act(() => {
      result.current.setDraftDSL('something:different:value');
    });
    expect(result.current.draftDSL).toBe('something:different:value');

    act(() => {
      result.current.resetDraft();
    });

    expect(result.current.draftDSL).toBe(originalDSL);
    expect(result.current.parseError).toBeNull();
  });

  it('resetDraft clears parseError', () => {
    const filter = makeFilter();
    const onCommit = jest.fn();
    const { result } = renderHook(() => useFilterDsl({ filter, schema, onCommit }));

    act(() => {
      result.current.setDraftDSL('@@@ invalid');
    });
    act(() => {
      result.current.commitDSL();
    });
    expect(result.current.parseError).not.toBeNull();

    act(() => {
      result.current.resetDraft();
    });
    expect(result.current.parseError).toBeNull();
  });

  it('when filter changes externally, draft updates', () => {
    const filter1 = makeFilter();
    const filter2: Filter = {
      id: 'root2',
      combinator: 'or',
      conditions: [{ id: 'r2', field: 'age', operator: 'gt', value: 18 }],
    };
    const onCommit = jest.fn();

    const { result, rerender } = renderHook(
      ({ filter }) => useFilterDsl({ filter, schema, onCommit }),
      { initialProps: { filter: filter1 } }
    );

    const dsl1 = result.current.draftDSL;
    expect(dsl1).toBe(formatDSL(filter1));

    rerender({ filter: filter2 });

    expect(result.current.draftDSL).toBe(formatDSL(filter2));
    expect(result.current.parseError).toBeNull();
  });

  it('external filter change clears a previous parseError', () => {
    const filter1 = makeFilter();
    const filter2: Filter = {
      id: 'root2',
      combinator: 'and',
      conditions: [{ id: 'r2', field: 'status', operator: 'equals', value: 'active' }],
    };
    const onCommit = jest.fn();

    const { result, rerender } = renderHook(
      ({ filter }) => useFilterDsl({ filter, schema, onCommit }),
      { initialProps: { filter: filter1 } }
    );

    act(() => {
      result.current.setDraftDSL('@@@ bad');
    });
    act(() => {
      result.current.commitDSL();
    });
    expect(result.current.parseError).not.toBeNull();

    rerender({ filter: filter2 });

    expect(result.current.parseError).toBeNull();
  });

  it('commitDSL with empty expression sets parseError', () => {
    const filter = makeEmptyFilter();
    const onCommit = jest.fn();
    const { result } = renderHook(() => useFilterDsl({ filter, schema, onCommit }));

    act(() => {
      result.current.setDraftDSL('');
    });

    let success = true;
    act(() => {
      success = result.current.commitDSL();
    });

    expect(success).toBe(false);
    expect(result.current.parseError).toBeTruthy();
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('successful commitDSL prevents re-sync on same filter reference', () => {
    const filter = makeFilter();
    const onCommit = jest.fn();
    const { result, rerender } = renderHook(
      ({ filter: f }) => useFilterDsl({ filter: f, schema, onCommit }),
      { initialProps: { filter } }
    );

    act(() => {
      result.current.setDraftDSL('age:gt:18');
    });
    act(() => {
      result.current.commitDSL();
    });

    const dslAfterCommit = result.current.draftDSL;

    rerender({ filter });

    expect(result.current.draftDSL).toBe(dslAfterCommit);
  });
});
