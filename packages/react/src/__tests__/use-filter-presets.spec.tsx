import { act, renderHook } from '@testing-library/react';
import type { Filter } from '@x-filter/core';
import type { PresetStorage } from '../types';
import { useFilterPresets } from '../use-filter-presets';

function makeFilter(value: string, id = 'r1'): Filter {
  return {
    id: 'root',
    combinator: 'and',
    children: [{ id, field: 'name', operator: 'equals', value }],
  };
}

function createMemoryStorage(initial: Record<string, string> = {}): PresetStorage & {
  dump: () => Record<string, string>;
} {
  const map = new Map<string, string>(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? (map.get(k) as string) : null),
    setItem: (k, v) => {
      map.set(k, v);
    },
    dump: () => Object.fromEntries(map),
  };
}

describe('useFilterPresets', () => {
  it('starts empty when storage is empty', () => {
    const storage = createMemoryStorage();
    const { result } = renderHook(() => useFilterPresets({ storage }));
    expect(result.current.presets).toEqual([]);
  });

  it('hydrates existing presets from storage on mount', () => {
    const storage = createMemoryStorage();
    const { result: writer } = renderHook(() => useFilterPresets({ storage }));
    act(() => writer.current.save('Active', makeFilter('a')));

    const { result } = renderHook(() => useFilterPresets({ storage }));
    expect(result.current.presets).toHaveLength(1);
    expect(result.current.presets[0].name).toBe('Active');
    expect(result.current.presets[0].filter.children).toHaveLength(1);
  });

  it('save round-trips a filter through storage', () => {
    const storage = createMemoryStorage();
    const { result } = renderHook(() => useFilterPresets({ storage }));

    act(() => result.current.save('Mine', makeFilter('a')));

    expect(result.current.presets).toHaveLength(1);
    expect(result.current.presets[0].name).toBe('Mine');
    expect(typeof result.current.presets[0].createdAt).toBe('number');
    expect(storage.dump()['x-filter-presets']).toContain('Mine');
  });

  it('rejects empty or whitespace-only names', () => {
    const storage = createMemoryStorage();
    const { result } = renderHook(() => useFilterPresets({ storage }));

    act(() => result.current.save('   ', makeFilter('a')));
    expect(result.current.presets).toEqual([]);
  });

  it('overwrites an existing preset with the same name instead of duplicating', () => {
    const storage = createMemoryStorage();
    const { result } = renderHook(() => useFilterPresets({ storage }));

    act(() => result.current.save('Dupe', makeFilter('a')));
    act(() => result.current.save('Dupe', makeFilter('b')));

    expect(result.current.presets).toHaveLength(1);
    const loaded = result.current.load(0);
    expect((loaded?.children[0] as { value: unknown }).value).toBe('b');
  });

  it('drops the oldest preset FIFO once maxPresets is exceeded', () => {
    const storage = createMemoryStorage();
    const { result } = renderHook(() => useFilterPresets({ storage, maxPresets: 2 }));

    act(() => result.current.save('one', makeFilter('1')));
    act(() => result.current.save('two', makeFilter('2')));
    act(() => result.current.save('three', makeFilter('3')));

    expect(result.current.presets.map((p) => p.name)).toEqual(['two', 'three']);
  });

  it('load returns an independent copy with fresh ids and null for bad index', () => {
    const storage = createMemoryStorage();
    const { result } = renderHook(() => useFilterPresets({ storage }));
    act(() => result.current.save('Mine', makeFilter('a', 'orig-id')));

    const loaded = result.current.load(0);
    expect(loaded).not.toBeNull();
    expect(loaded?.children[0].id).not.toBe('orig-id');
    // Two loads must not share rule identities.
    const second = result.current.load(0);
    expect(second?.children[0].id).not.toBe(loaded?.children[0].id);
    expect(result.current.load(99)).toBeNull();
  });

  it('remove deletes by index and persists', () => {
    const storage = createMemoryStorage();
    const { result } = renderHook(() => useFilterPresets({ storage }));
    act(() => result.current.save('a', makeFilter('a')));
    act(() => result.current.save('b', makeFilter('b')));

    act(() => result.current.remove(0));

    expect(result.current.presets.map((p) => p.name)).toEqual(['b']);
    expect(storage.dump()['x-filter-presets']).not.toContain('"name":"a"');
  });

  it('rename updates the name and rejects empty names', () => {
    const storage = createMemoryStorage();
    const { result } = renderHook(() => useFilterPresets({ storage }));
    act(() => result.current.save('old', makeFilter('a')));

    act(() => result.current.rename(0, 'new'));
    expect(result.current.presets[0].name).toBe('new');

    act(() => result.current.rename(0, '  '));
    expect(result.current.presets[0].name).toBe('new');
  });

  it('clear empties the list and persists', () => {
    const storage = createMemoryStorage();
    const { result } = renderHook(() => useFilterPresets({ storage }));
    act(() => result.current.save('a', makeFilter('a')));

    act(() => result.current.clear());

    expect(result.current.presets).toEqual([]);
    expect(storage.dump()['x-filter-presets']).toBe('[]');
  });

  it('recovers gracefully from corrupt storage payloads', () => {
    const storage = createMemoryStorage({ 'x-filter-presets': '{not json' });
    const { result } = renderHook(() => useFilterPresets({ storage }));
    expect(result.current.presets).toEqual([]);
  });

  it('honors custom serialize/deserialize', () => {
    const storage = createMemoryStorage();
    const serialize = jest.fn((f: Filter) => JSON.stringify(f));
    const deserialize = jest.fn((s: string) => JSON.parse(s) as Filter);
    const { result } = renderHook(() => useFilterPresets({ storage, serialize, deserialize }));

    act(() => result.current.save('Mine', makeFilter('a', 'keep-id')));
    expect(serialize).toHaveBeenCalled();

    const loaded = result.current.load(0);
    expect(deserialize).toHaveBeenCalled();
    expect(loaded?.children[0].id).toBe('keep-id');
  });

  it('falls back to window.localStorage when no storage is injected', () => {
    window.localStorage.clear();
    const { result } = renderHook(() => useFilterPresets({ storageKey: 'preset-default-test' }));
    act(() => result.current.save('Persisted', makeFilter('a')));

    expect(window.localStorage.getItem('preset-default-test')).toContain('Persisted');
    window.localStorage.clear();
  });
});
