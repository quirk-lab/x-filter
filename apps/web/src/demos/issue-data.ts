import type { FieldSchema, Filter, FilterGroup, FilterRule } from '@x-filter/core';
import { isFilterGroup, isFilterRule } from '@x-filter/core';

/**
 * Shared demo data for the Notion-style and GitHub-style filter demos.
 * Adapted from the Storybook scenario data (apps/storybook/src/scenario-data.tsx)
 * but self-contained for the web app.
 */

export interface IssueRow {
  id: number;
  title: string;
  status: 'open' | 'closed';
  author: string;
  assignee: string;
  labels: string[];
  comments: number;
  createdAt: string;
  isDraft: boolean;
}

export const issueSchema: FieldSchema[] = [
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    defaultOperator: 'equals',
    operators: [
      { name: 'equals', label: 'is', arity: 'binary' },
      { name: 'notEquals', label: 'is not', arity: 'binary' },
    ],
    values: [
      { value: 'open', label: 'Open' },
      { value: 'closed', label: 'Closed' },
    ],
  },
  {
    name: 'author',
    label: 'Author',
    type: 'text',
    defaultOperator: 'contains',
    operators: [
      { name: 'contains', label: 'contains', arity: 'binary' },
      { name: 'equals', label: 'is', arity: 'binary' },
    ],
  },
  {
    name: 'assignee',
    label: 'Assignee',
    type: 'text',
    defaultOperator: 'contains',
    operators: [
      { name: 'contains', label: 'contains', arity: 'binary' },
      { name: 'equals', label: 'is', arity: 'binary' },
    ],
  },
  {
    name: 'labels',
    label: 'Label',
    type: 'multiSelect',
    defaultOperator: 'includes',
    operators: [
      { name: 'includes', label: 'includes', arity: 'binary' },
      { name: 'excludes', label: 'excludes', arity: 'binary' },
    ],
    values: [
      { value: 'bug', label: 'bug' },
      { value: 'feature', label: 'feature' },
      { value: 'docs', label: 'docs' },
      { value: 'enhancement', label: 'enhancement' },
    ],
  },
  {
    name: 'comments',
    label: 'Comments',
    type: 'number',
    defaultOperator: 'gte',
    operators: [
      { name: 'gte', label: 'is at least', arity: 'binary' },
      { name: 'lte', label: 'is at most', arity: 'binary' },
      { name: 'between', label: 'is between', arity: 'ternary' },
    ],
  },
  {
    name: 'createdAt',
    label: 'Created',
    type: 'date',
    defaultOperator: 'after',
    operators: [
      { name: 'after', label: 'is after', arity: 'binary' },
      { name: 'before', label: 'is before', arity: 'binary' },
    ],
  },
  {
    name: 'isDraft',
    label: 'Draft',
    type: 'boolean',
    defaultOperator: 'is',
    operators: [{ name: 'is', label: 'is', arity: 'binary' }],
  },
];

export const issues: IssueRow[] = [
  {
    id: 412,
    title: 'Crash when filtering empty groups',
    status: 'open',
    author: 'ada',
    assignee: 'grace',
    labels: ['bug'],
    comments: 12,
    createdAt: '2026-05-02',
    isDraft: false,
  },
  {
    id: 418,
    title: 'Add IC inline combinator docs',
    status: 'open',
    author: 'lin',
    assignee: 'ada',
    labels: ['docs', 'enhancement'],
    comments: 3,
    createdAt: '2026-05-18',
    isDraft: false,
  },
  {
    id: 421,
    title: 'Preset bar dropdown overflow',
    status: 'open',
    author: 'grace',
    assignee: 'grace',
    labels: ['bug', 'enhancement'],
    comments: 7,
    createdAt: '2026-06-01',
    isDraft: true,
  },
  {
    id: 399,
    title: 'Export to MongoDB query',
    status: 'closed',
    author: 'ada',
    assignee: 'lin',
    labels: ['feature'],
    comments: 22,
    createdAt: '2026-03-11',
    isDraft: false,
  },
  {
    id: 430,
    title: 'Keyboard navigation for rule rows',
    status: 'open',
    author: 'mira',
    assignee: 'ada',
    labels: ['feature', 'enhancement'],
    comments: 0,
    createdAt: '2026-06-12',
    isDraft: true,
  },
  {
    id: 388,
    title: 'Dark mode for shadcn adapter',
    status: 'closed',
    author: 'lin',
    assignee: 'mira',
    labels: ['feature'],
    comments: 15,
    createdAt: '2026-02-27',
    isDraft: false,
  },
];

