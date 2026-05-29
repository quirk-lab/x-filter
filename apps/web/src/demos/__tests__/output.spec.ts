import type { Filter } from '@x-filter/core';
import { getDemoSchema, invalidFilter, nestedFilter, starterFilter } from '../filter-fixtures';
import { buildDemoOutputs, formatValidation, getOutputText } from '../output';

describe('demo output formatting', () => {
  test('formats JSON, DSL, SQL, and validation for a valid filter', () => {
    const outputs = buildDemoOutputs(starterFilter);

    expect(outputs.validation.valid).toBe(true);
    expect(outputs.json).toContain('"accountTier"');
    expect(outputs.dsl).toContain('accountTier:equals:enterprise');
    expect(outputs.sql).toContain('accounts.tier = ?');
    expect(outputs.sql).toContain('accounts.region IN (?, ?)');
    expect(getOutputText(outputs, 'json')).toContain('"conditions"');
    expect(getOutputText(outputs, 'dsl')).toContain('contractValue:gt:50000');
    expect(getOutputText(outputs, 'sql')).toContain('contracts.arr > ?');
    expect(getOutputText(outputs, 'validation')).toBe('Valid filter. No validation errors.');
  });

  test('formats nested filters into DSL and SQL groups', () => {
    const outputs = buildDemoOutputs(nestedFilter);

    expect(outputs.validation.valid).toBe(true);
    expect(outputs.dsl).toContain('renewalDate:between');
    expect(outputs.sql).toContain('contracts.renewal_date BETWEEN ? AND ?');
    expect(outputs.sql).toContain('owners.active = ?');
  });

  test('keeps validation output readable for invalid filters', () => {
    const outputs = buildDemoOutputs(invalidFilter);

    expect(outputs.validation.valid).toBe(false);
    expect(formatValidation(outputs.validation)).toContain('missingValue');
    expect(formatValidation(outputs.validation)).toContain('invalidField');
  });

  test('localizes schema labels without changing field names', () => {
    const englishSchema = getDemoSchema('en');
    const chineseSchema = getDemoSchema('zh');

    expect(englishSchema[0]).toBe(getDemoSchema('en')[0]);
    expect(chineseSchema[0].name).toBe('accountTier');
    expect(chineseSchema[0].label).toBe('客户层级');
    expect(chineseSchema[0].values?.[2].label).toBe('企业版');
  });

  test('shows SQL build errors as structured output', () => {
    const unsupportedOperatorFilter: Filter = {
      id: 'root',
      combinator: 'and',
      conditions: [
        {
          id: 'custom',
          field: 'accountTier',
          operator: 'customOperator',
          value: 'enterprise',
        },
      ],
    };

    const outputs = buildDemoOutputs(unsupportedOperatorFilter);

    expect(outputs.sql).toContain('Unsupported SQL operator');
  });
});
