import {
  QueryBuilderConfig,
  QueryDefinition,
  QueryField,
  QueryRule,
  QueryValidator
} from './query-types';

const ensureFieldExists = (
  definition: QueryDefinition,
  fieldKey: string,
  allowUnknown: boolean
): QueryField | undefined => {
  const field = definition.fields.find((candidate) => candidate.key === fieldKey);
  if (!field && !allowUnknown) {
    throw new Error(`Unknown field \"${fieldKey}\" for query \"${definition.name}\"`);
  }

  return field;
};

const runValidators = (
  rule: QueryRule,
  definition: QueryDefinition,
  validators: QueryValidator[] | undefined
) => {
  if (!validators?.length) {
    return;
  }

  validators.forEach((validator) => validator(rule, definition));
};

export const createQueryDefinition = (
  name: string,
  fields: QueryField[],
  config: QueryBuilderConfig = {}
): QueryDefinition => {
  if (!name.trim()) {
    throw new Error('Query definition name must be provided');
  }

  return {
    name,
    fields: fields.map((field) => ({ ...field })),
    rules: [],
    metadata: {
      createdAt: new Date().toISOString(),
      allowUnknownFields: Boolean(config.allowUnknownFields)
    }
  };
};

export const addRule = (
  definition: QueryDefinition,
  rule: QueryRule,
  config: QueryBuilderConfig = {}
): QueryDefinition => {
  ensureFieldExists(definition, rule.field, Boolean(config.allowUnknownFields));
  runValidators(rule, definition, config.validators);

  return {
    ...definition,
    rules: [...definition.rules, { ...rule }]
  };
};

export const replaceRules = (
  definition: QueryDefinition,
  rules: QueryRule[],
  config: QueryBuilderConfig = {}
): QueryDefinition => {
  rules.forEach((rule) => ensureFieldExists(definition, rule.field, Boolean(config.allowUnknownFields)));

  if (config.validators?.length) {
    rules.forEach((rule) => runValidators(rule, definition, config.validators));
  }

  return {
    ...definition,
    rules: rules.map((rule) => ({ ...rule }))
  };
};

export const serializeQuery = (definition: QueryDefinition): string =>
  JSON.stringify({
    name: definition.name,
    rules: definition.rules,
    metadata: definition.metadata ?? {}
  });

export const getField = (definition: QueryDefinition, fieldKey: string): QueryField | undefined =>
  definition.fields.find((field) => field.key === fieldKey);

export const createValidator = (
  predicate: (rule: QueryRule, definition: QueryDefinition) => boolean,
  errorMessage: string
): QueryValidator => (rule, definition) => {
  if (!predicate(rule, definition)) {
    throw new Error(errorMessage);
  }
};