function toTime(value: unknown): number {
  const time = new Date(String(value)).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function matchesOperator(operator: string, fieldValue: unknown, ruleValue: unknown): boolean {
  switch (operator) {
    case 'equals':
    case 'is':
      if (typeof fieldValue === 'boolean') {
        return fieldValue === (ruleValue === true || ruleValue === 'true');
      }
      return String(fieldValue) === String(ruleValue);
    case 'notEquals':
      return String(fieldValue) !== String(ruleValue);
    case 'contains':
      return String(fieldValue).toLowerCase().includes(String(ruleValue).toLowerCase());
    case 'includes':
      return Array.isArray(fieldValue) && fieldValue.includes(ruleValue as string);
    case 'excludes':
      return Array.isArray(fieldValue) && !fieldValue.includes(ruleValue as string);
    case 'gte':
      return Number(fieldValue) >= Number(ruleValue);
    case 'lte':
      return Number(fieldValue) <= Number(ruleValue);
    case 'between': {
      const [lo, hi] = Array.isArray(ruleValue) ? ruleValue : [undefined, undefined];
      return Number(fieldValue) >= Number(lo) && Number(fieldValue) <= Number(hi);
    }
    case 'after':
      return toTime(fieldValue) > toTime(ruleValue);
    case 'before':
      return toTime(fieldValue) < toTime(ruleValue);
    default:
      return true;
  }
}

function evaluateRule(rule: FilterRule, row: IssueRow): boolean {
  if (!rule.field || !rule.operator) return true;
  const fieldValue = (row as unknown as Record<string, unknown>)[rule.field];
  if (fieldValue === undefined) return true;
  const result = matchesOperator(rule.operator, fieldValue, rule.value);
  return rule.not ? !result : result;
}

function evaluateGroup(group: FilterGroup, row: IssueRow): boolean {
  const childResults = group.children.map((child) => {
    if (isFilterRule(child)) return evaluateRule(child, row);
    if (isFilterGroup(child)) return evaluateGroup(child, row);
    return true;
  });
  if (childResults.length === 0) return true;
  const combined =
    group.combinator === 'or' ? childResults.some(Boolean) : childResults.every(Boolean);
  return group.not ? !combined : combined;
}

export function evaluateFilter(filter: Filter, row: IssueRow): boolean {
  return evaluateGroup(filter, row);
}

export function filterIssues(filter: Filter, rows: IssueRow[] = issues): IssueRow[] {
  return rows.filter((row) => evaluateFilter(filter, row));
}

// ─── Initial filters ───────────────────────────────────────────────────────

export const notionInitialFilter: Filter = {
  id: 'root',
  combinator: 'and',
  children: [
    { id: 'r-status', field: 'status', operator: 'equals', value: 'open' },
    {
      id: 'g-people',
      combinator: 'or',
      children: [
        { id: 'r-assignee', field: 'assignee', operator: 'contains', value: 'ada' },
        { id: 'r-label', field: 'labels', operator: 'includes', value: 'bug' },
      ],
    },
  ],
};

export const githubInitialFilter: Filter = {
  id: 'root',
  combinator: 'and',
  children: [
    { id: 'r-status', field: 'status', operator: 'equals', value: 'open' },
    { id: 'r-label', field: 'labels', operator: 'includes', value: 'bug' },
  ],
};
