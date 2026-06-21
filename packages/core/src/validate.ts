import { isFilterGroupIC } from './ic';
import type { SchemaIndex } from './schema-index';
import { buildSchemaIndex } from './schema-index';
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

/**
 * Previous filter + errors snapshot used to make `validate` identity-aware.
 *
 * When a `FilterRule` / `FilterGroup` node is `===` to its counterpart in
 * `prevState.filter`, `validate` carries forward the previous
 * `errors[nodeId]` array reference instead of recomputing it. This mirrors
 * the structural-sharing pattern already used by the core mutators
 * (`packages/core/src/mutations.ts`) and keeps per-rule error arrays
 * referentially stable across a single-node mutation, which is what
 * `useFilterViewModel`'s identity cache and `React.memo` on `<Rule>` rely on.
 *
 * Callers MUST only pass `prevState` when the schema is `===` to the schema
 * used to produce `prevState.errors`; otherwise a previously-valid rule could
 * be wrongly treated as still valid. The `useFilterValidation` hook handles
 * this invariant automatically.
 */
export interface ValidatePrevState {
  filter: FilterAny;
  errors: Record<string, ValidationError[]>;
}

// ── Identity-aware error carry-forward ─────────────────────────────────

type NodeErrorsCache = WeakMap<
  FilterRule | FilterGroup | FilterGroupIC,
  ValidationError[] | undefined
>;

function buildPrevNodeErrors(prevState: ValidatePrevState): NodeErrorsCache {
  const map: NodeErrorsCache = new WeakMap();
  const walk = (node: FilterGroup | FilterGroupIC): void => {
    map.set(node, prevState.errors[node.id]);
    for (const c of node.children) {
      if (isFilterRule(c)) {
        map.set(c as FilterRule, prevState.errors[(c as FilterRule).id]);
      } else if (typeof c === 'object' && c !== null && 'children' in c) {
        walk(c as FilterGroup | FilterGroupIC);
      }
    }
  };
  walk(prevState.filter as FilterGroup | FilterGroupIC);
  return map;
}

function carryForwardNodeErrors(
  id: string,
  prevNodeErrors: NodeErrorsCache | undefined,
  node: FilterRule | FilterGroup | FilterGroupIC,
  errors: Record<string, ValidationError[]>
): boolean {
  if (!prevNodeErrors || !prevNodeErrors.has(node)) return false;
  const prev = prevNodeErrors.get(node);
  if (prev && prev.length > 0) errors[id] = prev;
  return true;
}

// ── Group validation ───────────────────────────────────────────────────

function validateGroup(
  group: FilterGroup,
  index: SchemaIndex,
  errors: Record<string, ValidationError[]>,
  prevNodeErrors?: NodeErrorsCache
): void {
  if (carryForwardNodeErrors(group.id, prevNodeErrors, group, errors)) {
    for (const c of group.children) {
      if (isFilterGroup(c)) {
        validateGroup(c as FilterGroup, index, errors, prevNodeErrors);
      } else if (isFilterRule(c)) {
        validateRule(c as FilterRule, index, errors, prevNodeErrors);
      }
    }
    return;
  }

  if (group.combinator !== 'and' && group.combinator !== 'or') {
    pushError(errors, group.id, {
      type: 'invalidCombinator',
      message: `Combinator "${String(group.combinator)}" is not valid`,
    });
  }

  if (!Array.isArray(group.children)) {
    pushError(errors, group.id, {
      type: 'invalidGroup',
      message: 'Group children must be an array',
    });
    return;
  }

  for (const c of group.children) {
    if (isFilterGroup(c)) {
      validateGroup(c as FilterGroup, index, errors, prevNodeErrors);
    } else if (isFilterRule(c)) {
      validateRule(c as FilterRule, index, errors, prevNodeErrors);
    } else {
      pushError(errors, group.id, {
        type: 'invalidGroup',
        message: 'Group child must be a Rule or Group',
      });
    }
  }
}

