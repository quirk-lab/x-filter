import { ArrowRight, BookOpen, Boxes, PlaySquare, Share2, Terminal, Workflow } from 'lucide-react';
import Link from 'next/link';
import type { Locale } from '../../site/locales';
import { docsNav, localizeHref } from '../../site/routes';
import { AdapterParityDemo } from '../demos/adapter-parity-demo';

const copy = {
  en: {
    eyebrow: 'Composable query UI',
    headline: 'X-Filter',
    lede: 'Build typed filter builders once, render them through product-native adapters, and keep JSON, DSL, validation, and SQL output in sync.',
    docs: 'Read the docs',
    demo: 'Open playground',
    metrics: [
      ['Core first', 'Portable filter state'],
      ['2 adapters', 'Ant Design and shadcn'],
      ['Static docs', 'Vercel-ready export'],
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
    headline: 'X-Filter',
    lede: '一次构建类型化过滤器，再通过产品原生适配器渲染，并让 JSON、DSL、校验和 SQL 输出保持同步。',
    docs: '阅读文档',
    demo: '打开演练场',
    metrics: [
      ['核心优先', '可移植过滤器状态'],
      ['2 个适配器', 'Ant Design 与 shadcn'],
      ['静态文档', '面向 Vercel 导出'],
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
      <section className="hero">
        <div className="content-shell hero-grid">
          <div className="hero-copy">
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
          <div className="hero-visual">
            <AdapterParityDemo locale={locale} />
          </div>
        </div>
      </section>
      <section className="page-section page-section--surface">
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
      <section className="page-section">
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
