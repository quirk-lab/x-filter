import { act, renderHook } from '@testing-library/react';
import type { CompletionItem, FieldSchema, Filter } from '@x-filter/core';
import { useDslEditor } from '../use-dsl-editor';
import { useDslEditorInteraction } from '../use-dsl-editor-interaction';

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
    type: 'select',
    operators: [{ name: 'equals', label: 'equals', arity: 'binary' }],
    values: [{ value: 'high', label: 'High' }],
  },
];

const filter: Filter = { id: 'root', combinator: 'and', children: [] };

function renderInteraction() {
  const onCommit = jest.fn();
  return renderHook(() => {
    const editor = useDslEditor({ filter, schema, onCommit });
    return useDslEditorInteraction({ editor });
  });
}

describe('useDslEditorInteraction', () => {
  it('starts with completion closed and activeIndex 0', () => {
    const { result } = renderInteraction();
    expect(result.current.isCompletionOpen).toBe(false);
    expect(result.current.activeIndex).toBe(0);
  });

  it('visibleCompletions is empty when menu is closed', () => {
    const { result } = renderInteraction();
    expect(result.current.visibleCompletions).toEqual([]);
  });

  it('opens completion menu on handleChange', () => {
    const { result } = renderInteraction();
    const fakeEvent = {
      target: { value: 'sta', selectionStart: 3 },
    } as unknown as React.ChangeEvent<HTMLTextAreaElement>;

    act(() => {
      result.current.handleChange(fakeEvent);
    });

    expect(result.current.isCompletionOpen).toBe(true);
    expect(result.current.visibleCompletions.length).toBeGreaterThan(0);
  });

  it('closes completion menu on Escape keydown', () => {
    const { result } = renderInteraction();

    act(() => {
      result.current.setIsCompletionOpen(true);
    });

    const fakeEvent = { key: 'Escape' } as React.KeyboardEvent<HTMLTextAreaElement>;
    act(() => {
      result.current.handleKeyDown(fakeEvent);
    });

    expect(result.current.isCompletionOpen).toBe(false);
  });

  it('navigates completions with ArrowDown/ArrowUp', () => {
    const { result } = renderInteraction();

    act(() => {
      result.current.setIsCompletionOpen(true);
    });

    const completionsCount = result.current.visibleCompletions.length;
    expect(completionsCount).toBeGreaterThan(1);

    const downEvent = {
      key: 'ArrowDown',
      preventDefault: jest.fn(),
    } as unknown as React.KeyboardEvent<HTMLTextAreaElement>;
    act(() => {
      result.current.handleKeyDown(downEvent);
    });
    expect(result.current.activeIndex).toBe(1);

    const upEvent = {
      key: 'ArrowUp',
      preventDefault: jest.fn(),
    } as unknown as React.KeyboardEvent<HTMLTextAreaElement>;
    act(() => {
      result.current.handleKeyDown(upEvent);
    });
    expect(result.current.activeIndex).toBe(0);
  });

  it('applies completion on Enter when menu is open', () => {
    const { result } = renderInteraction();

    act(() => {
      result.current.setIsCompletionOpen(true);
    });

    const enterEvent = {
      key: 'Enter',
      preventDefault: jest.fn(),
    } as unknown as React.KeyboardEvent<HTMLTextAreaElement>;
    act(() => {
      result.current.handleKeyDown(enterEvent);
    });

    expect(result.current.isCompletionOpen).toBe(false);
  });

  it('does nothing on Enter when menu is closed', () => {
    const { result } = renderInteraction();

    const enterEvent = {
      key: 'Enter',
      preventDefault: jest.fn(),
    } as unknown as React.KeyboardEvent<HTMLTextAreaElement>;
    act(() => {
      result.current.handleKeyDown(enterEvent);
    });

    expect(result.current.isCompletionOpen).toBe(false);
  });

  it('updateCursor sets cursor from textarea selectionStart', () => {
    const { result } = renderInteraction();
    const fakeTextarea = { selectionStart: 5, value: 'hello' } as HTMLTextAreaElement;

    act(() => {
      result.current.updateCursor(fakeTextarea);
    });

    expect(result.current.cursor).toBe(5);
  });

  it('updateCursor falls back to value length when selectionStart is null', () => {
    const { result } = renderInteraction();
    const fakeTextarea = {
      selectionStart: null,
      value: 'hello',
    } as unknown as HTMLTextAreaElement;

    act(() => {
      result.current.updateCursor(fakeTextarea);
    });

    expect(result.current.cursor).toBe(5);
  });

  it('applyCompletion closes menu and resets activeIndex', () => {
    const { result } = renderInteraction();

    act(() => {
      result.current.setIsCompletionOpen(true);
      result.current.setActiveIndex(2);
    });

    const item: CompletionItem = { kind: 'field', value: 'status', label: 'Status' };
    act(() => {
      result.current.applyCompletion(item);
    });

    expect(result.current.isCompletionOpen).toBe(false);
    expect(result.current.activeIndex).toBe(0);
  });
});
