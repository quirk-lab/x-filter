import {
  addRule,
  createQueryDefinition,
  createValidator,
  replaceRules,
  serializeQuery
} from '../query-builder';
import type { QueryDefinition } from '../query-types';

const fields = [
  { key: 'status', label: 'Status', type: 'string', options: ['open', 'closed'] },
  { key: 'priority', label: 'Priority', type: 'number' }
];

describe('query builder', () => {
  it('creates a query definition with empty rules', () => {
    const definition = createQueryDefinition('issues', fields);
    expect(definition.rules).toHaveLength(0);
    expect(definition.metadata).toHaveProperty('createdAt');
  });

  it('adds rules while validating fields', () => {
    const definition = createQueryDefinition('issues', fields);
    const updated = addRule(definition, {
      field: 'status',
      operator: 'equals',
      value: 'open'
    });

    expect(updated.rules).toHaveLength(1);
    expect(updated.rules[0]).toMatchObject({ field: 'status', operator: 'equals' });
  });

  it('rejects unknown fields unless explicitly allowed', () => {
    const definition = createQueryDefinition('issues', fields);

    expect(() =>
      addRule(definition, { field: 'unknown', operator: 'equals', value: 'x' })
    ).toThrow('Unknown field');

    expect(
      () =>
        addRule(
          definition,
          { field: 'unknown', operator: 'equals', value: 'x' },
          { allowUnknownFields: true }
        )
    ).not.toThrow();
  });

  it('supports validators', () => {
    const definition = createQueryDefinition('issues', fields);
    const validator = createValidator((rule) => rule.value !== 'closed', 'closed not allowed');

    expect(() =>
      addRule(
        definition,
        { field: 'status', operator: 'equals', value: 'closed' },
        { validators: [validator] }
      )
    ).toThrow('closed not allowed');
  });

  it('replaces rule sets immutably', () => {
    const definition = createQueryDefinition('issues', fields);
    const replaced = replaceRules(definition, [
      { field: 'priority', operator: '>', value: 2 }
    ]);

    expect(replaced.rules).toHaveLength(1);
    expect(definition.rules).toHaveLength(0);
  });

  it('serialises into a deterministic payload', () => {
    const definition: QueryDefinition = {
      name: 'issues',
      fields,
      rules: [{ field: 'status', operator: 'equals', value: 'open' }]
    };

    expect(serializeQuery(definition)).toMatchSnapshot();
  });
});
