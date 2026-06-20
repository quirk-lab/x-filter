import { act, renderHook } from '@testing-library/react';
import type { CompletionItem, FieldSchema, Filter } from '@x-filter/core';
import { formatDSL } from '@x-filter/core';
import { useDslEditor } from '../use-dsl-editor';

const schema: FieldSchema[] = [
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    operators: [
      { name: 'equals', label: 'equals', arity: 'binary' },
      { name: 'notEquals', label: 'not equals', arity: 'binary' },
    ],
    values: [
      { value: 'open', label: 'Open' },
      { value: 'closed', label: 'Closed' },
    ],
  },
  {
    name: 'priority',
    label: 'Priority',
    type: 'number',
    operators: [
      { name: 'equals', label: 'equals', arity: 'binary' },
      { name: 'gt', label: '>', arity: 'binary' },
    ],
  },
];

const makeFilter = (field = 'status', operator = 'equals', value: unknown = 'open'): Filter => ({
  id: 'root',
  combinator: 'and',
  conditions: [{ id: 'r1', field, operator, value }],
});

const completionValues = (items: CompletionItem[]) => items.map((item) => item.value);
const completionKinds = (items: CompletionItem[]) => items.map((item) => item.kind);

describe('useDslEditor', () => {
  it('initializes draftDSL from filter', () => {
    const filter = makeFilter();
    const onCommit = jest.fn();
    const { result } = renderHook(() => useDslEditor({ filter, schema, onCommit }));

    expect(result.current.draftDSL).toBe(formatDSL(filter));
    expect(result.current.parseError).toBeNull();
  });

  it('returns completions for field, operator, and value contexts', () => {
    const filter = makeFilter();
    const onCommit = jest.fn();
    const { result, rerender } = renderHook(
      ({ cursor }) => useDslEditor({ filter, schema, onCommit, cursor }),
      { initialProps: { cursor: 0 } }
    );

    act(() => {
      result.current.setDraftDSL('sta');
    });
    rerender({ cursor: 3 });
    expect(result.current.completions).toEqual([
      expect.objectContaining({ kind: 'field', value: 'status' }),
    ]);

    act(() => {
      result.current.setDraftDSL('status:');
    });
    rerender({ cursor: 7 });
    expect(completionValues(result.current.completions)).toEqual(['equals', 'notEquals']);
    expect(completionKinds(result.current.completions)).toEqual(['operator', 'operator']);

    act(() => {
      result.current.setDraftDSL('status:equals:');
    });
    rerender({ cursor: 14 });
    expect(completionValues(result.current.completions)).toEqual(['open', 'closed']);
    expect(completionKinds(result.current.completions)).toEqual(['value', 'value']);
  });

  it('valid commit calls onCommit and returns true', () => {
    const filter = makeFilter();
    const onCommit = jest.fn();
    const { result } = renderHook(() => useDslEditor({ filter, schema, onCommit }));

    act(() => {
      result.current.setDraftDSL('priority:gt:2');
    });

    let committed = false;
    act(() => {
      committed = result.current.commit();
    });

    expect(committed).toBe(true);
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith(
      expect.objectContaining({
        conditions: [
          expect.objectContaining({
            field: 'priority',
            operator: 'gt',
          }),
        ],
      })
    );
    expect(result.current.parseError).toBeNull();
  });

  it('invalid commit sets parseError, returns false, and does not call onCommit', () => {
    const filter = makeFilter();
    const onCommit = jest.fn();
    const { result } = renderHook(() => useDslEditor({ filter, schema, onCommit }));

    act(() => {
      result.current.setDraftDSL('this is @@@ invalid');
    });

    let committed = true;
    act(() => {
      committed = result.current.commit();
    });

    expect(committed).toBe(false);
    expect(onCommit).not.toHaveBeenCalled();
    expect(result.current.parseError).toEqual(expect.stringContaining('[EXPECTED_COLON]'));
  });

  it('external filter change updates draft and clears errors', () => {
    const filter = makeFilter();
    const nextFilter = makeFilter('priority', 'gt', 10);
    const onCommit = jest.fn();
    const { result, rerender } = renderHook(
      ({ currentFilter }) => useDslEditor({ filter: currentFilter, schema, onCommit }),
      { initialProps: { currentFilter: filter } }
    );

    act(() => {
      result.current.setDraftDSL('@@@ bad');
    });
    act(() => {
      result.current.commit();
    });
    expect(result.current.parseError).not.toBeNull();

    rerender({ currentFilter: nextFilter });

    expect(result.current.draftDSL).toBe(formatDSL(nextFilter));
    expect(result.current.parseError).toBeNull();
  });

  it('cursor affects completion context', () => {
    const filter = makeFilter();
    const onCommit = jest.fn();
    const { result, rerender } = renderHook(
      ({ cursor }) => useDslEditor({ filter, schema, onCommit, cursor }),
      { initialProps: { cursor: 24 } }
    );

    act(() => {
      result.current.setDraftDSL('status:equals:open AND pri');
    });
    expect(completionValues(result.current.completions)).toEqual(['priority']);

    rerender({ cursor: 'status:'.length });

    expect(completionValues(result.current.completions)).toEqual(['equals', 'notEquals']);
  });

  it('resetDraft resets to current filter DSL and clears parseError', () => {
    const filter = makeFilter();
    const onCommit = jest.fn();
    const { result } = renderHook(() => useDslEditor({ filter, schema, onCommit }));

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

  it('resetDraft clears a previous parseError', () => {
    const filter = makeFilter();
    const onCommit = jest.fn();
    const { result } = renderHook(() => useDslEditor({ filter, schema, onCommit }));

    act(() => {
      result.current.setDraftDSL('@@@ invalid');
    });
    act(() => {
      result.current.commit();
    });
    expect(result.current.parseError).not.toBeNull();

    act(() => {
      result.current.resetDraft();
    });
    expect(result.current.parseError).toBeNull();
  });

  it('resetDraft does not prevent subsequent external filter resync', () => {
    const filter = makeFilter();
    const nextFilter = makeFilter('priority', 'gt', 10);
    const onCommit = jest.fn();
    const { result, rerender } = renderHook(
      ({ currentFilter }) => useDslEditor({ filter: currentFilter, schema, onCommit }),
      { initialProps: { currentFilter: filter } }
    );

    act(() => {
      result.current.setDraftDSL('something:different:value');
    });
    act(() => {
      result.current.resetDraft();
    });
    expect(result.current.draftDSL).toBe(formatDSL(filter));

    rerender({ currentFilter: nextFilter });
    expect(result.current.draftDSL).toBe(formatDSL(nextFilter));
  });

  it('returns empty completions when cursor is undefined', () => {
    const filter = makeFilter();
    const onCommit = jest.fn();
    const { result } = renderHook(() => useDslEditor({ filter, schema, onCommit }));

    act(() => {
      result.current.setDraftDSL('sta');
    });
    expect(result.current.completions).toEqual([]);
  });
});
