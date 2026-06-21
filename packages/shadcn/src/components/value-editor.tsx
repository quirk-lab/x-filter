import type {
  FieldSchema,
  FieldType,
  FilterRule,
  OperatorDef,
  ValidationError,
} from '@x-filter/core';
import {
  asArrayValue,
  asPairValue,
  asStringValue,
  findOperator,
  findSchemaField,
  parseNumberInput,
  updatePairValue,
} from '@x-filter/react';
import type { ReactNode } from 'react';
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
  errors?: ValidationError[];
  errorId?: string;
  onChange: (value: unknown) => void;
}

function asNumberInputValue(value: unknown): number | string {
  return typeof value === 'number' ? value : '';
}

// Temporal field types map to native HTML input types. Values are kept as the
// input's string representation (`yyyy-mm-dd`, `HH:mm`, `yyyy-mm-ddTHH:mm`).
const temporalInputType: Partial<Record<FieldType, 'date' | 'time' | 'datetime-local'>> = {
  date: 'date',
  time: 'time',
  dateTime: 'datetime-local',
};

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
  errors,
  errorId,
  onChange,
}: ShadcnValueEditorProps) {
  const selectedField = field ?? findSchemaField(schema, rule.field);
  const selectedOperator = operator ?? findOperator(selectedField, rule.operator);
  const isDisabled = disabled || selectedOperator?.arity === 'unary';
  const temporalType = selectedField ? temporalInputType[selectedField.type] : undefined;

  const errorList = errors ?? [];
  const hasError = errorList.length > 0;
  // `aria-invalid` should be absent (not `false`) for valid inputs.
  const ariaInvalid = hasError || undefined;
  const describedBy = hasError ? errorId : undefined;
  const errorClass = hasError ? 'border-destructive' : undefined;

  const renderControl = (): ReactNode => {
    if (selectedOperator?.arity === 'unary') {
      return (
        <Input
          aria-describedby={describedBy}
          aria-invalid={ariaInvalid}
          aria-label={label}
          className={cn(className, errorClass)}
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
              aria-describedby={describedBy}
              aria-invalid={ariaInvalid}
              aria-label={startLabel}
              className={errorClass}
              disabled={disabled}
              onChange={(event) =>
                onChange(updatePairValue(rule.value, 0, parseNumberInput(event.target.value)))
              }
              type="number"
              value={asNumberInputValue(firstValue)}
            />
            <Input
              aria-describedby={describedBy}
              aria-invalid={ariaInvalid}
              aria-label={endLabel}
              className={errorClass}
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

      if (temporalType) {
        return (
          <div className={cn('flex gap-2', className)}>
            <Input
              aria-describedby={describedBy}
              aria-invalid={ariaInvalid}
              aria-label={startLabel}
              className={errorClass}
              disabled={disabled}
              onChange={(event) => onChange(updatePairValue(rule.value, 0, event.target.value))}
              type={temporalType}
              value={asStringValue(firstValue)}
            />
            <Input
              aria-describedby={describedBy}
              aria-invalid={ariaInvalid}
              aria-label={endLabel}
              className={errorClass}
              disabled={disabled}
              onChange={(event) => onChange(updatePairValue(rule.value, 1, event.target.value))}
              type={temporalType}
              value={asStringValue(secondValue)}
            />
          </div>
        );
      }
    }

    if (selectedField?.type === 'number') {
      return (
        <Input
          aria-describedby={describedBy}
          aria-invalid={ariaInvalid}
          aria-label={label}
          className={cn(className, errorClass)}
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
          aria-describedby={describedBy}
          aria-invalid={ariaInvalid}
          aria-label={label}
          className={cn(className, errorClass)}
          disabled={isDisabled}
          onChange={(val) => onChange(val)}
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
          aria-describedby={describedBy}
          aria-invalid={ariaInvalid}
          aria-label={label}
          className={cn(className, errorClass)}
          disabled={isDisabled}
          multiple
          onChange={(val) => onChange(val)}
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
          aria-describedby={describedBy}
          aria-invalid={ariaInvalid}
          aria-label={label}
          checked={Boolean(rule.value)}
          className={cn(className, errorClass)}
          disabled={isDisabled}
          onChange={onChange}
        />
      );
    }

    if (temporalType) {
      return (
        <Input
          aria-describedby={describedBy}
          aria-invalid={ariaInvalid}
          aria-label={label}
          className={cn(className, errorClass)}
          disabled={isDisabled}
          onChange={(event) => onChange(event.target.value)}
          type={temporalType}
          value={asStringValue(rule.value)}
        />
      );
    }

    return (
      <Input
        aria-describedby={describedBy}
        aria-invalid={ariaInvalid}
        aria-label={label}
        className={cn(className, errorClass)}
        disabled={isDisabled}
        onChange={(event) => onChange(event.target.value)}
        value={asStringValue(rule.value)}
      />
    );
  };

  const control = renderControl();

  if (!hasError) {
    return control;
  }

  return (
    <div className="flex flex-col gap-1">
      {control}
      <span className="text-destructive text-sm" id={errorId} role="alert">
        {errorList.map((error) => error.message).join('; ')}
      </span>
    </div>
  );
}
