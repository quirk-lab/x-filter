export type PrimitiveValue = string | number | boolean | null;

export type FieldType = 'string' | 'number' | 'boolean' | 'date';

export interface QueryField {
  /** Unique identifier for the field */
  key: string;
  /** Human readable label, rendered in headless components */
  label: string;
  /** Field data type, used to drive formatter selection */
  type: FieldType;
  /** Optional list of allowed values for select-like fields */
  options?: PrimitiveValue[];
}

export interface QueryRule {
  field: string;
  operator: string;
  value: PrimitiveValue | PrimitiveValue[];
}

export interface QueryDefinition {
  name: string;
  fields: QueryField[];
  rules: QueryRule[];
  metadata?: Record<string, unknown>;
}

export type QueryValidator = (rule: QueryRule, definition: QueryDefinition) => void;

export interface QueryBuilderConfig {
  validators?: QueryValidator[];
  allowUnknownFields?: boolean;
}
