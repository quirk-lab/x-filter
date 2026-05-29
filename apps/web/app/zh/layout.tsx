import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SiteChrome } from '../../src/components/site/site-chrome';
import '../../src/styles/globals.css';
import 'antd/dist/reset.css';

const description = '面向 React 产品的可组合过滤器构建工具。';

export const metadata: Metadata = {
  metadataBase: new URL('https://x-filter.dev'),
  title: {
    default: 'X-Filter',
    template: '%s | X-Filter',
  },
  description,
  openGraph: {
    title: 'X-Filter',
    description,
    type: 'website',
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'X-Filter',
    description,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-Hans">
      <body>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
