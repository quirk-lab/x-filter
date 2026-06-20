import { type FieldSchema, getOperators, type OperatorDef } from '@x-filter/core';

/**
 * @internal
 * Finds a field schema by name from a schema array.
 */
export function findSchemaField(
  schema: FieldSchema[],
  fieldName?: string
): FieldSchema | undefined {
  return schema.find((field) => field.name === fieldName);
}

/**
 * @internal
 * Returns the available operators for a field, or empty array if field is undefined.
 */
export function getFieldOperators(field?: FieldSchema): OperatorDef[] {
  return field ? getOperators(field.type, field.operators) : [];
}

/**
 * @internal
 * Finds an operator definition by name within a field's operators.
 */
export function findOperator(
  field: FieldSchema | undefined,
  operatorName: string
): OperatorDef | undefined {
  return getFieldOperators(field).find((operator) => operator.name === operatorName);
}
