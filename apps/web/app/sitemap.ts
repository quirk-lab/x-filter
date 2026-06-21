import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://x-filter.vercel.app';

const routes = [
  '',
  '/docs',
  '/docs/getting-started',
  '/docs/adapters',
  '/docs/features',
  '/docs/dsl-sql',
  '/docs/api',
  '/docs/deployment',
  '/playground',
  '/changelog',
  '/zh',
  '/zh/docs',
  '/zh/docs/getting-started',
  '/zh/docs/adapters',
  '/zh/docs/features',
  '/zh/docs/dsl-sql',
  '/zh/docs/api',
  '/zh/docs/deployment',
  '/zh/playground',
  '/zh/changelog',
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date('2026-05-30'),
    changeFrequency: route.includes('changelog') ? 'monthly' : 'weekly',
    priority: route === '' || route === '/zh' ? 1 : 0.7,
  }));
}
