export const DEFAULT_LOCALE = 'en';

export const LOCALES = ['en', 'zh'] as const;

export type Locale = (typeof LOCALES)[number];

export const localeLabels: Record<Locale, string> = {
  en: 'English',
  zh: '中文',
};

export function isLocale(value: string): value is Locale {
  return LOCALES.includes(value as Locale);
}

export function getLocaleFromPath(pathname: string): Locale {
  const firstSegment = pathname.split('/').filter(Boolean)[0];
  return firstSegment === 'zh' ? 'zh' : DEFAULT_LOCALE;
}

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

export function stripLocaleFromPath(pathname: string): string {
  if (pathname === '/zh') return '/';
  if (pathname.startsWith('/zh/')) return normalizePathname(pathname.slice(3));
  return normalizePathname(pathname);
}

export function withLocale(pathname: string, locale: Locale): string {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const basePath = stripLocaleFromPath(normalizedPath);

  if (locale === DEFAULT_LOCALE) {
    return basePath;
  }

  return basePath === '/' ? '/zh' : `/zh${basePath}`;
}

export function getAlternateLocalePath(pathname: string, locale: Locale): string {
  return withLocale(stripLocaleFromPath(pathname), locale);
}
