'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import type { Locale } from '../../site/locales';
import { docsNav, localizeHref } from '../../site/routes';

export function DocsFrame({ children, locale }: { children: ReactNode; locale: Locale }) {
  const pathname = usePathname() || '/';

  return (
    <section className="page-section">
      <div className="content-shell docs-layout">
        <nav
          aria-label={locale === 'en' ? 'Documentation navigation' : '文档导航'}
          className="docs-sidebar"
        >
          {docsNav.map((item) => (
            <Link
              aria-current={pathname === localizeHref(item.href, locale) ? 'page' : undefined}
              href={localizeHref(item.href, locale)}
              key={item.href}
            >
              {item.label[locale]}
            </Link>
          ))}
        </nav>
        <article className="prose">{children}</article>
      </div>
    </section>
  );
}
