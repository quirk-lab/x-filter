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
const group: FilterGroup = { id: 'root', combinator: 'and', conditions: [rule] };
const filter: Filter = group;
const operator: OperatorDef = { name: 'equals', label: 'equals', arity: 'binary' };
const errors: ValidationError[] = [{ type: 'invalidValue', message: 'Value is invalid' }];

const actions: FilterBuilderActionHandlers = {
  addRule: jest.fn(),
  removeRule: jest.fn(),
  updateRule: jest.fn(),
  addGroup: jest.fn(),
  removeGroup: jest.fn(),
  updateGroup: jest.fn(),
  moveItem: jest.fn(),
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
  errors,
  aria: { label: 'Rule name equals Ada', describedBy: 'r1-errors' },
};

const groupVm: FilterGroupViewModel = {
  kind: 'group',
  id: group.id,
  group,
  depth: 0,
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
  Group: (props) => props.group.children.length,
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
  expect(slots.Rule?.({ ...slotProps, rule: ruleVm })).toBe(1);
});
