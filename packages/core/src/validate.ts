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
  if (group.combinator !== 'and' && group.combinator !== 'or') {
    addError(errors, group.id, {
      type: 'invalidCombinator',
      message: `Combinator "${String(group.combinator)}" is not valid`,
    });
  }

  if (!Array.isArray(group.conditions)) {
    addError(errors, group.id, {
      type: 'invalidGroup',
      message: 'Group conditions must be an array',
    });
    return;
  }

  for (const c of group.conditions) {
    if (isFilterGroup(c)) {
      validateGroup(c as FilterGroup, schema, errors);
    } else if (isFilterRule(c)) {
      validateRule(c as FilterRule, schema, errors);
    } else {
      addError(errors, group.id, {
        type: 'invalidGroup',
        message: 'Group condition must be a rule or group',
      });
    }
  }
}

function validateGroupIC(
  group: FilterGroupIC,
  schema: FieldSchema[],
  errors: Record<string, ValidationError[]>
): void {
  if (!Array.isArray(group.conditions)) {
    addError(errors, group.id, {
      type: 'invalidGroup',
      message: 'IC group conditions must be an array',
    });
    return;
  }

  if (group.conditions.length > 0 && group.conditions.length % 2 === 0) {
    addError(errors, group.id, {
      type: 'invalidCombinator',
      message: 'IC group conditions must end with a rule or group',
    });
  }

  for (let index = 0; index < group.conditions.length; index++) {
    const c = group.conditions[index];
    const expectsCombinator = index % 2 === 1;

    if (typeof c === 'string') {
      if (!expectsCombinator || (c !== 'and' && c !== 'or')) {
        addError(errors, group.id, {
          type: 'invalidCombinator',
          message: `Invalid IC combinator "${c}" at index ${index}`,
        });
      }
      continue;
    }

    if (expectsCombinator) {
      addError(errors, group.id, {
        type: 'invalidCombinator',
        message: `Expected IC combinator at index ${index}`,
      });
    }

    if (isFilterGroupIC(c)) {
      validateGroupIC(c, schema, errors);
    } else if (isFilterRule(c)) {
      validateRule(c as FilterRule, schema, errors);
    } else {
      addError(errors, group.id, {
        type: 'invalidGroup',
        message: 'IC group condition must be a rule or group',
      });
    }
  }
}

function addError(
  errors: Record<string, ValidationError[]>,
  id: string,
  error: ValidationError
): void {
  errors[id] = [...(errors[id] ?? []), error];
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
      const optionError = validateOptions(rule.value, field);
      if (optionError) ruleErrors.push(optionError);
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
      if (
        typeof value[0] !== 'number' ||
        typeof value[1] !== 'number' ||
        !Number.isFinite(value[0]) ||
        !Number.isFinite(value[1])
      ) {
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
      if (typeof value !== 'number' || !Number.isFinite(value)) {
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
      if (Array.isArray(value) && value.some((item) => typeof item !== 'string')) {
        return {
          type: 'invalidValue',
          message: 'Expected all multiSelect array values to be strings',
        };
      }
      break;
  }

  return null;
}

function validateOptions(value: unknown, field: FieldSchema): ValidationError | null {
  if (!field.values || field.values.length === 0) return null;
  if (field.type !== 'select' && field.type !== 'multiSelect') return null;

  const allowedValues = new Set(field.values.map((option) => option.value));
  const values = Array.isArray(value) ? value : [value];

  for (const item of values) {
    if (typeof item !== 'string' || !allowedValues.has(item)) {
      return {
        type: 'invalidValue',
        message: `Value "${String(item)}" is not an allowed option for field "${field.name}"`,
      };
    }
  }

  return null;
}
