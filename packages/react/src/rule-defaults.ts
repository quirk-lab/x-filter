import { type FieldSchema, type FilterRule, getOperators } from '@x-filter/core';

/**
 * @internal
 * Computes the default rule updates when a field changes.
 * Used by FilterBuilder orchestrator in UI packages.
 */
export function getDefaultRuleUpdatesForField(
  schema: FieldSchema[],
  fieldName: string
): Partial<Omit<FilterRule, 'id'>> {
  const field = schema.find((candidate) => candidate.name === fieldName);
  const operators = field ? getOperators(field.type, field.operators) : [];
  const operator = field?.defaultOperator ?? operators[0]?.name ?? '';
  const operatorDef = operators.find((candidate) => candidate.name === operator);
  const value =
    operatorDef?.arity === 'unary'
      ? undefined
      : field && field.defaultValue !== undefined
        ? field.defaultValue
        : null;

  return { field: fieldName, operator, value };
}
