import { updateRule } from '../mutations';
import type { FieldSchema, Filter, FilterAny } from '../types';
import type { ValidatePrevState } from '../validate';
import { validate } from '../validate';

const schema: FieldSchema[] = [
  { name: 'name', label: 'Name', type: 'text' },
  { name: 'age', label: 'Age', type: 'number' },
  { name: 'birthday', label: 'Birthday', type: 'date' },
  { name: 'startTime', label: 'Start time', type: 'time' },
  { name: 'createdAt', label: 'Created at', type: 'dateTime' },
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

  it('valid time / dateTime string values pass', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [
        { id: 'r1', field: 'startTime', operator: 'after', value: '09:00' },
        { id: 'r2', field: 'createdAt', operator: 'before', value: '2026-01-01T14:30' },
      ],
    };
    const result = validate(filter, schema);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('time / dateTime field with non-string value → invalidValue', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [
        { id: 'r1', field: 'startTime', operator: 'equals', value: 900 },
        { id: 'r2', field: 'createdAt', operator: 'equals', value: 900 },
      ],
    };
    const result = validate(filter, schema);
    expect(result.valid).toBe(false);
    expect(result.errors.r1[0].type).toBe('invalidValue');
    expect(result.errors.r1[0].message).toContain('time');
    expect(result.errors.r2[0].message).toContain('dateTime');
  });

  it('valid between on time / dateTime fields passes', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [
        { id: 'r1', field: 'startTime', operator: 'between', value: ['09:00', '17:00'] },
        {
          id: 'r2',
          field: 'createdAt',
          operator: 'between',
          value: ['2026-01-01T00:00', '2026-12-31T23:59'],
        },
      ],
    };
    const result = validate(filter, schema);
    expect(result.valid).toBe(true);
  });

  it('between on dateTime field with non-string elements → invalidValue', () => {
    const filter: FilterAny = {
      id: 'root',
      combinator: 'and',
      children: [{ id: 'r1', field: 'createdAt', operator: 'between', value: [1, 2] }],
    };
    const result = validate(filter, schema);
    expect(result.valid).toBe(false);
    expect(result.errors.r1[0].type).toBe('invalidValue');
    expect(result.errors.r1[0].message).toContain('dateTime');
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

  describe('identity-aware prev state', () => {
    it('produces identical results with and without prevState (backward compatible)', () => {
      const filter: FilterAny = {
        id: 'root',
        combinator: 'and',
        children: [
          { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
          { id: 'r2', field: 'age', operator: 'gt', value: 18 },
        ],
      };
      const withoutPrev = validate(filter, schema);
      const withPrev = validate(filter, schema, { filter, errors: {} });
      expect(withPrev.valid).toBe(withoutPrev.valid);
      expect(withPrev.errors).toEqual(withoutPrev.errors);
    });

    it('carries forward the errors array reference for an unchanged rule', () => {
      const filter: FilterAny = {
        id: 'root',
        combinator: 'and',
        children: [
          { id: 'r1', field: 'name', operator: 'equals', value: 'John' },
          { id: 'r2', field: 'age', operator: 'gt', value: 18 },
        ],
      };
      const first = validate(filter, schema);

      // Mutate only r2; r1 is structurally shared (===) thanks to updateRule.
      const nextFilter = updateRule(filter as Filter, 'r2', { value: 21 });
      const r1Before = filter.children[0];
      const r1After = nextFilter.children[0];
      expect(r1After).toBe(r1Before); // structural sharing precondition

      const prevState: ValidatePrevState = { filter, errors: first.errors };
      const second = validate(nextFilter, schema, prevState);

      // r1 had no errors in `first`, so it stays absent (valid).
      expect(second.errors.r1).toBeUndefined();
      // r2 changed, so it is re-validated and remains valid.
      expect(second.errors.r2).toBeUndefined();
      expect(second.valid).toBe(true);
    });

    it('preserves the exact errors array reference for an unchanged invalid rule', () => {
      const filter: FilterAny = {
        id: 'root',
        combinator: 'and',
        children: [
          { id: 'r1', field: 'unknownField', operator: 'equals', value: 'x' },
          { id: 'r2', field: 'age', operator: 'gt', value: 18 },
        ],
      };
      const first = validate(filter, schema);
      expect(first.errors.r1).toHaveLength(1);

      const nextFilter = updateRule(filter as Filter, 'r2', { value: 21 });
      expect(nextFilter.children[0]).toBe(filter.children[0]); // r1 unchanged

      const prevState: ValidatePrevState = { filter, errors: first.errors };
      const second = validate(nextFilter, schema, prevState);

      // r1's error array is carried forward BY REFERENCE (===), not just equal.
      expect(second.errors.r1).toBe(first.errors.r1);
      expect(second.valid).toBe(false);
    });

    it('re-validates a rule whose reference changed even if id is the same', () => {
      const filter: FilterAny = {
        id: 'root',
        combinator: 'and',
        children: [{ id: 'r1', field: 'name', operator: 'equals', value: 'John' }],
      };
      const first = validate(filter, schema);

      // Build a fresh filter where r1 is a NEW object (not ===) with an invalid value.
      const nextFilter: FilterAny = {
        id: 'root',
        combinator: 'and',
        children: [{ id: 'r1', field: 'name', operator: 'equals', value: 123 }],
      };
      expect(nextFilter.children[0]).not.toBe(filter.children[0]);

      const prevState: ValidatePrevState = { filter, errors: first.errors };
      const second = validate(nextFilter, schema, prevState);

      // r1 is a new reference → re-validated → now invalid.
      expect(second.valid).toBe(false);
      expect(second.errors.r1[0].type).toBe('invalidValue');
    });

    it('re-validates when schema changes even if filter is === (caller must drop prevState)', () => {
      const filter: FilterAny = {
        id: 'root',
        combinator: 'and',
        children: [{ id: 'r1', field: 'name', operator: 'equals', value: 'John' }],
      };
      const first = validate(filter, schema);

      // Schema drops the `name` field. A correct caller does NOT pass prevState
      // when schema changed, so r1 is re-validated and flagged invalidField.
      const nextSchema = schema.filter((f) => f.name !== 'name');
      const second = validate(filter, nextSchema); // no prevState
      expect(second.valid).toBe(false);
      expect(second.errors.r1[0].type).toBe('invalidField');
      // Sanity: had the caller wrongly passed prevState, r1 would be wrongly valid.
      const wrong = validate(filter, nextSchema, { filter, errors: first.errors });
      expect(wrong.valid).toBe(true);
    });

    it('carries forward group-level errors for an unchanged nested group', () => {
      const filter = {
        id: 'root',
        combinator: 'and',
        children: [
          {
            id: 'g1',
            combinator: 'xor',
            children: [{ id: 'r1', field: 'name', operator: 'equals', value: 'John' }],
          },
          { id: 'r2', field: 'age', operator: 'gt', value: 18 },
        ],
      } as unknown as FilterAny;
      const first = validate(filter, schema);
      expect(first.errors.g1[0].type).toBe('invalidCombinator');

      // Mutate only r2; g1 subtree is ===.
      const nextFilter = updateRule(filter as Filter, 'r2', { value: 21 });
      const prevState: ValidatePrevState = { filter, errors: first.errors };
      const second = validate(nextFilter, schema, prevState);

      expect(second.errors.g1).toBe(first.errors.g1);
      expect(second.errors.r1).toBeUndefined();
      expect(second.valid).toBe(false);
    });

    it('carries forward errors for an unchanged IC group and its unchanged rules', () => {
      // IC filter with a nested IC group g1 containing an invalid rule r1,
      // plus a sibling rule r2. We rebuild the root keeping g1 === and
      // replacing r2 with a new (still-invalid) reference.
      const nestedGroup = {
        id: 'g1',
        children: [{ id: 'r1', field: 'unknownField', operator: 'equals', value: 'x' }],
      };
      const filter: FilterAny = {
        id: 'root',
        children: [
          nestedGroup,
          'and',
          { id: 'r2', field: 'age', operator: 'equals', value: 'bad' },
        ],
      };
      const first = validate(filter, schema);
      expect(first.errors.r1[0].type).toBe('invalidField');
      expect(first.errors.r2[0].type).toBe('invalidValue');

      // New root: g1 is === (same reference), r2 is a NEW object (still invalid).
      const nextFilter: FilterAny = {
        id: 'root',
        children: [
          nestedGroup,
          'and',
          { id: 'r2', field: 'age', operator: 'equals', value: 'also-bad' },
        ],
      };
      expect(nextFilter.children[0]).toBe(filter.children[0]); // g1 ===
      expect(nextFilter.children[2]).not.toBe(filter.children[2]); // r2 !==

      const prevState: ValidatePrevState = { filter, errors: first.errors };
      const second = validate(nextFilter, schema, prevState);

      // g1 and r1 (inside g1) are === → errors carried forward by reference.
      expect(second.errors.r1).toBe(first.errors.r1);
      // r2 is a new reference → re-validated → new errors array.
      expect(second.errors.r2).not.toBe(first.errors.r2);
      expect(second.errors.r2[0].type).toBe('invalidValue');
      expect(second.valid).toBe(false);
    });
  });
});
