import type { Locale } from './locales';
import { withLocale } from './locales';

export type NavItem = {
  label: Record<Locale, string>;
  href: string;
  description: Record<Locale, string>;
};

export const primaryNav: NavItem[] = [
  {
    label: { en: 'Docs', zh: '文档' },
    href: '/docs',
    description: {
      en: 'Install, model filters, and ship adapters.',
      zh: '安装、建模过滤器并交付适配器。',
    },
  },
  {
    label: { en: 'Playground', zh: '演练场' },
    href: '/playground',
    description: {
      en: 'Compare adapters and inspect outputs.',
      zh: '对比适配器并检查输出。',
    },
  },
  {
    label: { en: 'Changelog', zh: '更新日志' },
    href: '/changelog',
    description: {
      en: 'Track releases and compatibility notes.',
      zh: '跟踪发布和兼容性说明。',
    },
  },
];

export const docsNav: NavItem[] = [
  {
    label: { en: 'Overview', zh: '概览' },
    href: '/docs',
    description: {
      en: 'What X-Filter provides and how the packages fit together.',
      zh: 'X-Filter 提供什么，以及各包如何配合。',
    },
  },
  {
    label: { en: 'Getting Started', zh: '快速开始' },
    href: '/docs/getting-started',
    description: {
      en: 'Create a schema, render a builder, and validate the result.',
      zh: '创建 schema、渲染构建器并验证结果。',
    },
  },
  {
    label: { en: 'Adapters', zh: '适配器' },
    href: '/docs/adapters',
    description: {
      en: 'Use Ant Design and shadcn adapters over the same core state.',
      zh: '用同一份核心状态驱动 Ant Design 和 shadcn 适配器。',
    },
  },
  {
    label: { en: 'Features', zh: '特性' },
    href: '/docs/features',
    description: {
      en: 'IC mode, i18n, keyboard nav, responsive, presets, undo/redo, import, and query exports.',
      zh: 'IC 模式、i18n、键盘导航、响应式、预设、撤销/重做、导入和查询导出。',
    },
  },
  {
    label: { en: 'DSL and SQL', zh: 'DSL 与 SQL' },
    href: '/docs/dsl-sql',
    description: {
      en: 'Round-trip filters through text and parameterized SQL.',
      zh: '在文本 DSL 和参数化 SQL 之间转换过滤器。',
    },
  },
  {
    label: { en: 'API Reference', zh: 'API 参考' },
    href: '/docs/api',
    description: {
      en: 'Core types, helpers, React hooks, and adapter props.',
      zh: '核心类型、工具函数、React hooks 和适配器属性。',
    },
  },
  {
    label: { en: 'Deployment', zh: '部署' },
    href: '/docs/deployment',
    description: {
      en: 'Static export details for Vercel and immutable docs builds.',
      zh: '面向 Vercel 和不可变文档构建的静态导出细节。',
    },
  },
];

export function localizeHref(href: string, locale: Locale): string {
  return withLocale(href, locale);
}
