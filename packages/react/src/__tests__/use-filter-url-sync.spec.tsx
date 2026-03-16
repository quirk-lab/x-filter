import { act, renderHook } from '@testing-library/react';
import type { FieldSchema, Filter } from '@x-filter/core';
import { formatDSL, toJSON } from '@x-filter/core';
import { useFilterUrlSync } from '../use-filter-url-sync';

const schema: FieldSchema[] = [{ name: 'name', label: 'Name', type: 'text' }];

const makeFilter = (): Filter => ({
  id: 'root',
  combinator: 'and',
  conditions: [{ id: 'r1', field: 'name', operator: 'equals', value: 'John' }],
});

function createMockParams(initial = '') {
  let params = new URLSearchParams(initial);
  return {
    get: () => new URLSearchParams(params.toString()),
    set: (p: URLSearchParams) => {
      params = p;
    },
    raw: () => params,
  };
}

function getFromUrl(
  result: { current: ReturnType<typeof useFilterUrlSync> },
): Filter | null {
  let decoded: Filter | null = null;
  act(() => {
    decoded = result.current.getFilterFromUrl();
  });
  return decoded;
}

describe('useFilterUrlSync', () => {
  describe('DSL mode (default)', () => {
    it('setFilterToUrl encodes filter as DSL string', () => {
      const mock = createMockParams();
      const { result } = renderHook(() =>
        useFilterUrlSync({
          getSearchParams: mock.get,
          setSearchParams: mock.set,
        }),
      );

      const filter = makeFilter();
      act(() => {
        result.current.setFilterToUrl(filter);
      });

      const stored = mock.raw().get('filter');
      expect(stored).toBe(formatDSL(filter));
    });

    it('getFilterFromUrl decodes DSL from URL', () => {
      const filter = makeFilter();
      const dsl = formatDSL(filter);
      const mock = createMockParams(`filter=${encodeURIComponent(dsl)}`);

      const { result } = renderHook(() =>
        useFilterUrlSync({
          getSearchParams: mock.get,
          setSearchParams: mock.set,
        }),
      );

      const decoded = getFromUrl(result);
      expect(decoded).not.toBeNull();
      expect(decoded).toMatchObject({
        conditions: [expect.objectContaining({ field: 'name', operator: 'equals' })],
      });
      expect(result.current.error).toBeNull();
    });

    it('returns null when no param in URL', () => {
      const mock = createMockParams();

      const { result } = renderHook(() =>
        useFilterUrlSync({
          getSearchParams: mock.get,
          setSearchParams: mock.set,
        }),
      );

      const decoded = getFromUrl(result);
      expect(decoded).toBeNull();
    });

    it('sets error on invalid DSL in URL', () => {
      const mock = createMockParams(`filter=${encodeURIComponent('@@@ invalid DSL')}`);

      const { result } = renderHook(() =>
        useFilterUrlSync({
          getSearchParams: mock.get,
          setSearchParams: mock.set,
        }),
      );

      const decoded = getFromUrl(result);
      expect(decoded).toBeNull();
      expect(result.current.error).toBeTruthy();
    });

    it('clears error on successful getFilterFromUrl', () => {
      const mock = createMockParams(`filter=${encodeURIComponent('@@@ bad')}`);

      const { result } = renderHook(() =>
        useFilterUrlSync({
          getSearchParams: mock.get,
          setSearchParams: mock.set,
        }),
      );

      getFromUrl(result);
      expect(result.current.error).toBeTruthy();

      const validDsl = formatDSL(makeFilter());
      mock.set(new URLSearchParams(`filter=${encodeURIComponent(validDsl)}`));

      getFromUrl(result);
      expect(result.current.error).toBeNull();
    });

    it('setFilterToUrl clears error', () => {
      const mock = createMockParams(`filter=${encodeURIComponent('@@@ bad')}`);

      const { result } = renderHook(() =>
        useFilterUrlSync({
          getSearchParams: mock.get,
          setSearchParams: mock.set,
        }),
      );

      getFromUrl(result);
      expect(result.current.error).toBeTruthy();

      act(() => {
        result.current.setFilterToUrl(makeFilter());
      });
      expect(result.current.error).toBeNull();
    });
  });

  describe('JSON mode', () => {
    it('setFilterToUrl encodes filter as JSON', () => {
      const mock = createMockParams();
      const { result } = renderHook(() =>
        useFilterUrlSync({
          mode: 'json',
          getSearchParams: mock.get,
          setSearchParams: mock.set,
        }),
      );

      const filter = makeFilter();
      act(() => {
        result.current.setFilterToUrl(filter);
      });

      const stored = mock.raw().get('filter');
      expect(stored).toBe(JSON.stringify(toJSON(filter)));
    });

    it('getFilterFromUrl decodes JSON from URL', () => {
      const filter = makeFilter();
      const json = JSON.stringify(toJSON(filter));
      const mock = createMockParams(`filter=${encodeURIComponent(json)}`);

      const { result } = renderHook(() =>
        useFilterUrlSync({
          mode: 'json',
          getSearchParams: mock.get,
          setSearchParams: mock.set,
        }),
      );

      const decoded = getFromUrl(result);
      expect(decoded).not.toBeNull();
      expect(decoded).toMatchObject({
        conditions: [expect.objectContaining({ field: 'name', operator: 'equals' })],
      });
      expect(result.current.error).toBeNull();
    });

    it('sets error on invalid JSON', () => {
      const mock = createMockParams(`filter=${encodeURIComponent('{not valid json}}}')}`);

      const { result } = renderHook(() =>
        useFilterUrlSync({
          mode: 'json',
          getSearchParams: mock.get,
          setSearchParams: mock.set,
        }),
      );

      const decoded = getFromUrl(result);
      expect(decoded).toBeNull();
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('custom paramName', () => {
    it('uses custom param name for read and write', () => {
      const mock = createMockParams();
      const { result } = renderHook(() =>
        useFilterUrlSync({
          paramName: 'q',
          getSearchParams: mock.get,
          setSearchParams: mock.set,
        }),
      );

      const filter = makeFilter();
      act(() => {
        result.current.setFilterToUrl(filter);
      });

      expect(mock.raw().get('q')).toBe(formatDSL(filter));
      expect(mock.raw().get('filter')).toBeNull();

      const decoded = getFromUrl(result);
      expect(decoded).not.toBeNull();
      expect(decoded).toMatchObject({
        conditions: [expect.objectContaining({ field: 'name' })],
      });
    });
  });

  describe('custom getSearchParams/setSearchParams', () => {
    it('delegates to custom functions', () => {
      const getSpy = jest.fn(() => new URLSearchParams('filter=name:equals:custom'));
      const setSpy = jest.fn();

      const { result } = renderHook(() =>
        useFilterUrlSync({
          getSearchParams: getSpy,
          setSearchParams: setSpy,
        }),
      );

      getFromUrl(result);
      expect(getSpy).toHaveBeenCalled();

      act(() => {
        result.current.setFilterToUrl(makeFilter());
      });
      expect(setSpy).toHaveBeenCalledWith(expect.any(URLSearchParams));
    });
  });

  describe('default options', () => {
    const originalLocation = window.location;
    const originalHistory = window.history.replaceState;

    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        writable: true,
        value: {
          ...originalLocation,
          search: '',
          href: 'http://localhost/',
        },
      });
      window.history.replaceState = jest.fn();
    });

    afterEach(() => {
      Object.defineProperty(window, 'location', {
        writable: true,
        value: originalLocation,
      });
      window.history.replaceState = originalHistory;
    });

    it('works with no options using window.location', () => {
      const { result } = renderHook(() => useFilterUrlSync());

      const decoded = getFromUrl(result);
      expect(decoded).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('setFilterToUrl uses window.history.replaceState', () => {
      const { result } = renderHook(() => useFilterUrlSync());

      act(() => {
        result.current.setFilterToUrl(makeFilter());
      });

      expect(window.history.replaceState).toHaveBeenCalled();
    });

    it('getFilterFromUrl reads from window.location.search', () => {
      const filter = makeFilter();
      const dsl = formatDSL(filter);
      Object.defineProperty(window, 'location', {
        writable: true,
        value: {
          ...window.location,
          search: `?filter=${encodeURIComponent(dsl)}`,
          href: `http://localhost/?filter=${encodeURIComponent(dsl)}`,
        },
      });

      const { result } = renderHook(() => useFilterUrlSync());

      const decoded = getFromUrl(result);
      expect(decoded).not.toBeNull();
      expect(decoded).toMatchObject({
        conditions: [expect.objectContaining({ field: 'name' })],
      });
    });
  });
});
