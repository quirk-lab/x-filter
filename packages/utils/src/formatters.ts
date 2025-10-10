import { QueryDefinition, QueryRule } from '@x-filter/core';

export type FormatterFn = (rule: QueryRule, definition: QueryDefinition) => string;

export interface FormatterProfile {
  id: string;
  label: string;
  appliesTo: (rule: QueryRule) => boolean;
  format: FormatterFn;
}

const registry = new Map<string, FormatterProfile>();

export const registerFormatter = (profile: FormatterProfile) => {
  if (registry.has(profile.id)) {
    throw new Error(`Formatter with id ${profile.id} already registered`);
  }

  registry.set(profile.id, profile);
};

export const listFormatters = () => Array.from(registry.values());

export const resolveFormatter = (rule: QueryRule): FormatterProfile | undefined =>
  listFormatters().find((candidate) => candidate.appliesTo(rule));

export const formatRule = (rule: QueryRule, definition: QueryDefinition): string => {
  const formatter = resolveFormatter(rule);
  if (!formatter) {
    return `${rule.field} ${rule.operator} ${String(rule.value)}`;
  }

  return formatter.format(rule, definition);
};

export const clearFormatters = () => registry.clear();
