import type { FieldSchema, FilterRule, OperatorDef } from '@x-filter/core';
import {
  asArrayValue,
  asPairValue,
  asStringValue,
  findOperator,
  findSchemaField,
  parseNumberInput,
  updatePairValue,
} from '@x-filter/react';
import type { ChangeEvent } from 'react';
import { Checkbox, cn, Input, Select } from './primitives';

export interface ShadcnValueEditorProps {
  schema: FieldSchema[];
  rule: FilterRule;
  field?: FieldSchema;
  operator?: OperatorDef;
  disabled?: boolean;
  className?: string;
  label?: string;
  startLabel?: string;
  endLabel?: string;
  noValueLabel?: string;
  onChange: (value: unknown) => void;
}

function asNumberInputValue(value: unknown): number | string {
  return typeof value === 'number' ? value : '';
}

function selectedValues(select: HTMLSelectElement): string[] {
  return Array.from(select.selectedOptions, (option) => option.value);
}

export function ShadcnValueEditor({
  schema,
  rule,
  field,
  operator,
  disabled,
  className,
  label = 'Value',
  startLabel = 'Start value',
  endLabel = 'End value',
  noValueLabel = 'No value',
  onChange,
}: ShadcnValueEditorProps) {
  const selectedField = field ?? findSchemaField(schema, rule.field);
  const selectedOperator = operator ?? findOperator(selectedField, rule.operator);
  const isDisabled = disabled || selectedOperator?.arity === 'unary';

  if (selectedOperator?.arity === 'unary') {
    return (
      <Input
        aria-label={label}
        className={className}
        disabled
        placeholder={noValueLabel}
        value=""
      />
    );
  }

  if (selectedOperator?.arity === 'ternary') {
    const [firstValue, secondValue] = asPairValue(rule.value);

    if (selectedField?.type === 'number') {
      return (
        <div className={cn('flex gap-2', className)}>
          <Input
            aria-label={startLabel}
            disabled={disabled}
            onChange={(event) =>
              onChange(updatePairValue(rule.value, 0, parseNumberInput(event.target.value)))
            }
            type="number"
            value={asNumberInputValue(firstValue)}
          />
          <Input
            aria-label={endLabel}
            disabled={disabled}
            onChange={(event) =>
              onChange(updatePairValue(rule.value, 1, parseNumberInput(event.target.value)))
            }
            type="number"
            value={asNumberInputValue(secondValue)}
          />
        </div>
      );
    }

    if (selectedField?.type === 'date') {
      return (
        <div className={cn('flex gap-2', className)}>
          <Input
            aria-label={startLabel}
            disabled={disabled}
            onChange={(event) => onChange(updatePairValue(rule.value, 0, event.target.value))}
            type="date"
            value={asStringValue(firstValue)}
          />
          <Input
            aria-label={endLabel}
            disabled={disabled}
            onChange={(event) => onChange(updatePairValue(rule.value, 1, event.target.value))}
            type="date"
            value={asStringValue(secondValue)}
          />
        </div>
      );
    }
  }

  if (selectedField?.type === 'number') {
    return (
      <Input
        aria-label={label}
        className={className}
        disabled={isDisabled}
        onChange={(event) => onChange(parseNumberInput(event.target.value))}
        type="number"
        value={asNumberInputValue(rule.value)}
      />
    );
  }

  if (selectedField?.type === 'select') {
    return (
      <Select
        aria-label={label}
        className={className}
        disabled={isDisabled}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value)}
        options={(selectedField.values ?? []).map((option) => ({
          value: option.value,
          label: option.label,
        }))}
        placeholder={label}
        value={asStringValue(rule.value)}
      />
    );
  }

  if (selectedField?.type === 'multiSelect') {
    return (
      <Select
        aria-label={label}
        className={className}
        disabled={isDisabled}
        multiple
        onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(selectedValues(event.target))}
        options={(selectedField.values ?? []).map((option) => ({
          value: option.value,
          label: option.label,
        }))}
        value={asArrayValue(rule.value)}
      />
    );
  }

  if (selectedField?.type === 'boolean') {
    return (
      <Checkbox
        aria-label={label}
        checked={Boolean(rule.value)}
        className={className}
        disabled={isDisabled}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.checked)}
      />
    );
  }

  if (selectedField?.type === 'date') {
    return (
      <Input
        aria-label={label}
        className={className}
        disabled={isDisabled}
        onChange={(event) => onChange(event.target.value)}
        type="date"
        value={asStringValue(rule.value)}
      />
    );
  }

  return (
    <Input
      aria-label={label}
      className={className}
      disabled={isDisabled}
      onChange={(event) => onChange(event.target.value)}
      value={asStringValue(rule.value)}
    />
  );
}
