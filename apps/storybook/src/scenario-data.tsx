import type { FieldSchema, Filter, FilterGroup, FilterRule } from '@x-filter/core';
import { isFilterGroup, isFilterRule } from '@x-filter/core';
import type { CSSProperties } from 'react';

/**
 * Shared fixtures for the scenario stories (Notion / GitHub / IC / Validation).
 *
 * The `evaluateFilter` helper is intentionally a small, demo-only matcher so the
 * stories can show live result linkage. It is NOT part of the published packages
 * (a real query engine / adapter is tracked separately) — keep it simple.
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
      // Unknown operator: do not filter the row out.
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

/** Demo-only matcher: returns the issues that satisfy the filter tree. */
export function evaluateFilter(filter: Filter, row: IssueRow): boolean {
  return evaluateGroup(filter, row);
}

export function filterIssues(filter: Filter, rows: IssueRow[] = issues): IssueRow[] {
  return rows.filter((row) => evaluateFilter(filter, row));
}

// --- shared presentation ---------------------------------------------------

export const pageStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem',
  padding: '2rem',
  maxWidth: '68rem',
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  color: '#0f172a',
};

export const panelStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  border: '1px solid #e2e8f0',
  borderRadius: '16px',
  background: '#fff',
  padding: '1.25rem',
  boxShadow: '0 18px 48px rgb(15 23 42 / 8%)',
};

export const codeStyle: CSSProperties = {
  display: 'block',
  borderRadius: '10px',
  background: '#0f172a',
  color: '#e0f2fe',
  padding: '0.75rem 0.9rem',
  fontSize: '0.82rem',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  overflowX: 'auto',
};

const labelChipStyle: CSSProperties = {
  display: 'inline-block',
  borderRadius: '999px',
  background: '#eef2ff',
  color: '#4338ca',
  padding: '0.1rem 0.55rem',
  fontSize: '0.72rem',
  marginRight: '0.3rem',
};

export function StoryIntro({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <header style={{ maxWidth: '60rem' }}>
      <h1 style={{ margin: '0 0 0.35rem', fontSize: '1.5rem' }}>{title}</h1>
      <p style={{ margin: 0, color: '#475569', lineHeight: 1.6 }}>{children}</p>
    </header>
  );
}

export function IssueResults({ rows }: { rows: IssueRow[] }) {
  return (
    <section style={panelStyle} aria-label="Matching issues">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontSize: '1rem' }}>Matching issues</h2>
        <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
          {rows.length} of {issues.length}
        </span>
      </div>
      {rows.length === 0 ? (
        <p style={{ margin: 0, color: '#94a3b8' }}>No issues match the current filter.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: '#64748b' }}>
              <th style={{ padding: '0.4rem 0.5rem' }}>#</th>
              <th style={{ padding: '0.4rem 0.5rem' }}>Title</th>
              <th style={{ padding: '0.4rem 0.5rem' }}>Status</th>
              <th style={{ padding: '0.4rem 0.5rem' }}>Assignee</th>
              <th style={{ padding: '0.4rem 0.5rem' }}>Labels</th>
              <th style={{ padding: '0.4rem 0.5rem' }}>💬</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.4rem 0.5rem', color: '#94a3b8' }}>#{row.id}</td>
                <td style={{ padding: '0.4rem 0.5rem', fontWeight: 600 }}>
                  {row.title}
                  {row.isDraft ? (
                    <span style={{ ...labelChipStyle, background: '#f1f5f9', color: '#64748b' }}>
                      draft
                    </span>
                  ) : null}
                </td>
                <td style={{ padding: '0.4rem 0.5rem' }}>
                  <span
                    style={{
                      ...labelChipStyle,
                      background: row.status === 'open' ? '#dcfce7' : '#fee2e2',
                      color: row.status === 'open' ? '#15803d' : '#b91c1c',
                    }}
                  >
                    {row.status}
                  </span>
                </td>
                <td style={{ padding: '0.4rem 0.5rem' }}>{row.assignee}</td>
                <td style={{ padding: '0.4rem 0.5rem' }}>
                  {row.labels.map((label) => (
                    <span key={label} style={labelChipStyle}>
                      {label}
                    </span>
                  ))}
                </td>
                <td style={{ padding: '0.4rem 0.5rem', color: '#64748b' }}>{row.comments}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
