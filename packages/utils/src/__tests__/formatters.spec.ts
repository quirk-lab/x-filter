import { createQueryDefinition } from '@x-filter/core';
import {
  clearFormatters,
  formatRule,
  registerFormatter
} from '../formatters';
import { exportToDelimitedText, exportToJson } from '../exporters';

const definition = createQueryDefinition('demo', [
  { key: 'status', label: 'Status', type: 'string' },
  { key: 'priority', label: 'Priority', type: 'number' }
]);

describe('formatter utilities', () => {
  beforeEach(() => {
    clearFormatters();
  });

  it('formats rules using registered formatter', () => {
    registerFormatter({
      id: 'status',
      label: 'Status formatter',
      appliesTo: (rule) => rule.field === 'status',
      format: (rule) => `STATUS:${rule.value}`
    });

    const formatted = formatRule({ field: 'status', operator: 'equals', value: 'open' }, definition);
    expect(formatted).toBe('STATUS:open');
  });

  it('falls back to default formatting for unknown formatters', () => {
    const formatted = formatRule({ field: 'priority', operator: '>', value: 3 }, definition);
    expect(formatted).toContain('priority > 3');
  });

  it('prevents duplicate formatter registration', () => {
    registerFormatter({
      id: 'status',
      label: 'Status formatter',
      appliesTo: () => true,
      format: () => ''
    });

    expect(() =>
      registerFormatter({
        id: 'status',
        label: 'Duplicate',
        appliesTo: () => true,
        format: () => ''
      })
    ).toThrow('already registered');
  });

  it('exports query definitions to multiple formats', () => {
    const withRule = {
      ...definition,
      rules: [{ field: 'status', operator: 'equals', value: 'open' }]
    };

    const textExport = exportToDelimitedText(withRule);
    expect(textExport.payload).toContain('status equals open');

    const jsonExport = exportToJson(withRule);
    expect(jsonExport.mimeType).toBe('application/json');
  });
});
