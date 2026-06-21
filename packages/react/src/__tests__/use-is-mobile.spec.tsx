import { act, renderHook } from '@testing-library/react';
import { DEFAULT_MOBILE_BREAKPOINT, useIsMobile } from '../use-is-mobile';

type Listener = () => void;

function installMatchMedia(initialMatches: boolean) {
  const listeners = new Set<Listener>();
  let matches = initialMatches;
  const calls: string[] = [];

  const matchMedia = jest.fn((query: string) => {
    calls.push(query);
    return {
      get matches() {
        return matches;
      },
      media: query,
      addEventListener: (_: string, cb: Listener) => listeners.add(cb),
      removeEventListener: (_: string, cb: Listener) => listeners.delete(cb),
    } as unknown as MediaQueryList;
  });

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: matchMedia,
  });

  return {
    calls,
    setMatches(next: boolean) {
      matches = next;
      for (const cb of listeners) cb();
    },
  };
}

describe('useIsMobile', () => {
  const original = Object.getOwnPropertyDescriptor(window, 'matchMedia');

  afterEach(() => {
    if (original) {
      Object.defineProperty(window, 'matchMedia', original);
    } else {
      delete (window as { matchMedia?: unknown }).matchMedia;
    }
  });

  it('returns false (desktop) when matchMedia is unavailable', () => {
    if ('matchMedia' in window) {
      delete (window as { matchMedia?: unknown }).matchMedia;
    }
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('reflects the initial matchMedia result', () => {
    installMatchMedia(true);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('updates when the media query changes', () => {
    const mm = installMatchMedia(false);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    act(() => mm.setMatches(true));
    expect(result.current).toBe(true);

    act(() => mm.setMatches(false));
    expect(result.current).toBe(false);
  });

  it('queries a max-width just below the default breakpoint', () => {
    const mm = installMatchMedia(false);
    renderHook(() => useIsMobile());
    expect(mm.calls[0]).toBe(`(max-width: ${DEFAULT_MOBILE_BREAKPOINT - 0.02}px)`);
  });

  it('honors a custom breakpoint', () => {
    const mm = installMatchMedia(false);
    renderHook(() => useIsMobile(900));
    expect(mm.calls[0]).toBe('(max-width: 899.98px)');
  });
});
