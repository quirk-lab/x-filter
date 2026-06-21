import { setCombinatorIC } from '../ic';
import type { FilterGroupIC } from '../types';

const makeIC = (): FilterGroupIC => ({
  id: 'root',
  children: [
    { id: 'r1', field: 'a', operator: 'eq', value: 1 },
    'and',
    { id: 'r2', field: 'b', operator: 'eq', value: 2 },
    'or',
    { id: 'r3', field: 'c', operator: 'eq', value: 3 },
  ],
});

describe('setCombinatorIC', () => {
  it('changes the combinator at the given combinator index', () => {
    const next = setCombinatorIC(makeIC(), 'root', 0, 'or') as FilterGroupIC;
    expect(next.children[1]).toBe('or');
    // second combinator untouched
    expect(next.children[3]).toBe('or');
  });

  it('changes the second combinator independently of the first', () => {
    const next = setCombinatorIC(makeIC(), 'root', 1, 'and') as FilterGroupIC;
    expect(next.children[1]).toBe('and');
    expect(next.children[3]).toBe('and');
  });

  it('returns the same reference when the combinator is unchanged', () => {
    const input = makeIC();
    expect(setCombinatorIC(input, 'root', 0, 'and')).toBe(input);
  });

  it('returns the same reference when the group is not found', () => {
    const input = makeIC();
    expect(setCombinatorIC(input, 'missing', 0, 'or')).toBe(input);
  });

  it('returns the same reference when the combinator index is out of range', () => {
    const input = makeIC();
    expect(setCombinatorIC(input, 'root', 5, 'or')).toBe(input);
  });

  it('updates a nested IC group while preserving sibling refs', () => {
    const nested: FilterGroupIC = {
      id: 'root',
      children: [
        { id: 'r1', field: 'a', operator: 'eq', value: 1 },
        'and',
        {
          id: 'g1',
          children: [
            { id: 'r2', field: 'b', operator: 'eq', value: 2 },
            'and',
            { id: 'r3', field: 'c', operator: 'eq', value: 3 },
          ],
        },
      ],
    };
    const next = setCombinatorIC(nested, 'g1', 0, 'or') as FilterGroupIC;
    const g1 = next.children[2] as FilterGroupIC;
    expect(g1.children[1]).toBe('or');
    // structural sharing: untouched leaf keeps its reference
    expect(next.children[0]).toBe(nested.children[0]);
  });
});
