import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SiteChrome } from '../../src/components/site/site-chrome';
import '../../src/styles/globals.css';

const description = 'Composable filter builders for React products.';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://x-filter.vercel.app'),
  title: {
    default: 'X-Filter',
    template: '%s | X-Filter',
  },
  description,
  openGraph: {
    title: 'X-Filter',
    description,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'X-Filter',
    description,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
