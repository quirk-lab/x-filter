import { isFilterGroupIC } from './ic';
import { getOperators } from './operators';
import type {
  FieldSchema,
  FieldType,
  FilterAny,
  FilterGroup,
  FilterGroupIC,
  FilterRule,
  OperatorDef,
  ValidationError,
  ValidationResult,
} from './types';
import { isFilterGroup, isFilterRule } from './types';

export function validate(filter: FilterAny, schema: FieldSchema[]): ValidationResult {
  const errors: Record<string, ValidationError[]> = {};

  if (isFilterGroupIC(filter)) {
    validateGroupIC(filter, schema, errors);
  } else {
    validateGroup(filter as FilterGroup, schema, errors);
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

function validateGroup(
  group: FilterGroup,
  schema: FieldSchema[],
  errors: Record<string, ValidationError[]>
): void {
  for (const c of group.conditions) {
    if (isFilterGroup(c)) {
      validateGroup(c as FilterGroup, schema, errors);
    } else {
      validateRule(c as FilterRule, schema, errors);
    }
  }
}

function validateGroupIC(
  group: FilterGroupIC,
  schema: FieldSchema[],
  errors: Record<string, ValidationError[]>
): void {
  for (const c of group.conditions) {
    if (typeof c === 'string') continue;
    if (isFilterGroupIC(c)) {
      validateGroupIC(c, schema, errors);
    } else if (isFilterRule(c)) {
      validateRule(c as FilterRule, schema, errors);
    }
  }
}

function validateRule(
  rule: FilterRule,
  schema: FieldSchema[],
  errors: Record<string, ValidationError[]>
): void {
  const ruleErrors: ValidationError[] = [];

  const field = schema.find((f) => f.name === rule.field);
  if (!field) {
    ruleErrors.push({
      type: 'invalidField',
      message: `Field "${rule.field}" is not defined in schema`,
    });
    if (ruleErrors.length > 0) errors[rule.id] = ruleErrors;
    return;
  }

  const operators = getOperators(field.type, field.operators);
  const operatorDef = operators.find((op) => op.name === rule.operator);
  if (!operatorDef) {
    ruleErrors.push({
      type: 'invalidOperator',
      message: `Operator "${rule.operator}" is not valid for field type "${field.type}"`,
    });
  }

  if (operatorDef && operatorDef.arity !== 'unary') {
    if (rule.value === null || rule.value === undefined || rule.value === '') {
      ruleErrors.push({
        type: 'missingValue',
        message: `Value is required for operator "${rule.operator}"`,
      });
    } else {
      const valueError = validateValue(rule.value, field.type, operatorDef);
      if (valueError) ruleErrors.push(valueError);
    }
  }

  if (ruleErrors.length > 0) {
    errors[rule.id] = ruleErrors;
  }
}

function validateValue(
  value: unknown,
  fieldType: FieldType,
  operator: OperatorDef
): ValidationError | null {
  if (operator.arity === 'ternary') {
    if (!Array.isArray(value) || value.length !== 2) {
      return {
        type: 'invalidValue',
        message: `Ternary operator "${operator.name}" requires an array of 2 values`,
      };
    }

    if (fieldType === 'number') {
      if (typeof value[0] !== 'number' || typeof value[1] !== 'number') {
        return {
          type: 'invalidValue',
          message: 'Expected array of 2 numbers for "between" on number field',
        };
      }
    }

    if (fieldType === 'date') {
      if (typeof value[0] !== 'string' || typeof value[1] !== 'string') {
        return {
          type: 'invalidValue',
          message: 'Expected array of 2 strings for "between" on date field',
        };
      }
    }

    return null;
  }

  switch (fieldType) {
    case 'number':
      if (typeof value !== 'number') {
        return { type: 'invalidValue', message: 'Expected a number value' };
      }
      break;
    case 'boolean':
      if (typeof value !== 'boolean') {
        return { type: 'invalidValue', message: 'Expected a boolean value' };
      }
      break;
    case 'text':
    case 'date':
    case 'select':
      if (typeof value !== 'string') {
        return { type: 'invalidValue', message: `Expected a string value for ${fieldType} field` };
      }
      break;
    case 'multiSelect':
      if (typeof value !== 'string' && !Array.isArray(value)) {
        return {
          type: 'invalidValue',
          message: 'Expected a string or array value for multiSelect field',
        };
      }
      break;
  }

  return null;
}
