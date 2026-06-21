'use client';

import {
  BookOpen,
  Braces,
  GitBranch,
  Languages,
  Menu,
  PanelLeftClose,
  PlaySquare,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { siteCopy } from '../../site/copy';
import type { Locale } from '../../site/locales';
import {
  getAlternateLocalePath,
  getLocaleFromPath,
  localeLabels,
  stripLocaleFromPath,
} from '../../site/locales';
import { docsNav, localizeHref, primaryNav } from '../../site/routes';

const navIcons = [BookOpen, PlaySquare, Braces];
const knownLocalizedPaths = new Set([
  '/',
  ...primaryNav.map((item) => item.href),
  ...docsNav.map((item) => item.href),
]);

function isActive(pathname: string, href: string, locale: Locale) {
  const localizedHref = localizeHref(href, locale);
  if (localizedHref === '/') return pathname === localizedHref;
  return pathname === localizedHref || pathname.startsWith(`${localizedHref}/`);
}

function getLanguageHref(pathname: string, targetLocale: Locale) {
  const unlocalizedPath = stripLocaleFromPath(pathname);

  if (!knownLocalizedPaths.has(unlocalizedPath)) {
    return localizeHref('/', targetLocale);
  }

  return getAlternateLocalePath(pathname, targetLocale);
}

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/';
  const locale = getLocaleFromPath(pathname);
  const targetLocale = locale === 'en' ? 'zh' : 'en';
  const copy = siteCopy[locale];
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <a className="skip-link" href="#main-content">
        {copy.skip}
      </a>
      <header className="site-header">
        <div className="site-header__inner">
          <Link aria-label="X-Filter home" className="brand" href={localizeHref('/', locale)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" className="brand-mark" height={28} src="/logo.png" width={28} />
            <span className="brand-text">X-Filter</span>
          </Link>
          <nav aria-label="Primary navigation" className="site-nav">
            {primaryNav.map((item, index) => {
              const Icon = navIcons[index] ?? BookOpen;
              const active = isActive(pathname, item.href, locale);
              return (
                <Link
                  aria-current={active ? 'page' : undefined}
                  className={active ? 'site-nav__link is-active' : 'site-nav__link'}
                  href={localizeHref(item.href, locale)}
                  key={item.href}
                >
                  <Icon aria-hidden="true" size={16} />
                  {item.label[locale]}
                </Link>
              );
            })}
          </nav>
          <div className="site-actions">
            <Link
              aria-label={localeLabels[locale === 'en' ? 'zh' : 'en']}
              className="icon-button"
              href={getLanguageHref(pathname, targetLocale)}
              title={copy.language}
            >
              <Languages aria-hidden="true" size={18} />
            </Link>
            <a
              aria-label={copy.repository}
              className="icon-button"
              href="https://github.com/quirk-lab/x-filter"
              rel="noreferrer"
              target="_blank"
              title={copy.repository}
            >
              <GitBranch aria-hidden="true" size={18} />
            </a>
            <button
              aria-expanded={isMenuOpen}
              aria-label={isMenuOpen ? copy.closeMenu : copy.menu}
              className="icon-button mobile-menu-button"
              type="button"
              onClick={() => setIsMenuOpen((value) => !value)}
            >
              {isMenuOpen ? (
                <X aria-hidden="true" size={18} />
              ) : (
                <Menu aria-hidden="true" size={18} />
              )}
            </button>
          </div>
        </div>
        <nav
          aria-label="Mobile navigation"
          className={isMenuOpen ? 'mobile-nav is-open' : 'mobile-nav'}
        >
          {primaryNav.map((item) => (
            <Link
              className="mobile-nav__link"
              href={localizeHref(item.href, locale)}
              key={item.href}
              onClick={() => setIsMenuOpen(false)}
            >
              <PanelLeftClose aria-hidden="true" size={16} />
              <span>{item.label[locale]}</span>
              <small>{item.description[locale]}</small>
            </Link>
          ))}
        </nav>
      </header>
      <main id="main-content">{children}</main>
      <footer className="site-footer">
        <div className="site-footer__inner">
          <p>{copy.footer}</p>
          <div className="site-footer__links">
            <Link href={localizeHref('/docs/deployment', locale)}>
              {locale === 'en' ? 'Static export' : '静态导出'}
            </Link>
            <Link href={localizeHref('/playground', locale)}>
              {locale === 'en' ? 'Interactive demo' : '交互演示'}
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
