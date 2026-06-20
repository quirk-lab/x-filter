import type { FieldSchema } from '@x-filter/core';
import { getDefaultRuleUpdatesForField } from '../rule-defaults';

const schema: FieldSchema[] = [
  {
    name: 'age',
    label: 'Age',
    type: 'number',
    operators: [
      { name: 'gt', label: '>', arity: 'binary' },
      { name: 'isEmpty', label: 'is empty', arity: 'unary' },
    ],
    defaultOperator: 'gt',
    defaultValue: 0,
  },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    values: [{ value: 'active', label: 'Active' }],
  },
];

describe('getDefaultRuleUpdatesForField', () => {
  it('returns field, operator, and default value for a binary field', () => {
    const result = getDefaultRuleUpdatesForField(schema, 'age');
    expect(result).toEqual({ field: 'age', operator: 'gt', value: 0 });
  });

  it('returns undefined value for unary operator', () => {
    const schemaWithUnaryDefault: FieldSchema[] = [
      {
        name: 'name',
        label: 'Name',
        type: 'text',
        operators: [{ name: 'isEmpty', label: 'is empty', arity: 'unary' }],
        defaultOperator: 'isEmpty',
      },
    ];
    const result = getDefaultRuleUpdatesForField(schemaWithUnaryDefault, 'name');
    expect(result).toEqual({ field: 'name', operator: 'isEmpty', value: undefined });
  });

  it('falls back to first operator when no defaultOperator', () => {
    const result = getDefaultRuleUpdatesForField(schema, 'status');
    expect(result.field).toBe('status');
    expect(result.value).toBeNull();
    // status is a select type with no explicit operators, getOperators returns defaults
    expect(typeof result.operator).toBe('string');
  });

  it('returns null value when field has no defaultValue', () => {
    const result = getDefaultRuleUpdatesForField(schema, 'status');
    expect(result.value).toBeNull();
  });

  it('handles unknown field name', () => {
    const result = getDefaultRuleUpdatesForField(schema, 'nonexistent');
    expect(result).toEqual({ field: 'nonexistent', operator: '', value: null });
  });
});
