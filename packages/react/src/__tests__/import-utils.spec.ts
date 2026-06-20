// Import via the public barrel so the re-export getter is exercised.
import { parseFilterInput } from '@x-filter/react';

describe('parseFilterInput', () => {
  it('rejects empty input', () => {
    const result = parseFilterInput('dsl', '   ');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/Enter a filter/);
  });

  it('parses a DSL expression', () => {
    const result = parseFilterInput('dsl', 'status:equals:open');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.filter.children[0]).toMatchObject({
        field: 'status',
        operator: 'equals',
        value: 'open',
      });
    }
  });

  it('returns an error for invalid DSL', () => {
    const result = parseFilterInput('dsl', '@@@ not valid @@@');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.length).toBeGreaterThan(0);
  });

  it('parses a JSON filter object', () => {
    const result = parseFilterInput(
      'json',
      JSON.stringify({
        combinator: 'and',
        children: [{ field: 'status', operator: 'equals', value: 'open' }],
      })
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.filter.children[0]).toMatchObject({ field: 'status', operator: 'equals' });
    }
  });

  it('reports invalid JSON syntax', () => {
    const result = parseFilterInput('json', '{ not json }');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/Invalid JSON/);
  });

  it('rejects JSON that is not an object', () => {
    for (const input of ['123', '"a string"', '[1,2,3]', 'null']) {
      const result = parseFilterInput('json', input);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toMatch(/filter object/);
    }
  });
});
