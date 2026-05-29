'use client';

import { AntdFilterBuilder } from '@x-filter/antd';
import type { Filter, ValidationError } from '@x-filter/core';
import { ShadcnFilterBuilder } from '@x-filter/shadcn';
import {
  Code,
  Database,
  FileText,
  Layers,
  type LucideIcon,
  PanelsTopLeft,
  RefreshCcw,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  getDemoSchema,
  invalidFilter,
  nestedFilter,
  starterFilter,
} from '../../demos/filter-fixtures';
import type { DemoOutputKind } from '../../demos/output';
import { buildDemoOutputs, getOutputText } from '../../demos/output';
import type { Locale } from '../../site/locales';

type Adapter = 'antd' | 'shadcn';

type DemoCopy = {
  title: string;
  subtitle: string;
  adapterLabel: string;
  reset: string;
  nested: string;
  invalid: string;
  valid: string;
  invalidState: string;
  outputLabel: string;
  schemaTitle: string;
  schemaDescription: string;
  emptyValidation: string;
  validationMessages: Record<string, string>;
  outputOptions: Record<DemoOutputKind, string>;
  labels: {
    addRule: string;
    addGroup: string;
    removeRule: string;
    removeGroup: string;
    field: string;
    operator: string;
    value: string;
    startValue: string;
    endValue: string;
    combinator: string;
    not: string;
    dslInput: string;
    applyDsl: string;
    noValue: string;
  };
};

const copy: Record<Locale, DemoCopy> = {
  en: {
    title: 'Adapter parity workbench',
    subtitle: 'Switch UI adapters while preserving the same schema and filter state.',
    adapterLabel: 'Adapter',
    reset: 'Reset',
    nested: 'Nested sample',
    invalid: 'Validation sample',
    valid: 'Valid',
    invalidState: 'Needs attention',
    outputLabel: 'Output',
    schemaTitle: 'Active schema',
    schemaDescription: 'The same typed schema drives both adapters and every output panel.',
    emptyValidation: 'No validation errors.',
    validationMessages: {
      invalidField: 'Field is not defined in schema',
      invalidOperator: 'Operator is not valid for this field',
      invalidValue: 'Value does not match the field schema',
      missingValue: 'Value is required for this operator',
      invalidGroup: 'Group is not valid',
      invalidCombinator: 'Combinator is not valid',
    },
    outputOptions: {
      json: 'JSON',
      dsl: 'DSL',
      sql: 'SQL',
      validation: 'Validation',
    },
    labels: {
      addRule: 'Add rule',
      addGroup: 'Add group',
      removeRule: 'Remove rule',
      removeGroup: 'Remove group',
      field: 'Field',
      operator: 'Operator',
      value: 'Value',
      startValue: 'Start value',
      endValue: 'End value',
      combinator: 'Combinator',
      not: 'Not',
      dslInput: 'DSL',
      applyDsl: 'Apply DSL',
      noValue: 'No value',
    },
  },
  zh: {
    title: '适配器一致性工作台',
    subtitle: '在同一份 schema 和过滤器状态上切换 UI 适配器。',
    adapterLabel: '适配器',
    reset: '重置',
    nested: '嵌套示例',
    invalid: '校验示例',
    valid: '有效',
    invalidState: '需要处理',
    outputLabel: '输出',
    schemaTitle: '当前 schema',
    schemaDescription: '同一份类型化 schema 同时驱动两个适配器和所有输出面板。',
    emptyValidation: '没有校验错误。',
    validationMessages: {
      invalidField: '字段未在 schema 中定义',
      invalidOperator: '操作符不适用于当前字段',
      invalidValue: '取值不符合字段 schema',
      missingValue: '当前操作符需要取值',
      invalidGroup: '分组无效',
      invalidCombinator: '组合器无效',
    },
    outputOptions: {
      json: 'JSON',
      dsl: 'DSL',
      sql: 'SQL',
      validation: '校验',
    },
    labels: {
      addRule: '添加规则',
      addGroup: '添加分组',
      removeRule: '删除规则',
      removeGroup: '删除分组',
      field: '字段',
      operator: '操作符',
      value: '取值',
      startValue: '起始值',
      endValue: '结束值',
      combinator: '组合器',
      not: '取反',
      dslInput: 'DSL',
      applyDsl: '应用 DSL',
      noValue: '无需取值',
    },
  },
};

const outputOptions: { icon: LucideIcon; kind: DemoOutputKind }[] = [
  { kind: 'json', icon: FileText },
  { kind: 'dsl', icon: Code },
  { kind: 'sql', icon: Database },
  { kind: 'validation', icon: ShieldCheck },
];

function cloneFilter(filter: Filter): Filter {
  return JSON.parse(JSON.stringify(filter)) as Filter;
}

function localizeErrors(errors: Record<string, ValidationError[]>, text: DemoCopy) {
  return Object.fromEntries(
    Object.entries(errors).map(([id, ruleErrors]) => [
      id,
      ruleErrors.map((error) => ({
        ...error,
        message: text.validationMessages[error.type] ?? error.message,
      })),
    ])
  );
}

