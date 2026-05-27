import type { FieldSchema, OperatorDef } from '../types';
import { tokenize } from './tokenize';
import type { CompletionContext, CompletionItem } from './types';

function fieldCompletions(schema: FieldSchema[], prefix: string): CompletionItem[] {
  const lower = prefix.toLowerCase();
  return schema
    .filter(
      (f) => f.name.toLowerCase().startsWith(lower) || f.label.toLowerCase().startsWith(lower)
    )
    .map((f) => ({ kind: 'field' as const, label: f.label, value: f.name, detail: f.type }));
}

function operatorCompletions(operators: OperatorDef[], prefix: string): CompletionItem[] {
  const lower = prefix.toLowerCase();
  return operators
    .filter((op) => op.name.toLowerCase().startsWith(lower))
    .map((op) => ({
      kind: 'operator' as const,
      label: op.label,
      value: op.name,
      detail: op.arity,
    }));
}

function valueCompletions(field: FieldSchema, prefix: string): CompletionItem[] {
  if (!field.values) return [];
  const lower = prefix.toLowerCase();
  return field.values
    .filter(
      (v) => v.value.toLowerCase().startsWith(lower) || v.label.toLowerCase().startsWith(lower)
    )
    .map((v) => ({ kind: 'value' as const, label: v.label, value: v.value }));
}

export function getDslCompletions(context: CompletionContext): CompletionItem[] {
  const { input, cursor, schema } = context;
  const textToCursor = input.slice(0, cursor);

  const tokens = tokenize(textToCursor);
  const nonEof = tokens.filter((t) => t.type !== 'EOF');

  if (nonEof.length === 0) {
    return fieldCompletions(schema, '');
  }

  const segment = textToCursor.match(/[^\s()]*$/)?.[0] ?? '';
  const colonParts = segment.split(':');

  if (colonParts.length === 1) {
    return fieldCompletions(schema, colonParts[0]);
  }

  if (colonParts.length === 2) {
    const fieldName = colonParts[0];
    const prefix = colonParts[1];
    const field = schema.find((f) => f.name === fieldName);
    if (!field?.operators) return [];
    return operatorCompletions(field.operators, prefix);
  }

  if (colonParts.length >= 3) {
    const fieldName = colonParts[0];
    const prefix = colonParts.slice(2).join(':');
    const field = schema.find((f) => f.name === fieldName);
    if (!field) return [];
    return valueCompletions(field, prefix);
  }

  return [];
}