function validateGroupIC(
  group: FilterGroupIC,
  index: SchemaIndex,
  errors: Record<string, ValidationError[]>,
  prevNodeErrors?: NodeErrorsCache
): void {
  if (carryForwardNodeErrors(group.id, prevNodeErrors, group, errors)) {
    for (const c of group.children) {
      if (typeof c === 'string') continue;
      if (isFilterGroupIC(c)) {
        validateGroupIC(c, index, errors, prevNodeErrors);
      } else if (isFilterRule(c)) {
        validateRule(c as FilterRule, index, errors, prevNodeErrors);
      }
    }
    return;
  }

  if (!Array.isArray(group.children)) {
    pushError(errors, group.id, {
      type: 'invalidGroup',
      message: 'IC group children must be an array',
    });
    return;
  }

  if (group.children.length > 0 && group.children.length % 2 === 0) {
    pushError(errors, group.id, {
      type: 'invalidCombinator',
      message: 'IC group children must end with a rule or group',
    });
  }

  for (let i = 0; i < group.children.length; i++) {
    const c = group.children[i];
    const expectsCombinator = i % 2 === 1;

    if (typeof c === 'string') {
      if (!expectsCombinator || (c !== 'and' && c !== 'or')) {
        pushError(errors, group.id, {
          type: 'invalidCombinator',
          message: `Invalid IC combinator "${c}" at index ${i}`,
        });
      }
      continue;
    }

    if (expectsCombinator) {
      pushError(errors, group.id, {
        type: 'invalidCombinator',
        message: `Expected IC combinator at index ${i}`,
      });
    }

    if (isFilterGroupIC(c)) {
      validateGroupIC(c, index, errors, prevNodeErrors);
    } else if (isFilterRule(c)) {
      validateRule(c as FilterRule, index, errors, prevNodeErrors);
    } else {
      pushError(errors, group.id, {
        type: 'invalidGroup',
        message: 'IC group child must be a Rule or Group',
      });
    }
  }
}

// ── Error helpers ──────────────────────────────────────────────────────

function pushError(
  errors: Record<string, ValidationError[]>,
  id: string,
  error: ValidationError
): void {
  if (errors[id]) {
    errors[id].push(error);
  } else {
    errors[id] = [error];
  }
}

// ── Rule validation ────────────────────────────────────────────────────

function validateRule(
  rule: FilterRule,
  index: SchemaIndex,
  errors: Record<string, ValidationError[]>,
  prevNodeErrors?: NodeErrorsCache
): void {
  if (carryForwardNodeErrors(rule.id, prevNodeErrors, rule, errors)) return;

  const ruleErrors: ValidationError[] = [];

  const field = index.fieldByName.get(rule.field);
  if (!field) {
    ruleErrors.push({
      type: 'invalidField',
      message: `Field "${rule.field}" is not defined in schema`,
    });
    errors[rule.id] = ruleErrors;
    return;
  }

  const operatorDef = index.opByName.get(field.name)?.get(rule.operator);
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
      const optionError = validateOptions(rule.value, field, index);
      if (optionError) ruleErrors.push(optionError);
    }
  }

  if (ruleErrors.length > 0) {
    errors[rule.id] = ruleErrors;
  }
}

// ── Value validation ───────────────────────────────────────────────────

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

    if (fieldType === 'date' || fieldType === 'time' || fieldType === 'dateTime') {
      if (typeof value[0] !== 'string' || typeof value[1] !== 'string') {
        return {
          type: 'invalidValue',
          message: `Expected array of 2 strings for "between" on ${fieldType} field`,
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
    case 'time':
    case 'dateTime':
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

function validateOptions(
  value: unknown,
  field: FieldSchema,
  index: SchemaIndex
): ValidationError | null {
  const allowed = index.allowedValues.get(field.name);
  if (!allowed) return null;

  const values = Array.isArray(value) ? value : [value];

  for (const item of values) {
    if (typeof item !== 'string' || !allowed.has(item)) {
      return {
        type: 'invalidValue',
        message: `Value "${String(item)}" is not an allowed option for field "${field.name}"`,
      };
    }
  }

  return null;
}

// ── Public API ─────────────────────────────────────────────────────────

export function validate(
  filter: FilterAny,
  schema: FieldSchema[],
  prevState?: ValidatePrevState
): ValidationResult {
  const errors: Record<string, ValidationError[]> = {};
  const prevNodeErrors = prevState ? buildPrevNodeErrors(prevState) : undefined;
  const index = buildSchemaIndex(schema);

  if (isFilterGroupIC(filter)) {
    validateGroupIC(filter, index, errors, prevNodeErrors);
  } else {
    validateGroup(filter as FilterGroup, index, errors, prevNodeErrors);
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
