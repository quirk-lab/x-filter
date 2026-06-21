'use client';

import { formatDSL } from '@x-filter/core';
import { ShadcnFilterBuilder } from '@x-filter/shadcn';
import { useMemo, useState } from 'react';
import {
  filterIssues,
  type IssueRow,
  issueSchema,
  issues,
  notionInitialFilter,
} from '../../demos/issue-data';
import type { Locale } from '../../site/locales';

const COPY = {
  en: {
    title: 'Notion-style database filter',
    subtitle:
      'A nested rule tree drives a live database view. Edit any condition and the matching issues update instantly — the end-to-end loop a Notion filter popover provides.',
    database: 'Issues · Filtered view',
    matching: 'Matching issues',
    noMatch: 'No issues match the current filter.',
    dsl: 'DSL',
    noConditions: '(no conditions)',
  },
  zh: {
    title: 'Notion 风格数据库筛选',
    subtitle:
      '嵌套规则树驱动实时数据库视图。编辑任意条件，匹配的 issue 即刻更新——完整还原 Notion 筛选弹窗的端到端体验。',
    database: 'Issues · 筛选视图',
    matching: '匹配的 Issues',
    noMatch: '没有符合条件的 Issue。',
    dsl: 'DSL',
    noConditions: '（无条件）',
  },
};

const STATUS_COLORS: Record<IssueRow['status'], string> = {
  open: 'var(--xf-status-open, #dcfce7)',
  closed: 'var(--xf-status-closed, #fee2e2)',
};

const STATUS_TEXT: Record<IssueRow['status'], string> = {
  open: '#15803d',
  closed: '#b91c1c',
};

const LABEL_COLORS: Record<string, string> = {
  bug: '#fde2e2',
  feature: '#e0f2fe',
  docs: '#f3e8ff',
  enhancement: '#fef9c3',
};

export function NotionFilterDemo({ locale = 'en' }: { locale?: Locale }) {
  const t = COPY[locale];
  const [filter, setFilter] = useState(notionInitialFilter);
  const results = useMemo(() => filterIssues(filter), [filter]);
  const dsl = formatDSL(filter);

  return (
    <div className="demo-shell">
      <div className="demo-grid" style={{ gridTemplateColumns: 'minmax(480px, 560px) 1fr' }}>
        {/* Filter panel */}
        <div className="demo-panel">
          <div className="demo-panel-header">
            <span aria-hidden="true" style={{ fontSize: '1.1rem' }}>
              🗂️
            </span>
            <strong>{t.database}</strong>
          </div>
          <ShadcnFilterBuilder
            schema={issueSchema}
            value={filter}
            onChange={setFilter}
            labels={{
              addRule: locale === 'zh' ? '添加条件' : 'Add condition',
              addGroup: locale === 'zh' ? '添加分组' : 'Add group',
              removeRule: locale === 'zh' ? '删除条件' : 'Remove condition',
              removeGroup: locale === 'zh' ? '删除分组' : 'Remove group',
            }}
          />
          <div className="demo-dsl">
            <span className="demo-dsl-label">{t.dsl}</span>
            <code>{dsl || t.noConditions}</code>
          </div>
        </div>

        {/* Results table */}
        <div className="demo-panel">
          <div className="demo-panel-header">
            <h3>{t.matching}</h3>
            <span className="demo-count">
              {results.length} / {issues.length}
            </span>
          </div>
          {results.length === 0 ? (
            <p className="demo-empty">{t.noMatch}</p>
          ) : (
            <IssueTable rows={results} />
          )}
        </div>
      </div>
    </div>
  );
}

function IssueTable({ rows }: { rows: IssueRow[] }) {
  return (
    <table className="demo-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Title</th>
          <th>Status</th>
          <th>Assignee</th>
          <th>Labels</th>
          <th>Comments</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td className="demo-table-id">#{row.id}</td>
            <td className="demo-table-title">
              {row.title}
              {row.isDraft ? <span className="demo-chip demo-chip-muted">draft</span> : null}
            </td>
            <td>
              <span
                className="demo-chip"
                style={{
                  background: STATUS_COLORS[row.status],
                  color: STATUS_TEXT[row.status],
                }}
              >
                {row.status}
              </span>
            </td>
            <td>{row.assignee}</td>
            <td>
              {row.labels.map((label) => (
                <span
                  className="demo-chip"
                  key={label}
                  style={{ background: LABEL_COLORS[label] ?? '#f1f5f9' }}
                >
                  {label}
                </span>
              ))}
            </td>
            <td className="demo-table-comments">{row.comments}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
