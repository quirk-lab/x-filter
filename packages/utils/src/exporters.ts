import { QueryDefinition } from '@x-filter/core';
import { formatRule } from './formatters';

export interface ExportResult {
  name: string;
  payload: string;
  mimeType: string;
}

export interface ExportOptions {
  delimiter?: string;
}

export const exportToDelimitedText = (
  definition: QueryDefinition,
  options: ExportOptions = {}
): ExportResult => {
  const delimiter = options.delimiter ?? ',';
  const rows = definition.rules.map((rule) => formatRule(rule, definition));

  return {
    name: `${definition.name}.txt`,
    payload: rows.join(`\n${delimiter} `),
    mimeType: 'text/plain'
  };
};

export const exportToJson = (definition: QueryDefinition): ExportResult => ({
  name: `${definition.name}.json`,
  payload: JSON.stringify(definition, null, 2),
  mimeType: 'application/json'
});
