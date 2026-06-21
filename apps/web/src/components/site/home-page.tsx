import { ArrowRight, BookOpen, Boxes, PlaySquare, Share2, Terminal, Workflow } from 'lucide-react';
import Link from 'next/link';
import type { Locale } from '../../site/locales';
import { docsNav, localizeHref } from '../../site/routes';
import { NotionFilterDemo } from '../demos/notion-filter-demo';

const copy = {
  en: {
    eyebrow: 'Composable query UI',
    headline: 'Build filters like Notion & GitHub',
    lede: 'A schema-driven filter builder with adapter parity — render the same filter tree through Ant Design or shadcn, and keep JSON, DSL, SQL, and validation in sync.',
    docs: 'Read the docs',
    demo: 'Open playground',
    metrics: [
      ['2 adapters', 'Ant Design + shadcn'],
      ['6 outputs', 'JSON, DSL, SQL, MongoDB…'],
      ['0 backend', 'Static-site ready'],
    ],
    features: [
      {
        title: 'Schema-driven filters',
        body: 'Model fields, operators, values, groups, and negation in a small serializable core.',
        icon: Boxes,
      },
      {
        title: 'Adapter parity',
        body: 'Render the same filter with Ant Design or shadcn while preserving state and validation.',
        icon: Workflow,
      },
      {
        title: 'Round-trip outputs',
        body: 'Inspect JSON, text DSL, parameterized SQL, and validation errors from one source of truth.',
        icon: Terminal,
      },
    ],
    docsTitle: 'Documentation map',
    docsBody: 'Start with the integration path, then dive into adapters, DSL, SQL, and deployment.',
  },
  zh: {
    eyebrow: '可组合查询 UI',
    headline: '像 Notion 和 GitHub 一样构建筛选器',
    lede: 'Schema 驱动的过滤器构建器，适配器一致 —— 用同一份过滤树渲染 Ant Design 或 shadcn，并保持 JSON、DSL、SQL 和校验同步。',
    docs: '阅读文档',
    demo: '打开演练场',
    metrics: [
      ['2 个适配器', 'Ant Design + shadcn'],
      ['6 种输出', 'JSON、DSL、SQL、MongoDB…'],
      ['0 后端', '静态站点就绪'],
    ],
    features: [
      {
        title: 'Schema 驱动过滤器',
        body: '用小型可序列化核心描述字段、操作符、取值、分组和取反。',
        icon: Boxes,
      },
      {
        title: '适配器一致性',
        body: '用同一份过滤器渲染 Ant Design 或 shadcn，同时保持状态和校验一致。',
        icon: Workflow,
      },
      {
        title: '输出可往返',
        body: '从同一个事实来源检查 JSON、文本 DSL、参数化 SQL 和校验错误。',
        icon: Terminal,
      },
    ],
    docsTitle: '文档地图',
    docsBody: '先走完整集成路径，再深入适配器、DSL、SQL 与部署。',
  },
} satisfies Record<Locale, unknown>;

export function HomePage({ locale = 'en' }: { locale?: Locale }) {
  const text = copy[locale] as (typeof copy)['en'];

  return (
    <>
      {/* Hero — full width, no embedded demo */}
      <section className="hero hero--centered">
        <div className="content-shell">
          <div className="hero-copy hero-copy--centered">
            <p className="eyebrow">{text.eyebrow}</p>
            <h1>{text.headline}</h1>
            <p className="hero-lede">{text.lede}</p>
            <div className="hero-actions">
              <Link className="button button--primary" href={localizeHref('/docs', locale)}>
                <BookOpen aria-hidden="true" size={17} />
                {text.docs}
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
              <Link className="button" href={localizeHref('/playground', locale)}>
                <PlaySquare aria-hidden="true" size={17} />
                {text.demo}
              </Link>
            </div>
            <div className="metric-strip">
              {text.metrics.map(([value, label]) => (
                <div className="metric" key={value}>
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Live demo section — Notion filter */}
      <section className="page-section page-section--surface">
        <div className="content-shell">
          <div className="prose" style={{ marginBottom: '1.5rem' }}>
            <p className="eyebrow">
              <PlaySquare aria-hidden="true" size={15} />
              {locale === 'zh' ? '实时演示' : 'Live demo'}
            </p>
            <h2 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem' }}>
              {locale === 'zh' ? 'Notion 风格数据库筛选' : 'Notion-style database filter'}
            </h2>
            <p className="hero-lede" style={{ margin: 0 }}>
              {locale === 'zh'
                ? '编辑条件，匹配的 issue 实时更新。完整还原 Notion 筛选的端到端体验。'
                : 'Edit any condition and matching issues update instantly — the end-to-end loop a Notion filter popover provides.'}
            </p>
          </div>
          <NotionFilterDemo locale={locale} />
        </div>
      </section>

      {/* Features */}
      <section className="page-section">
        <div className="content-shell feature-grid">
          {text.features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div className="feature-card" key={feature.title}>
                <Icon aria-hidden="true" color="var(--xf-accent)" size={22} />
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Docs map */}
      <section className="page-section page-section--surface">
        <div className="content-shell">
          <p className="eyebrow">
            <Share2 aria-hidden="true" size={15} />
            {text.docsTitle}
          </p>
          <p className="hero-lede">{text.docsBody}</p>
          <div className="card-grid" style={{ marginTop: '1.25rem' }}>
            {docsNav.map((item) => (
              <Link className="doc-card" href={localizeHref(item.href, locale)} key={item.href}>
                <h3>{item.label[locale]}</h3>
                <p>{item.description[locale]}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
