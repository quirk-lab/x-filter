import type { FieldSchema } from '@x-filter/core';
import { findOperator, findSchemaField, getFieldOperators } from '../schema-utils';

const schema: FieldSchema[] = [
  {
    name: 'age',
    label: 'Age',
    type: 'number',
    operators: [
      { name: 'gt', label: '>', arity: 'binary' },
      { name: 'lt', label: '<', arity: 'binary' },
    ],
  },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    operators: [{ name: 'equals', label: 'equals', arity: 'binary' }],
  },
];

describe('findSchemaField', () => {
  it('finds a field by name', () => {
    expect(findSchemaField(schema, 'age')?.name).toBe('age');
  });

  it('returns undefined for unknown field', () => {
    expect(findSchemaField(schema, 'nonexistent')).toBeUndefined();
  });

  it('returns undefined when fieldName is undefined', () => {
    expect(findSchemaField(schema, undefined)).toBeUndefined();
  });
});

describe('getFieldOperators', () => {
  it('returns operators for a field', () => {
    const field = findSchemaField(schema, 'age');
    expect(getFieldOperators(field)).toHaveLength(2);
  });

  it('returns empty array when field is undefined', () => {
    expect(getFieldOperators(undefined)).toEqual([]);
  });
});

describe('findOperator', () => {
  it('finds an operator by name', () => {
    const field = findSchemaField(schema, 'age');
    expect(findOperator(field, 'gt')?.name).toBe('gt');
  });

  it('returns undefined for unknown operator', () => {
    const field = findSchemaField(schema, 'age');
    expect(findOperator(field, 'nonexistent')).toBeUndefined();
  });

  it('returns undefined when field is undefined', () => {
    expect(findOperator(undefined, 'gt')).toBeUndefined();
  });
});
