import { act, renderHook } from '@testing-library/react';
import type { FieldSchema, Filter, FilterIC } from '@x-filter/core';
import { useFilterBuilderOrchestrator } from '../use-filter-builder-orchestrator';

const schema: FieldSchema[] = [
  { name: 'name', label: 'Name', type: 'text' },
  { name: 'age', label: 'Age', type: 'number' },
];

const emptyIC: FilterIC = { id: 'root', children: [] };

const icThreeRules: FilterIC = {
  id: 'root',
  children: [
    { id: 'r1', field: 'name', operator: 'equals', value: 'Ada' },
    'and',
    { id: 'r2', field: 'name', operator: 'equals', value: 'Bob' },
    'and',
    { id: 'r3', field: 'name', operator: 'equals', value: 'Cay' },
  ],
};

const asIC = (filter: Filter): FilterIC => filter as unknown as FilterIC;

describe('useFilterBuilderOrchestrator (IC mode)', () => {
  it('addRule inserts inline combinator tokens between items', () => {
    const { result } = renderHook(() =>
      useFilterBuilderOrchestrator({ schema, mode: 'ic', defaultValue: emptyIC })
    );

    act(() => {
      result.current.actions.addRule('root');
    });
    act(() => {
      result.current.actions.addRule('root');
    });

    const children = asIC(result.current.builder.filter).children;
    expect(children).toHaveLength(3);
    expect(typeof children[1]).toBe('string');
    expect(result.current.viewModel.root.children.map((c) => c.kind)).toEqual(['rule', 'rule']);
    expect(result.current.viewModel.root.combinators).toEqual(['and']);
  });

  it('viewModel exposes per-position inline combinators', () => {
    const { result } = renderHook(() =>
      useFilterBuilderOrchestrator({ schema, mode: 'ic', value: icThreeRules })
    );

    expect(result.current.viewModel.root.combinators).toEqual(['and', 'and']);
  });

  it('setCombinator changes one inline combinator independently', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() =>
      useFilterBuilderOrchestrator({ schema, mode: 'ic', value: icThreeRules, onChange })
    );

    act(() => {
      result.current.actions.setCombinator('root', 1, 'or');
    });

    const next = asIC(onChange.mock.calls[0][0] as Filter);
    expect(next.children[1]).toBe('and');
    expect(next.children[3]).toBe('or');
  });

  it('removeRule drops the adjacent inline combinator', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() =>
      useFilterBuilderOrchestrator({ schema, mode: 'ic', value: icThreeRules, onChange })
    );

    act(() => {
      result.current.actions.removeRule('r1');
    });

    const next = asIC(onChange.mock.calls[0][0] as Filter);
    expect(
      next.children.filter((c) => typeof c !== 'string').map((c) => (c as { id: string }).id)
    ).toEqual(['r2', 'r3']);
    expect(next.children.filter((c) => typeof c === 'string')).toEqual(['and']);
  });

  it('addGroup inserts a nested IC group with a combinator separator', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() =>
      useFilterBuilderOrchestrator({ schema, mode: 'ic', value: icThreeRules, onChange })
    );

    act(() => {
      result.current.actions.addGroup('root');
    });

    const next = asIC(onChange.mock.calls[0][0] as Filter);
    expect(next.children).toHaveLength(7);
    expect(typeof next.children[5]).toBe('string');
  });
});

describe('useFilterBuilderOrchestrator (standard mode setCombinator)', () => {
  const standard: Filter = {
    id: 'root',
    combinator: 'and',
    children: [
      { id: 'r1', field: 'name', operator: 'equals', value: 'Ada' },
      { id: 'r2', field: 'name', operator: 'equals', value: 'Bob' },
    ],
  };

  it('maps setCombinator onto the single group combinator', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() =>
      useFilterBuilderOrchestrator({ schema, value: standard, onChange })
    );

    act(() => {
      result.current.actions.setCombinator('root', 0, 'or');
    });

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ combinator: 'or' }));
  });
});
