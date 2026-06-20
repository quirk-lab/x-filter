import { fireEvent, render, screen } from '@testing-library/react';
import type { FieldSchema, Filter } from '@x-filter/core';
import { UrlSyncDemo } from '../UrlSyncDemo';

const schema: FieldSchema[] = [
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    defaultOperator: 'equals',
    defaultValue: 'closed',
    operators: [{ name: 'equals', label: 'equals', arity: 'binary' }],
    values: [
      { value: 'open', label: 'Open' },
      { value: 'closed', label: 'Closed' },
    ],
  },
  {
    name: 'priority',
    label: 'Priority',
    type: 'number',
    defaultOperator: 'gt',
    defaultValue: 5,
    operators: [{ name: 'gt', label: 'greater than', arity: 'binary' }],
  },
];

const initialFilter: Filter = {
  id: 'root',
  combinator: 'and',
  children: [{ id: 'r1', field: 'status', operator: 'equals', value: 'open' }],
};

function createMockParams(initial = '') {
  let params = new URLSearchParams(initial);
  return {
    get: () => new URLSearchParams(params.toString()),
    set: (next: URLSearchParams) => {
      params = next;
    },
    raw: () => params,
  };
}

describe('UrlSyncDemo', () => {
  it('restores the filter from the URL on mount', () => {
    const mock = createMockParams(`filter=${encodeURIComponent('status:equals:closed')}`);
    render(
      <UrlSyncDemo
        schema={schema}
        initialFilter={initialFilter}
        urlSyncOptions={{ getSearchParams: mock.get, setSearchParams: mock.set }}
      />
    );

    const share = screen.getByTestId('url-sync-share').textContent ?? '';
    expect(decodeURIComponent(share)).toContain('status:equals:closed');
  });

  it('writes the filter to the URL when it changes', () => {
    const mock = createMockParams();
    render(
      <UrlSyncDemo
        schema={schema}
        initialFilter={initialFilter}
        urlSyncOptions={{ getSearchParams: mock.get, setSearchParams: mock.set }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Load shareable example/i }));

    const stored = mock.raw().get('filter') ?? '';
    expect(stored).toContain('status:equals:closed');
    expect(stored).toContain('priority:gt:5');
    expect(decodeURIComponent(screen.getByTestId('url-sync-share').textContent ?? '')).toContain(
      'priority:gt:5'
    );
  });

  it('surfaces a parse error for a malformed URL parameter', () => {
    const mock = createMockParams(`filter=${encodeURIComponent('@@@ invalid DSL')}`);
    render(
      <UrlSyncDemo
        schema={schema}
        initialFilter={initialFilter}
        urlSyncOptions={{ getSearchParams: mock.get, setSearchParams: mock.set }}
      />
    );

    expect(screen.getByTestId('url-sync-error')).not.toBeNull();
  });
});
