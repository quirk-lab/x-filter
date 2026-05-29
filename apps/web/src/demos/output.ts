import { type Filter, toJSON, type ValidationResult, validate } from '@x-filter/core';
import { formatDSL } from '@x-filter/core/dsl';
import { toSQL } from '@x-filter/core/sql';
import { demoSchema, sqlFieldMap } from './filter-fixtures';

export type DemoOutputKind = 'json' | 'dsl' | 'sql' | 'validation';

export type DemoOutputs = {
  json: string;
  dsl: string;
  sql: string;
  validation: ValidationResult;
  validationText: string;
};

function stringify(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function buildSQL(filter: Filter): string {
  try {
    return stringify(toSQL(filter, { fieldMap: sqlFieldMap }));
  } catch (error) {
    return stringify({
      error: error instanceof Error ? error.message : 'Unable to build SQL',
    });
  }
}

export function formatValidation(validation: ValidationResult): string {
  if (validation.valid) {
    return 'Valid filter. No validation errors.';
  }

  return stringify(validation.errors);
}

export function buildDemoOutputs(filter: Filter, schema = demoSchema): DemoOutputs {
  const validation = validate(filter, schema);

  return {
    json: stringify(toJSON(filter)),
    dsl: formatDSL(filter),
    sql: buildSQL(filter),
    validation,
    validationText: formatValidation(validation),
  };
}

export function getOutputText(outputs: DemoOutputs, kind: DemoOutputKind): string {
  if (kind === 'validation') {
    return outputs.validationText;
  }

  return outputs[kind];
}
