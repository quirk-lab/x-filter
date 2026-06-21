import {
  addGroup,
  addRule,
  cloneGroup,
  cloneRule,
  moveRule,
  negateRule,
  removeGroup,
  removeRule,
  updateGroup,
  updateRule,
} from '../mutations';
import type { Filter, FilterGroup, FilterRule } from '../types';
import { isLocked } from '../types';

function makeFilter(): Filter {
  return {
    id: 'root',
    combinator: 'and',
    children: [
      { id: 'locked-rule', field: 'status', operator: 'equals', value: 'open', locked: true },
      { id: 'free-rule', field: 'age', operator: 'gt', value: 18 },
      {
        id: 'locked-group',
        combinator: 'or',
        locked: true,
        children: [{ id: 'g-rule', field: 'name', operator: 'equals', value: 'a' }],
      },
    ],
  };
}

describe('isLocked', () => {
  it('detects the locked flag and tolerates nullish input', () => {
    expect(isLocked({ locked: true })).toBe(true);
    expect(isLocked({ locked: false })).toBe(false);
    expect(isLocked({})).toBe(false);
    expect(isLocked(undefined)).toBe(false);
    expect(isLocked(null)).toBe(false);
  });
});

describe('locked standard mutations are ignored', () => {
  it('updateRule on a locked rule returns the same filter', () => {
    const filter = makeFilter();
    expect(updateRule(filter, 'locked-rule', { value: 'closed' })).toBe(filter);
  });

  it('updateRule still works on a free rule', () => {
    const filter = makeFilter();
    const next = updateRule(filter, 'free-rule', { value: 21 });
    expect(next).not.toBe(filter);
    expect((next.children[1] as FilterRule).value).toBe(21);
  });

  it('removeRule on a locked rule is a no-op', () => {
    const filter = makeFilter();
    expect(removeRule(filter, 'locked-rule')).toBe(filter);
  });

  it('removeRule on a rule inside a locked group is a no-op', () => {
    const filter = makeFilter();
    expect(removeRule(filter, 'g-rule')).toBe(filter);
  });

  it('negateRule on a locked rule is a no-op', () => {
    const filter = makeFilter();
    expect(negateRule(filter, 'locked-rule')).toBe(filter);
  });

  it('moveRule of a locked rule is a no-op', () => {
    const filter = makeFilter();
    expect(moveRule(filter, 'locked-rule', 'root', 2)).toBe(filter);
  });

  it('moveRule into a locked group is a no-op', () => {
    const filter = makeFilter();
    expect(moveRule(filter, 'free-rule', 'locked-group', 0)).toBe(filter);
  });

  it('addRule into a locked group is a no-op', () => {
    const filter = makeFilter();
    expect(addRule(filter, 'locked-group', { field: 'x', operator: 'equals', value: 1 })).toBe(
      filter
    );
  });

  it('addGroup into a locked group is a no-op', () => {
    const filter = makeFilter();
    expect(addGroup(filter, 'locked-group')).toBe(filter);
  });

  it('updateGroup / removeGroup on a locked group are no-ops', () => {
    const filter = makeFilter();
    expect(updateGroup(filter, 'locked-group', { combinator: 'and' })).toBe(filter);
    expect(removeGroup(filter, 'locked-group')).toBe(filter);
  });
});

describe('clone is allowed on locked nodes and yields an editable copy', () => {
  it('cloneRule duplicates a locked rule but unlocks the copy', () => {
    const filter = makeFilter();
    const next = cloneRule(filter, 'locked-rule');
    expect(next.children).toHaveLength(4);
    const clone = next.children[1] as FilterRule;
    expect(clone.id).not.toBe('locked-rule');
    expect(clone.locked).toBe(false);
    // Now editable through the normal mutation path.
    expect(updateRule(next, clone.id, { value: 'closed' })).not.toBe(next);
  });

  it('cloneGroup duplicates a locked group but unlocks the copy root', () => {
    const filter = makeFilter();
    const next = cloneGroup(filter, 'locked-group');
    const clone = next.children[3] as FilterGroup;
    expect(clone.id).not.toBe('locked-group');
    expect(clone.locked).toBe(false);
  });
});
