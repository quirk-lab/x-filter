import {
  addRuleIC,
  cloneRuleIC,
  moveRuleIC,
  removeGroupIC,
  removeRuleIC,
  setCombinatorIC,
  updateGroupIC,
  updateRuleIC,
} from '../ic';
import type { FilterIC, FilterRule } from '../types';

function makeICFilter(): FilterIC {
  return {
    id: 'root',
    children: [
      { id: 'locked-rule', field: 'status', operator: 'equals', value: 'open', locked: true },
      'and',
      { id: 'free-rule', field: 'age', operator: 'gt', value: 18 },
      'and',
      {
        id: 'locked-group',
        locked: true,
        children: [{ id: 'g-rule', field: 'name', operator: 'equals', value: 'a' }],
      },
    ],
  };
}

describe('locked IC mutations are ignored', () => {
  it('updateRuleIC on a locked rule is a no-op', () => {
    const filter = makeICFilter();
    expect(updateRuleIC(filter, 'locked-rule', { value: 'closed' })).toBe(filter);
  });

  it('updateRuleIC works on a free rule', () => {
    const filter = makeICFilter();
    expect(updateRuleIC(filter, 'free-rule', { value: 21 })).not.toBe(filter);
  });

  it('removeRuleIC on a locked rule (or inside a locked group) is a no-op', () => {
    const filter = makeICFilter();
    expect(removeRuleIC(filter, 'locked-rule')).toBe(filter);
    expect(removeRuleIC(filter, 'g-rule')).toBe(filter);
  });

  it('addRuleIC into a locked group is a no-op', () => {
    const filter = makeICFilter();
    expect(addRuleIC(filter, 'locked-group', { field: 'x', operator: 'equals', value: 1 })).toBe(
      filter
    );
  });

  it('updateGroupIC / removeGroupIC on a locked group are no-ops', () => {
    const filter = makeICFilter();
    expect(updateGroupIC(filter, 'locked-group', { not: true })).toBe(filter);
    expect(removeGroupIC(filter, 'locked-group')).toBe(filter);
  });

  it('moveRuleIC of a locked rule is a no-op', () => {
    const filter = makeICFilter();
    expect(moveRuleIC(filter, 'locked-rule', 'root', 1)).toBe(filter);
  });

  it('setCombinatorIC on a locked group is a no-op', () => {
    const filter = makeICFilter();
    expect(setCombinatorIC(filter, 'locked-group', 0, 'or')).toBe(filter);
  });

  it('cloneRuleIC duplicates a locked rule but unlocks the copy', () => {
    const filter = makeICFilter();
    const next = cloneRuleIC(filter, 'locked-rule');
    const clone = next.children.find(
      (c): c is FilterRule =>
        typeof c !== 'string' && 'field' in c && c.field === 'status' && c.id !== 'locked-rule'
    );
    expect(clone?.locked).toBe(false);
  });
});
