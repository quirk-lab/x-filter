import {
  getAlternateLocalePath,
  getLocaleFromPath,
  isLocale,
  stripLocaleFromPath,
  withLocale,
} from '../site/locales';

describe('locale route helpers', () => {
  test('checks supported locale identifiers', () => {
    expect(isLocale('en')).toBe(true);
    expect(isLocale('zh')).toBe(true);
    expect(isLocale('fr')).toBe(false);
  });

  test('detects English as the default locale without a path prefix', () => {
    expect(getLocaleFromPath('/')).toBe('en');
    expect(getLocaleFromPath('/docs/getting-started')).toBe('en');
  });

  test('detects Chinese from the zh path prefix', () => {
    expect(getLocaleFromPath('/zh')).toBe('zh');
    expect(getLocaleFromPath('/zh/docs/api')).toBe('zh');
  });

  test('strips only the explicit zh locale prefix', () => {
    expect(stripLocaleFromPath('/zh')).toBe('/');
    expect(stripLocaleFromPath('/zh/playground')).toBe('/playground');
    expect(stripLocaleFromPath('/zh/playground/')).toBe('/playground');
    expect(stripLocaleFromPath('/zh/')).toBe('/');
    expect(stripLocaleFromPath('/docs')).toBe('/docs');
    expect(stripLocaleFromPath('/docs/getting-started/')).toBe('/docs/getting-started');
    expect(stripLocaleFromPath('')).toBe('/');
  });

  test('builds localized paths without an English prefix', () => {
    expect(withLocale('/docs', 'en')).toBe('/docs');
    expect(withLocale('docs', 'en')).toBe('/docs');
    expect(withLocale('/docs', 'zh')).toBe('/zh/docs');
    expect(withLocale('/', 'zh')).toBe('/zh');
  });

  test('maps the current route to a target locale', () => {
    expect(getAlternateLocalePath('/docs/api', 'zh')).toBe('/zh/docs/api');
    expect(getAlternateLocalePath('/zh/docs/api', 'en')).toBe('/docs/api');
    expect(getAlternateLocalePath('/zh/playground/', 'en')).toBe('/playground');
  });
});
