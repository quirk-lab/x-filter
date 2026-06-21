'use client';

import { useState } from 'react';
import type { Locale } from '../../site/locales';
import { AdapterParityDemo } from './adapter-parity-demo';
import { GithubFilterDemo } from './github-filter-demo';
import { NotionFilterDemo } from './notion-filter-demo';

type Tab = 'notion' | 'github' | 'workbench';

const TABS: Record<Locale, Record<Tab, { label: string; description: string }>> = {
  en: {
    notion: {
      label: 'Notion Filter',
      description: 'Database-style nested filter with live results',
    },
    github: {
      label: 'GitHub Search',
      description: 'Tokenized search bar with DSL completions',
    },
    workbench: {
      label: 'Adapter Workbench',
      description: 'Compare adapters with JSON, DSL, SQL, and validation output',
    },
  },
  zh: {
    notion: {
      label: 'Notion 筛选',
      description: '数据库风格嵌套筛选，实时联动结果',
    },
    github: {
      label: 'GitHub 搜索',
      description: '令牌化搜索栏，支持 DSL 补全',
    },
    workbench: {
      label: '适配器工作台',
      description: '对比适配器，检查 JSON、DSL、SQL 和校验输出',
    },
  },
};

export function PlaygroundWorkbench({ locale = 'en' }: { locale?: Locale }) {
  const [tab, setTab] = useState<Tab>('notion');
  const tabs = TABS[locale];

  return (
    <div className="demo-shell">
      {/* Tab bar */}
      <div className="demo-tabs" role="tablist">
        {(Object.keys(tabs) as Tab[]).map((key) => (
          <button
            aria-selected={tab === key}
            className={tab === key ? 'demo-tab demo-tab--active' : 'demo-tab'}
            key={key}
            onClick={() => setTab(key)}
            role="tab"
            type="button"
          >
            <span className="demo-tab-label">{tabs[key].label}</span>
            <span className="demo-tab-desc">{tabs[key].description}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="demo-tab-content" role="tabpanel">
        {tab === 'notion' ? <NotionFilterDemo locale={locale} /> : null}
        {tab === 'github' ? <GithubFilterDemo locale={locale} /> : null}
        {tab === 'workbench' ? <AdapterParityDemo locale={locale} mode="workbench" /> : null}
      </div>
    </div>
  );
}
