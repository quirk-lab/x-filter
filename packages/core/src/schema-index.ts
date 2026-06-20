import { getOperators } from './operators';
import type { FieldSchema, OperatorDef } from './types';

/**
 * Pre-computed lookup tables built once from a FieldSchema array.
 * Shared by validate, completion, and any hot path that needs
 * O(1) field/operator/value resolution.
 */
export interface SchemaIndex {
  fieldByName: Map<string, FieldSchema>;
  opByName: Map<string, Map<string, OperatorDef>>;
  allowedValues: Map<string, Set<string>>;
}

export function buildSchemaIndex(schema: FieldSchema[]): SchemaIndex {
  const fieldByName = new Map<string, FieldSchema>();
  const opByName = new Map<string, Map<string, OperatorDef>>();
  const allowedValues = new Map<string, Set<string>>();

  for (const field of schema) {
    fieldByName.set(field.name, field);

    const operators = getOperators(field.type, field.operators);
    const opMap = new Map<string, OperatorDef>();
    for (const op of operators) {
      opMap.set(op.name, op);
    }
    opByName.set(field.name, opMap);

    if (
      field.values &&
      field.values.length > 0 &&
      (field.type === 'select' || field.type === 'multiSelect')
    ) {
      allowedValues.set(field.name, new Set(field.values.map((o) => o.value)));
    }
  }

  return { fieldByName, opByName, allowedValues };
}
