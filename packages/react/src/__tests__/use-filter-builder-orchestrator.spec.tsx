import { act, renderHook } from '@testing-library/react';
import type { FieldSchema, Filter } from '@x-filter/core';
import { useFilterBuilderOrchestrator } from '../use-filter-builder-orchestrator';

const schema: FieldSchema[] = [
  { name: 'name', label: 'Name', type: 'text' },
  { name: 'age', label: 'Age', type: 'number' },
];

const emptyFilter: Filter = { id: 'root', combinator: 'and', conditions: [] };

const filterWithRule: Filter = {
  id: 'root',
  combinator: 'and',
  conditions: [
    { id: 'r1', field: 'name', operator: 'equals', value: 'Ada' },
    { id: 'g1', combinator: 'or', conditions: [] },
  ],
};

describe('useFilterBuilderOrchestrator', () => {
  it('returns builder, viewModel, reorder, actions, slotProps', () => {
    const { result } = renderHook(() =>
      useFilterBuilderOrchestrator({ schema, defaultValue: emptyFilter })
    );

    expect(result.current.builder).toBeDefined();
    expect(result.current.builder.filter).toEqual(emptyFilter);
    expect(result.current.viewModel).toBeDefined();
    expect(result.current.viewModel.root.id).toBe('root');
    expect(result.current.reorder).toBeDefined();
    expect(result.current.actions).toBeDefined();
    expect(result.current.slotProps).toBeDefined();
    expect(result.current.slotProps.filter).toEqual(emptyFilter);
    expect(result.current.slotProps.schema).toBe(schema);
  });

  it('actions.addRule calls onChange', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() =>
      useFilterBuilderOrchestrator({ schema, value: emptyFilter, onChange })
    );

    act(() => {
      result.current.actions.addRule('root');
    });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        conditions: [expect.objectContaining({ field: '' })],
      })
    );
  });

  it('actions.removeRule calls onChange', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() =>
      useFilterBuilderOrchestrator({ schema, value: filterWithRule, onChange })
    );

    act(() => {
      result.current.actions.removeRule('r1');
    });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ conditions: [expect.objectContaining({ id: 'g1' })] })
    );
  });

  it('actions.moveItem moves rule to another group', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() =>
      useFilterBuilderOrchestrator({ schema, value: filterWithRule, onChange })
    );

    act(() => {
      result.current.actions.moveItem({
        type: 'rule',
        id: 'r1',
        targetGroupId: 'g1',
        targetIndex: 0,
      });
    });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        conditions: [
          expect.objectContaining({
            id: 'g1',
            conditions: [expect.objectContaining({ id: 'r1' })],
          }),
        ],
      })
    );
  });

  it('canMoveChild returns true for valid adjacent move', () => {
    const { result } = renderHook(() =>
      useFilterBuilderOrchestrator({ schema, defaultValue: filterWithRule })
    );

    const root = result.current.viewModel.root;
    const child = root.children[0];
    expect(result.current.canMoveChild(root, child, 1)).toBe(true);
  });

  it('canMoveChild returns false for out-of-bounds index', () => {
    const { result } = renderHook(() =>
      useFilterBuilderOrchestrator({ schema, defaultValue: filterWithRule })
    );

    const root = result.current.viewModel.root;
    const child = root.children[0];
    expect(result.current.canMoveChild(root, child, -1)).toBe(false);
    expect(result.current.canMoveChild(root, child, 99)).toBe(false);
  });

  it('moveChild moves rule up', () => {
    const onChange = jest.fn();
    const filterTwoRules: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [
        { id: 'r1', field: 'name', operator: 'equals', value: 'Ada' },
        { id: 'r2', field: 'age', operator: 'equals', value: 30 },
      ],
    };
    const { result } = renderHook(() =>
      useFilterBuilderOrchestrator({ schema, value: filterTwoRules, onChange })
    );

    const root = result.current.viewModel.root;
    act(() => {
      result.current.moveChild(root, root.children[1], 1, 'up');
    });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        conditions: [expect.objectContaining({ id: 'r2' }), expect.objectContaining({ id: 'r1' })],
      })
    );
  });

  it('handleSortableMove moves item when active and over are found', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() =>
      useFilterBuilderOrchestrator({ schema, value: filterWithRule, onChange })
    );

    const root = result.current.viewModel.root;
    act(() => {
      result.current.handleSortableMove(root, 'r1', 'g1');
    });

    expect(onChange).toHaveBeenCalled();
  });

  it('handleSortableMove does nothing when active id not found', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() =>
      useFilterBuilderOrchestrator({ schema, value: filterWithRule, onChange })
    );

    const root = result.current.viewModel.root;
    act(() => {
      result.current.handleSortableMove(root, 'nonexistent', 'g1');
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('actions are memoized (stable references across rerenders)', () => {
    const { result, rerender } = renderHook(() =>
      useFilterBuilderOrchestrator({ schema, defaultValue: emptyFilter })
    );

    const firstActions = result.current.actions;
    rerender();
    expect(result.current.actions).toBe(firstActions);
  });
});
