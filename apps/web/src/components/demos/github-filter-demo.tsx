'use client';

import { formatDSL } from '@x-filter/core';
import { ShadcnDslTokenInput } from '@x-filter/shadcn';
import { useMemo, useState } from 'react';
import {
  filterIssues,
  githubInitialFilter,
  type IssueRow,
  issueSchema,
  issues,
} from '../../demos/issue-data';
import type { Locale } from '../../site/locales';

const COPY = {
  en: {
    title: 'GitHub-style issue search bar',
    subtitle:
      'A single-line, tokenized search bar. Type field:operator:value, accept completions, and the issue list filters live. The committed expression doubles as a shareable URL query.',
    search: 'Search issues',
    shareable: 'Shareable link',
    matching: 'Matching issues',
    noMatch: 'No issues match the current filter.',
    apply: 'Apply',
  },
  zh: {
    title: 'GitHub 风格 Issue 搜索栏',
    subtitle:
      '单行令牌化搜索栏。输入 field:operator:value，接受补全，issue 列表实时筛选。提交的表达式同时可用作可分享的 URL 查询。',
    search: '搜索 Issues',
    shareable: '可分享链接',
    matching: '匹配的 Issues',
    noMatch: '没有符合条件的 Issue。',
    apply: '应用',
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

export function GithubFilterDemo({ locale = 'en' }: { locale?: Locale }) {
  const t = COPY[locale];
  const [filter, setFilter] = useState(githubInitialFilter);
  const results = useMemo(() => filterIssues(filter), [filter]);
  const dsl = formatDSL(filter);
  const shareUrl = `https://example.com/issues?q=${encodeURIComponent(dsl)}`;

  return (
    <div className="demo-shell">
      <div className="demo-stack">
        {/* Search bar panel */}
        <div className="demo-panel">
          <div className="demo-panel-header">
            <span aria-hidden="true" style={{ fontSize: '1.1rem' }}>
              🔍
            </span>
            <strong>{t.search}</strong>
          </div>
          <ShadcnDslTokenInput
            filter={filter}
            schema={issueSchema}
            onCommit={setFilter}
            labels={{
              dslInput: t.search,
              applyDsl: t.apply,
            }}
          />
          <div className="demo-shareable">
            <span className="demo-dsl-label">{t.shareable}</span>
            <code className="demo-shareable-url">{shareUrl}</code>
          </div>
        </div>

        {/* Results */}
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
            <IssueList rows={results} />
          )}
        </div>
      </div>
    </div>
  );
}

function IssueList({ rows }: { rows: IssueRow[] }) {
  return (
    <div className="demo-issue-list">
      {rows.map((row) => (
        <div className="demo-issue-item" key={row.id}>
          <div className="demo-issue-icon">
            <span className="demo-status-dot" style={{ background: STATUS_TEXT[row.status] }} />
          </div>
          <div className="demo-issue-content">
            <div className="demo-issue-title">
              <span className="demo-issue-id">#{row.id}</span>
              {row.title}
              {row.isDraft ? <span className="demo-chip demo-chip-muted">draft</span> : null}
            </div>
            <div className="demo-issue-meta">
              <span
                className="demo-chip"
                style={{
                  background: STATUS_COLORS[row.status],
                  color: STATUS_TEXT[row.status],
                }}
              >
                {row.status}
              </span>
              {row.labels.map((label) => (
                <span
                  className="demo-chip"
                  key={label}
                  style={{ background: LABEL_COLORS[label] ?? '#f1f5f9' }}
                >
                  {label}
                </span>
              ))}
              <span className="demo-issue-assignee">@{row.assignee}</span>
              <span className="demo-issue-comments">💬 {row.comments}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