function ValidationList({
  emptyValidation,
  errors,
}: {
  emptyValidation: string;
  errors: Record<string, ValidationError[]>;
}) {
  const entries = Object.entries(errors);

  if (entries.length === 0) {
    return (
      <ul className="validation-list">
        <li>{emptyValidation}</li>
      </ul>
    );
  }

  return (
    <ul className="validation-list">
      {entries.flatMap(([id, ruleErrors]) =>
        ruleErrors.map((error) => (
          <li key={`${id}-${error.type}`}>
            {id}: {error.message}
          </li>
        ))
      )}
    </ul>
  );
}

export function AdapterParityDemo({
  locale = 'en',
  mode = 'embedded',
}: {
  locale?: Locale;
  mode?: 'embedded' | 'workbench';
}) {
  const text = copy[locale];
  const schema = useMemo(() => getDemoSchema(locale), [locale]);
  const [adapter, setAdapter] = useState<Adapter>('antd');
  const [outputKind, setOutputKind] = useState<DemoOutputKind>('json');
  const [filter, setFilter] = useState<Filter>(() => cloneFilter(starterFilter));
  const outputs = useMemo(() => buildDemoOutputs(filter, schema), [filter, schema]);
  const localizedErrors = useMemo(
    () => localizeErrors(outputs.validation.errors, text),
    [outputs.validation.errors, text]
  );
  const activeOutput = getOutputText(outputs, outputKind);
  const statusClass = outputs.validation.valid ? 'status-pill' : 'status-pill status-pill--error';
  const StatusIcon = outputs.validation.valid ? ShieldCheck : TriangleAlert;

  return (
    <section className={mode === 'workbench' ? 'demo-shell' : 'demo-shell demo-shell--embedded'}>
      <div className="demo-topbar">
        <div className="demo-title">
          <strong>{text.title}</strong>
          <span>{text.subtitle}</span>
        </div>
        <span className={statusClass}>
          <StatusIcon aria-hidden="true" size={15} />
          {outputs.validation.valid ? text.valid : text.invalidState}
        </span>
      </div>
      <div className="demo-topbar">
        <fieldset className="segmented">
          <legend className="sr-only">{text.adapterLabel}</legend>
          <button
            aria-pressed={adapter === 'antd'}
            type="button"
            onClick={() => setAdapter('antd')}
          >
            <PanelsTopLeft aria-hidden="true" size={15} />
            AntD
          </button>
          <button
            aria-pressed={adapter === 'shadcn'}
            type="button"
            onClick={() => setAdapter('shadcn')}
          >
            <Layers aria-hidden="true" size={15} />
            shadcn
          </button>
        </fieldset>
        <div className="section-actions">
          <button
            className="tool-button"
            type="button"
            onClick={() => setFilter(cloneFilter(nestedFilter))}
          >
            <Layers aria-hidden="true" size={15} />
            {text.nested}
          </button>
          <button
            className="tool-button"
            type="button"
            onClick={() => setFilter(cloneFilter(invalidFilter))}
          >
            <TriangleAlert aria-hidden="true" size={15} />
            {text.invalid}
          </button>
          <button
            className="tool-button"
            type="button"
            onClick={() => setFilter(cloneFilter(starterFilter))}
          >
            <RefreshCcw aria-hidden="true" size={15} />
            {text.reset}
          </button>
        </div>
      </div>
      <div className="demo-grid">
        <div className="builder-pane">
          <div className="adapter-host">
            {adapter === 'antd' ? (
              <AntdFilterBuilder
                dsl
                errors={localizedErrors}
                labels={text.labels}
                schema={schema}
                value={filter}
                onChange={setFilter}
              />
            ) : (
              <ShadcnFilterBuilder
                dsl
                errors={localizedErrors}
                labels={text.labels}
                schema={schema}
                value={filter}
                onChange={setFilter}
              />
            )}
          </div>
        </div>
        <div className="output-pane">
          <fieldset className="output-tabs">
            <legend className="sr-only">{text.outputLabel}</legend>
            {outputOptions.map((option) => {
              const Icon = option.icon;
              const label = text.outputOptions[option.kind];
              return (
                <button
                  aria-pressed={outputKind === option.kind}
                  className={outputKind === option.kind ? 'tool-button is-active' : 'tool-button'}
                  key={option.kind}
                  type="button"
                  onClick={() => setOutputKind(option.kind)}
                >
                  <Icon aria-hidden="true" size={15} />
                  {label}
                </button>
              );
            })}
          </fieldset>
          <div className="output-card">
            {outputKind === 'validation' ? (
              <ValidationList emptyValidation={text.emptyValidation} errors={localizedErrors} />
            ) : (
              <pre>{activeOutput}</pre>
            )}
          </div>
        </div>
      </div>
      {mode === 'workbench' ? (
        <div className="builder-pane">
          <p className="eyebrow">{text.schemaTitle}</p>
          <p>{text.schemaDescription}</p>
          <div className="schema-panel">
            {schema.map((field) => (
              <div className="schema-field" key={field.name}>
                <strong>{field.label}</strong>
                <span>
                  {field.type} · {field.defaultOperator ?? 'default'}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
