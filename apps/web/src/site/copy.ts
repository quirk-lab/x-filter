import type { Locale } from './locales';

export const siteCopy = {
  en: {
    skip: 'Skip to content',
    repository: 'GitHub',
    language: 'Language',
    menu: 'Menu',
    closeMenu: 'Close menu',
    footer:
      'X-Filter is a composable filter builder toolkit for React products that need portable query state.',
  },
  zh: {
    skip: '跳到正文',
    repository: 'GitHub',
    language: '语言',
    menu: '菜单',
    closeMenu: '关闭菜单',
    footer: 'X-Filter 是面向 React 产品的可组合过滤器构建工具包，用于沉淀可移植查询状态。',
  },
} satisfies Record<Locale, Record<string, string>>;
