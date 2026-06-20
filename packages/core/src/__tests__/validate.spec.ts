import type { FieldSchema, FilterAny } from '../types';
import { validate } from '../validate';

const schema: FieldSchema[] = [
  { name: 'name', label: 'Name', type: 'text' },
  { name: 'age', label: 'Age', type: 'number' },
  { name: 'birthday', label: 'Birthday', type: 'date' },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    values: [{ value: 'active', label: 'Active' }],
  },
  { name: 'tags', label: 'Tags', type: 'multiSelect' },
  { name: 'active', label: 'Active', type: 'boolean' },
];

describe('validate', () => {
  it('valid filter with correct types passes (valid: true, empty errors)', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [
        { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
        { id: 'r2', field: 'age', operator: 'gt', value: 18 },
      ],
    };
    const result = validate(filter, schema);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('empty filter is valid', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [],
    };
    const result = validate(filter, schema);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('invalid field name → invalidField error', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'unknownField', operator: 'equals', value: 'x' }],
    };
    const result = validate(filter, schema);
    expect(result.valid).toBe(false);
    expect(result.errors.r1).toHaveLength(1);
    expect(result.errors.r1[0].type).toBe('invalidField');
    expect(result.errors.r1[0].message).toContain('unknownField');
  });

  it('invalid operator for field type → invalidOperator error', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'age', operator: 'contains', value: 10 }],
    };
    const result = validate(filter, schema);
    expect(result.valid).toBe(false);
    expect(result.errors.r1).toHaveLength(1);
    expect(result.errors.r1[0].type).toBe('invalidOperator');
    expect(result.errors.r1[0].message).toContain('contains');
  });

  it('missing value (null) for binary operator → missingValue', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'name', operator: 'equals', value: null }],
    };
    const result = validate(filter, schema);
    expect(result.valid).toBe(false);
    expect(result.errors.r1).toHaveLength(1);
    expect(result.errors.r1[0].type).toBe('missingValue');
  });

  it('missing value (empty string) for binary operator → missingValue', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'name', operator: 'equals', value: '' }],
    };
    const result = validate(filter, schema);
    expect(result.valid).toBe(false);
    expect(result.errors.r1).toHaveLength(1);
    expect(result.errors.r1[0].type).toBe('missingValue');
  });

  it('valid unary operator (isEmpty) with null value passes', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'name', operator: 'isEmpty', value: null }],
    };
    const result = validate(filter, schema);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('invalid number value (string instead of number) → invalidValue', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'age', operator: 'equals', value: '25' }],
    };
    const result = validate(filter, schema);
    expect(result.valid).toBe(false);
    expect(result.errors.r1).toHaveLength(1);
    expect(result.errors.r1[0].type).toBe('invalidValue');
    expect(result.errors.r1[0].message).toContain('number');
  });

  it('invalid boolean value (string instead of boolean) → invalidValue', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'active', operator: 'equals', value: 'true' }],
    };
    const result = validate(filter, schema);
    expect(result.valid).toBe(false);
    expect(result.errors.r1).toHaveLength(1);
    expect(result.errors.r1[0].type).toBe('invalidValue');
    expect(result.errors.r1[0].message).toContain('boolean');
  });

  it('invalid text value (number instead of string) → invalidValue', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'name', operator: 'equals', value: 123 }],
    };
    const result = validate(filter, schema);
    expect(result.valid).toBe(false);
    expect(result.errors.r1).toHaveLength(1);
    expect(result.errors.r1[0].type).toBe('invalidValue');
    expect(result.errors.r1[0].message).toContain('string');
  });

  it('between operator with non-array value → invalidValue', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'age', operator: 'between', value: 18 }],
    };
    const result = validate(filter, schema);
    expect(result.valid).toBe(false);
    expect(result.errors.r1).toHaveLength(1);
    expect(result.errors.r1[0].type).toBe('invalidValue');
    expect(result.errors.r1[0].message).toContain('array of 2');
  });

  it('between operator with array of wrong length → invalidValue', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'age', operator: 'between', value: [18] }],
    };
    const result = validate(filter, schema);
    expect(result.valid).toBe(false);
    expect(result.errors.r1).toHaveLength(1);
    expect(result.errors.r1[0].type).toBe('invalidValue');
  });

  it('between on number field with non-number elements → invalidValue', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'age', operator: 'between', value: ['18', '65'] }],
    };
    const result = validate(filter, schema);
    expect(result.valid).toBe(false);
    expect(result.errors.r1).toHaveLength(1);
    expect(result.errors.r1[0].type).toBe('invalidValue');
    expect(result.errors.r1[0].message).toContain('numbers');
  });

  it('between on date field with non-string elements → invalidValue', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'birthday', operator: 'between', value: [1, 2] }],
    };
    const result = validate(filter, schema);
    expect(result.valid).toBe(false);
    expect(result.errors.r1).toHaveLength(1);
    expect(result.errors.r1[0].type).toBe('invalidValue');
    expect(result.errors.r1[0].message).toContain('strings');
  });

  it('multiple errors across multiple rules', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [
        { id: 'r1', field: 'badField', operator: 'equals', value: 'x' },
        { id: 'r2', field: 'age', operator: 'equals', value: 'not-a-number' },
      ],
    };
    const result = validate(filter, schema);
    expect(result.valid).toBe(false);
    expect(result.errors.r1).toHaveLength(1);
    expect(result.errors.r1[0].type).toBe('invalidField');
    expect(result.errors.r2).toHaveLength(1);
    expect(result.errors.r2[0].type).toBe('invalidValue');
  });

  it('nested group validation (errors in nested rules)', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [
        {
          id: 'g1',
          combinator: 'and',
          children: [{ id: 'r1', field: 'invalidField', operator: 'equals', value: 'x' }],
        },
      ],
    };
    const result = validate(filter, schema);
    expect(result.valid).toBe(false);
    expect(result.errors.r1).toHaveLength(1);
    expect(result.errors.r1[0].type).toBe('invalidField');
  });

  it('valid multiSelect with string value passes', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'tags', operator: 'contains', value: 'tag1' }],
    };
    const result = validate(filter, schema);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('valid multiSelect with array value passes', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'tags', operator: 'contains', value: ['tag1', 'tag2'] }],
    };
    const result = validate(filter, schema);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('invalid multiSelect value (number) → invalidValue', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'tags', operator: 'contains', value: 42 }],
    };
    const result = validate(filter, schema);
    expect(result.valid).toBe(false);
    expect(result.errors.r1[0].type).toBe('invalidValue');
    expect(result.errors.r1[0].message).toContain('multiSelect');
  });

  it('invalid date value (number instead of string) → invalidValue', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'birthday', operator: 'equals', value: 20200101 }],
    };
    const result = validate(filter, schema);
    expect(result.valid).toBe(false);
    expect(result.errors.r1[0].type).toBe('invalidValue');
  });

  it('invalid group combinator is reported on the group id', () => {
    const filter = {
      id: 'root',
      combinator: 'xor',
      children: [{ id: 'r1', field: 'name', operator: 'equals', value: 'Ada' }],
    } as unknown as FilterAny;

    const result = validate(filter, schema);

    expect(result.valid).toBe(false);
    expect(result.errors.root[0].type).toBe('invalidCombinator');
  });

  it('invalid standard group condition shape is reported on the group id', () => {
    const filter = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'bad-condition' }],
    } as unknown as FilterAny;

    const result = validate(filter, schema);

    expect(result.valid).toBe(false);
    expect(result.errors.root[0].type).toBe('invalidGroup');
  });

  it('invalid IC combinator sequence is reported on the IC group id', () => {
    const filter: FilterAny = {
      id: 'root',
      children: [
        { id: 'r1', field: 'name', operator: 'equals', value: 'Ada' },
        'and',
        'or',
        { id: 'r2', field: 'age', operator: 'gt', value: 18 },
      ],
    };

    const result = validate(filter, schema);

    expect(result.valid).toBe(false);
    expect(result.errors.root[0].type).toBe('invalidCombinator');
  });

  it('invalid IC condition shape is reported on the IC group id', () => {
    const filter = {
      id: 'root',
      children: [{ id: 'bad-condition' }],
    } as unknown as FilterAny;

    const result = validate(filter, schema);

    expect(result.valid).toBe(false);
    expect(result.errors.root[0].type).toBe('invalidGroup');
  });

  it('select value must be one of schema values when values are provided', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'status', operator: 'equals', value: 'archived' }],
    };

    const result = validate(filter, schema);

    expect(result.valid).toBe(false);
    expect(result.errors.r1[0].type).toBe('invalidValue');
    expect(result.errors.r1[0].message).toContain('allowed option');
  });

  it('multiSelect array values must all be strings and allowed options when values are provided', () => {
    const taggedSchema: FieldSchema[] = [
      ...schema.filter((field) => field.name !== 'tags'),
      {
        name: 'tags',
        label: 'Tags',
        type: 'multiSelect',
        values: [{ value: 'vip', label: 'VIP' }],
      },
    ];
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'tags', operator: 'contains', value: ['vip', 'trial'] }],
    };

    const result = validate(filter, taggedSchema);

    expect(result.valid).toBe(false);
    expect(result.errors.r1[0].type).toBe('invalidValue');
  });

  it('invalid select value (number instead of string) → invalidValue', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'status', operator: 'equals', value: 123 }],
    };
    const result = validate(filter, schema);
    expect(result.valid).toBe(false);
    expect(result.errors.r1[0].type).toBe('invalidValue');
  });

  it('valid between on number field passes', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'age', operator: 'between', value: [18, 65] }],
    };
    const result = validate(filter, schema);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('valid between on date field passes', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [
        { id: 'r1', field: 'birthday', operator: 'between', value: ['2020-01-01', '2024-12-31'] },
      ],
    };
    const result = validate(filter, schema);
    expect(result.valid).toBe(true);
  });

  it('validates IC mode filter', () => {
    const filter: FilterAny = {
      id: 'root',
      children: [
        { id: 'r1', field: 'unknownField', operator: 'equals', value: 'x' },
        'and',
        { id: 'r2', field: 'age', operator: 'equals', value: 'not-a-number' },
      ],
    };
    const result = validate(filter, schema);
    expect(result.valid).toBe(false);
    expect(result.errors.r1[0].type).toBe('invalidField');
    expect(result.errors.r2[0].type).toBe('invalidValue');
  });

  it('valid boolean value passes', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'active', operator: 'equals', value: true }],
    };
    const result = validate(filter, schema);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('validates nested IC groups', () => {
    const filter: FilterAny = {
      id: 'root',
      children: [
        {
          id: 'g1',
          children: [
            { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
            'or',
            { id: 'r2', field: 'badField', operator: 'equals', value: 'x' },
          ],
        },
      ],
    };
    const result = validate(filter, schema);
    expect(result.valid).toBe(false);
    expect(result.errors.r2[0].type).toBe('invalidField');
    expect(result.errors.r1).toBeUndefined();
  });
});
