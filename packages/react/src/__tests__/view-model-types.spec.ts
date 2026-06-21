import type {
  FieldSchema,
  Filter,
  FilterGroup,
  FilterRule,
  OperatorDef,
  ValidationError,
} from '@x-filter/core';
import type {
  FilterBuilderActionHandlers,
  FilterBuilderClassNames,
  FilterBuilderLabels,
  FilterBuilderSlotProps,
  FilterBuilderSlots,
  FilterGroupViewModel,
  FilterNodeViewModel,
  FilterRuleViewModel,
} from '../index';

const schema: FieldSchema[] = [{ name: 'name', label: 'Name', type: 'text' }];

const rule: FilterRule = { id: 'r1', field: 'name', operator: 'equals', value: 'Ada' };
const group: FilterGroup = { id: 'root', combinator: 'and', children: [rule] };
const filter: Filter = group;
const operator: OperatorDef = { name: 'equals', label: 'equals', arity: 'binary' };
const errors: ValidationError[] = [{ type: 'invalidValue', message: 'Value is invalid' }];

const actions: FilterBuilderActionHandlers = {
  addRule: (_groupId, _rule) => undefined,
  removeRule: (_ruleId) => undefined,
  updateRule: (_ruleId, _updates) => undefined,
  addGroup: (_groupId, _group) => undefined,
  removeGroup: (_groupId) => undefined,
  updateGroup: (_groupId, _updates) => undefined,
  setCombinator: (_groupId, _comboIndex, _combinator) => undefined,
  cloneRule: (_ruleId) => undefined,
  cloneGroup: (_groupId) => undefined,
  clear: () => undefined,
  moveItem: (_operation) => undefined,
  canDrop: (dragId, targetGroupId) => dragId !== targetGroupId,
};

const labels: FilterBuilderLabels = {
  addRule: 'Add rule',
  removeRule: 'Remove rule',
  field: 'Field',
};

const classNames: FilterBuilderClassNames = {
  root: 'root',
  group: 'group',
  rule: 'rule',
};

const ruleVm: FilterRuleViewModel = {
  kind: 'rule',
  id: rule.id,
  rule,
  field: schema[0],
  operator,
  locked: false,
  errors,
  aria: { label: 'Rule name equals Ada', describedBy: 'r1-errors' },
};

const groupVm: FilterGroupViewModel = {
  kind: 'group',
  id: group.id,
  group,
  depth: 0,
  locked: false,
  children: [ruleVm],
  aria: { label: 'Filter group' },
};

const nodeVm: FilterNodeViewModel = groupVm;

const slotProps: FilterBuilderSlotProps = {
  filter,
  schema,
  actions,
};

const slots: FilterBuilderSlots = {
  Root: (props) => props.children,
  Group: (props) => props.children,
  Rule: (props) => props.rule.errors.length,
  FieldSelector: (props) => props.rule.field?.label,
  OperatorSelector: (props) => props.rule.operator?.label,
  ValueEditor: (props) => props.rule.rule.value as string,
};

test('shared adapter types support public slots, labels, classNames, and view models', () => {
  expect(labels.addRule).toBe('Add rule');
  expect(classNames.rule).toBe('rule');
  expect(groupVm.children[0]).toBe(ruleVm);
  expect(nodeVm.kind).toBe('group');
  expect(actions.canDrop('r1', 'root')).toBe(true);
  expect(slots.Group?.({ ...slotProps, group: groupVm, children: 'group children' })).toBe(
    'group children'
  );
  expect(slots.Rule?.({ ...slotProps, rule: ruleVm })).toBe(1);
});
