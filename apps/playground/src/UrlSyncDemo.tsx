import type { FieldSchema, Filter } from '@x-filter/core';
import { formatDSL } from '@x-filter/core';
import { type UseFilterUrlSyncOptions, useFilterUrlSync } from '@x-filter/react';
import { ShadcnFilterBuilder } from '@x-filter/shadcn';
import { type CSSProperties, useEffect, useRef, useState } from 'react';

export interface UrlSyncDemoProps {
  schema: FieldSchema[];
  initialFilter: Filter;
  /** Override the URL adapter (defaults to `window.location` + `history.replaceState`). */
  urlSyncOptions?: UseFilterUrlSyncOptions;
  styles?: Partial<
    Record<'card' | 'cardHeader' | 'muted' | 'builderShell' | 'code', CSSProperties>
  >;
}

function buildExample(schema: FieldSchema[]): Filter {
  const [first, second] = schema;
  return {
    id: 'root',
    combinator: 'and',
    children: [
      {
        id: 'example-1',
        field: first?.name ?? 'status',
        operator: first?.defaultOperator ?? 'equals',
        value: first?.defaultValue ?? 'closed',
      },
      {
        id: 'example-2',
        field: second?.name ?? 'priority',
        operator: second?.defaultOperator ?? 'gt',
        value: second?.defaultValue ?? 5,
      },
    ],
  };
}

/**
 * Demonstrates `useFilterUrlSync`: the builder's filter is mirrored into the page
 * URL as a DSL string on every change, and restored from the URL on mount — so a
 * shared/bookmarked link reopens the exact same filter.
 */
export function UrlSyncDemo({ schema, initialFilter, urlSyncOptions, styles }: UrlSyncDemoProps) {
  const { getFilterFromUrl, setFilterToUrl, error } = useFilterUrlSync({
    mode: 'dsl',
    ...urlSyncOptions,
  });
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const restored = useRef(false);

  // Restore from the URL once, after mount (avoids set-state-during-render).
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const fromUrl = getFilterFromUrl();
    if (fromUrl) setFilter(fromUrl);
  }, [getFilterFromUrl]);

  const sync = (next: Filter) => {
    setFilter(next);
    setFilterToUrl(next);
  };

  const shareUrl = `?filter=${encodeURIComponent(formatDSL(filter))}`;

  const copy = () => {
    navigator.clipboard?.writeText(
      `${window.location.origin}${window.location.pathname}${shareUrl}`
    );
  };

  return (
    <section style={styles?.card}>
      <h2 style={styles?.cardHeader}>URL Sync Demo (useFilterUrlSync)</h2>
      <p style={styles?.muted}>
        Every edit mirrors this filter into the page URL as a DSL string. Reload the page or open
        the shareable link below to restore the exact same filter.
      </p>
      <div style={styles?.builderShell}>
        <ShadcnFilterBuilder dsl onChange={sync} schema={schema} value={filter} />
      </div>
      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button onClick={() => sync(buildExample(schema))} type="button">
          Load shareable example
        </button>
        <button onClick={copy} type="button">
          Copy link
        </button>
      </div>
      <p style={{ ...styles?.muted, marginTop: '0.75rem' }}>Shareable URL parameter:</p>
      <code data-testid="url-sync-share" style={styles?.code}>
        {shareUrl}
      </code>
      {error ? (
        <p data-testid="url-sync-error" role="alert" style={{ color: '#b91c1c' }}>
          URL parse error: {error}
        </p>
      ) : null}
    </section>
  );
}
