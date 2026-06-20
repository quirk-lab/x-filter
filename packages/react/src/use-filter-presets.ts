import type { Filter } from '@x-filter/core';
import { fromJSON, toJSON } from '@x-filter/core';
import { useCallback, useRef, useState } from 'react';
import type {
  FilterPreset,
  PresetStorage,
  UseFilterPresetsOptions,
  UseFilterPresetsReturn,
} from './types';

const DEFAULT_STORAGE_KEY = 'x-filter-presets';
const DEFAULT_MAX_PRESETS = 10;

interface StoredPreset {
  name: string;
  filter: string;
  createdAt: number;
}

function createMemoryStorage(): PresetStorage {
  const map = new Map<string, string>();
  return {
    getItem: (key) => (map.has(key) ? (map.get(key) as string) : null),
    setItem: (key, value) => {
      map.set(key, value);
    },
  };
}

function resolveDefaultStorage(): PresetStorage {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // Accessing localStorage can throw under strict privacy modes.
  }
  return createMemoryStorage();
}

const defaultSerialize = (filter: Filter): string => JSON.stringify(toJSON(filter));
const defaultDeserialize = (raw: string): Filter => fromJSON(JSON.parse(raw)) as Filter;

export function useFilterPresets(options: UseFilterPresetsOptions = {}): UseFilterPresetsReturn {
  const {
    storageKey = DEFAULT_STORAGE_KEY,
    maxPresets = DEFAULT_MAX_PRESETS,
    serialize = defaultSerialize,
    deserialize = defaultDeserialize,
  } = options;

  // Resolve storage exactly once so reads/writes target a stable backend.
  const storageRef = useRef<PresetStorage | null>(null);
  if (storageRef.current === null) {
    storageRef.current = options.storage ?? resolveDefaultStorage();
  }
  const storage = storageRef.current;

  const writeStorage = useCallback(
    (next: FilterPreset[]): void => {
      try {
        const stored: StoredPreset[] = next.map((p) => ({
          name: p.name,
          filter: serialize(p.filter),
          createdAt: p.createdAt,
        }));
        storage.setItem(storageKey, JSON.stringify(stored));
      } catch {
        // Ignore quota / serialization failures; in-memory state is source of truth.
      }
    },
    [storage, storageKey, serialize]
  );

  const [presets, setPresets] = useState<FilterPreset[]>(() => {
    try {
      const raw = storage.getItem(storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(
          (p): p is StoredPreset =>
            !!p && typeof (p as StoredPreset).name === 'string' && 'filter' in (p as object)
        )
        .map((p) => ({
          name: p.name,
          filter: deserialize(p.filter),
          createdAt: typeof p.createdAt === 'number' ? p.createdAt : 0,
        }));
    } catch {
      return [];
    }
  });

  const commit = useCallback(
    (compute: (current: FilterPreset[]) => FilterPreset[]): void => {
      setPresets((current) => {
        const next = compute(current);
        if (next === current) return current;
        writeStorage(next);
        return next;
      });
    },
    [writeStorage]
  );

  const save = useCallback(
    (name: string, filter: Filter): void => {
      const trimmed = name.trim();
      if (!trimmed) return;
      commit((current) => {
        const existing = current.findIndex((p) => p.name === trimmed);
        const entry: FilterPreset = { name: trimmed, filter, createdAt: Date.now() };
        if (existing >= 0) {
          const next = current.slice();
          next[existing] = entry;
          return next;
        }
        const next = [...current, entry];
        return next.length > maxPresets ? next.slice(next.length - maxPresets) : next;
      });
    },
    [commit, maxPresets]
  );

  const load = useCallback(
    (index: number): Filter | null => {
      const preset = presets[index];
      if (!preset) return null;
      // Re-hydrate so each load yields an independent tree with fresh ids.
      return deserialize(serialize(preset.filter));
    },
    [presets, serialize, deserialize]
  );

  const remove = useCallback(
    (index: number): void => {
      commit((current) =>
        index >= 0 && index < current.length ? current.filter((_, i) => i !== index) : current
      );
    },
    [commit]
  );

  const rename = useCallback(
    (index: number, name: string): void => {
      const trimmed = name.trim();
      if (!trimmed) return;
      commit((current) =>
        index >= 0 && index < current.length
          ? current.map((p, i) => (i === index ? { ...p, name: trimmed } : p))
          : current
      );
    },
    [commit]
  );

  const clear = useCallback((): void => {
    commit((current) => (current.length === 0 ? current : []));
  }, [commit]);

  return { presets, save, load, remove, rename, clear };
}
