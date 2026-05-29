import { type FieldSchema, type Filter, getOperators, type OperatorDef } from '@x-filter/core';
import type { Locale } from '../site/locales';

const inOperators: OperatorDef[] = [
  { name: 'in', label: 'is any of', arity: 'binary' },
  { name: 'notIn', label: 'is none of', arity: 'binary' },
  { name: 'isEmpty', label: 'is empty', arity: 'unary' },
  { name: 'isNotEmpty', label: 'is not empty', arity: 'unary' },
];

export const demoSchema: FieldSchema[] = [
  {
    name: 'accountTier',
    label: 'Account tier',
    type: 'select',
    defaultOperator: 'equals',
    defaultValue: 'enterprise',
    values: [
      { value: 'startup', label: 'Startup' },
      { value: 'growth', label: 'Growth' },
      { value: 'enterprise', label: 'Enterprise' },
    ],
  },
  {
    name: 'contractValue',
    label: 'Contract value',
    type: 'number',
    defaultOperator: 'gt',
    defaultValue: 50000,
  },
  {
    name: 'region',
    label: 'Region',
    type: 'multiSelect',
    operators: inOperators,
    defaultOperator: 'in',
    defaultValue: ['na', 'emea'],
    values: [
      { value: 'na', label: 'North America' },
      { value: 'emea', label: 'EMEA' },
      { value: 'apac', label: 'APAC' },
      { value: 'latam', label: 'LATAM' },
    ],
  },
  {
    name: 'renewalDate',
    label: 'Renewal date',
    type: 'date',
    defaultOperator: 'between',
    defaultValue: ['2026-01-01', '2026-06-30'],
  },
  {
    name: 'ownerActive',
    label: 'Owner active',
    type: 'boolean',
    defaultOperator: 'equals',
    defaultValue: true,
  },
];

const zhFieldLabels: Record<string, string> = {
  accountTier: '客户层级',
  contractValue: '合同金额',
  ownerActive: '负责人活跃',
  region: '区域',
  renewalDate: '续约日期',
};

const zhOptionLabels: Record<string, string> = {
  apac: '亚太',
  emea: '欧洲中东非洲',
  enterprise: '企业版',
  growth: '增长型',
  latam: '拉美',
  na: '北美',
  startup: '初创',
};

const zhOperatorLabels: Record<string, string> = {
  after: '晚于',
  before: '早于',
  between: '介于',
  contains: '包含',
  endsWith: '结尾为',
  equals: '等于',
  gt: '大于',
  gte: '大于等于',
  in: '包含任一',
  isEmpty: '为空',
  isNotEmpty: '不为空',
  lt: '小于',
  lte: '小于等于',
  notContains: '不包含',
  notEquals: '不等于',
  notIn: '不包含任一',
  startsWith: '开头为',
};

export function getDemoSchema(locale: Locale): FieldSchema[] {
  if (locale === 'en') return demoSchema;

  return demoSchema.map((field) => ({
    ...field,
    label: zhFieldLabels[field.name] ?? field.label,
    operators: getOperators(field.type, field.operators).map((operator) => ({
      ...operator,
      label: zhOperatorLabels[operator.name] ?? operator.label,
    })),
    values: field.values?.map((option) => ({
      ...option,
      label: zhOptionLabels[option.value] ?? option.label,
    })),
  }));
}

export const sqlFieldMap = {
  accountTier: 'accounts.tier',
  contractValue: 'contracts.arr',
  ownerActive: 'owners.active',
  region: 'accounts.region',
  renewalDate: 'contracts.renewal_date',
};

export const starterFilter: Filter = {
  id: 'root',
  combinator: 'and',
  conditions: [
    {
      id: 'tier',
      field: 'accountTier',
      operator: 'equals',
      value: 'enterprise',
    },
    {
      id: 'value',
      field: 'contractValue',
      operator: 'gt',
      value: 50000,
    },
    {
      id: 'market',
      field: 'region',
      operator: 'in',
      value: ['na', 'emea'],
    },
  ],
};

export const nestedFilter: Filter = {
  id: 'root',
  combinator: 'and',
  conditions: [
    {
      id: 'tier',
      field: 'accountTier',
      operator: 'equals',
      value: 'enterprise',
    },
    {
      id: 'renewal',
      field: 'renewalDate',
      operator: 'between',
      value: ['2026-01-01', '2026-06-30'],
    },
    {
      id: 'owner',
      combinator: 'or',
      conditions: [
        {
          id: 'active',
          field: 'ownerActive',
          operator: 'equals',
          value: true,
        },
        {
          id: 'value',
          field: 'contractValue',
          operator: 'gte',
          value: 100000,
        },
      ],
    },
  ],
};

export const invalidFilter: Filter = {
  id: 'root',
  combinator: 'and',
  conditions: [
    {
      id: 'missing-value',
      field: 'contractValue',
      operator: 'gt',
      value: null,
    },
    {
      id: 'unknown-field',
      field: 'segment',
      operator: 'equals',
      value: 'strategic',
    },
  ],
};
