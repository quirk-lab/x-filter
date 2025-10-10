import { renderHook, act } from '@testing-library/react';
import { render } from '@testing-library/react';
import type { QueryField } from '@x-filter/core';
import { QueryBuilder } from '../components/QueryBuilder';
import { useQueryBuilder } from '../hooks/useQueryBuilder';

const fields: QueryField[] = [
  { key: 'status', label: 'Status', type: 'string', options: ['open', 'closed'] }
];

describe('useQueryBuilder hook', () => {
  it('exposes state mutation helpers', () => {
    const { result } = renderHook(() => useQueryBuilder({ name: 'demo', fields }));

    act(() => {
      result.current.addRule({ field: 'status', operator: 'equals', value: 'open' });
    });

    expect(result.current.state.rules).toHaveLength(1);

    act(() => {
      result.current.reset();
    });

    expect(result.current.state.rules).toHaveLength(0);
  });
});

describe('QueryBuilder component', () => {
  it('renders children render-prop and produces consistent markup', () => {
    const { asFragment } = render(
      <QueryBuilder name="demo" fields={fields}>
        {(api) => (
          <div>
            <button onClick={() => api.addRule({ field: 'status', operator: 'equals', value: 'open' })}>
              Add
            </button>
            <span data-testid="rule-count">{api.state.rules.length}</span>
          </div>
        )}
      </QueryBuilder>
    );

    expect(asFragment()).toMatchInlineSnapshot(`
<DocumentFragment>
  <div>
    <button>
      Add
    </button>
    <span
      data-testid="rule-count"
    >
      0
    </span>
  </div>
</DocumentFragment>
`);
  });
});
