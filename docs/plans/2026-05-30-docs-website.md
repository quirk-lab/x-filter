# Documentation Website Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild `apps/web` as a fully static, bilingual Nextra documentation website with a developer-first homepage, complete documentation, inline demos, and a full interactive playground.

**Architecture:** `apps/web` becomes a Next.js + Nextra static export site. Content is bilingual from the first release, with English as the default/source locale and Chinese as a complete parallel locale. Public demos live inside `apps/web` and reuse `@x-filter/core`, `@x-filter/react`, `@x-filter/antd`, and `@x-filter/shadcn` instead of embedding Storybook.

**Tech Stack:** Next.js, Nextra, Nextra Docs Theme, MDX, React 18, TypeScript, Jest, Testing Library, Vercel static hosting, pnpm workspaces.

---

## Ground Rules

- Use TDD for demo behavior and reusable logic.
- Preserve static export compatibility: no SSR, API routes, Server Actions, runtime redirects, or default Next image optimization.
- Keep English and Chinese pages in sync in the first version.
- Keep Storybook and `apps/playground` as development tools; do not route the public website to them.
- Use explicit language switch links; do not implement browser-language redirects.
- Commit after each task.
- Run targeted checks after each task, then full checks at the end.

## Task 1: Create Working Branch and Capture Baseline

**Files:**
- Read: `docs/plans/2026-05-30-docs-website-design.md`
- Read: `apps/web/package.json`
- Read: `jest.config.js`

**Step 1: Create the implementation branch**

```bash
git switch -c docs-website
```

Expected: branch `docs-website` is created from `main`.

**Step 2: Read the design**

```bash
sed -n '1,260p' docs/plans/2026-05-30-docs-website-design.md
```

Expected: the design confirms Nextra, static export, Vercel, complete bilingual docs, and adapter parity demos.

**Step 3: Run baseline checks**

```bash
pnpm --filter @x-filter/web typecheck
pnpm --filter @x-filter/web build
pnpm exec jest --selectProjects web --runInBand
```

Expected:

- Current web typecheck passes.
- Current Vite web build passes.
- The web Jest project has no tests or passes existing tests.

**Step 4: Commit**

No commit is required for this task unless baseline files change.

## Task 2: Replace the Web Toolchain with Next.js and Nextra

**Files:**
- Modify: `apps/web/package.json`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Delete: `apps/web/index.html`
- Delete: `apps/web/vite.config.ts`
- Delete: `apps/web/src/main.tsx`
- Create: `apps/web/next-env.d.ts`
- Create: `apps/web/next.config.mjs`
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/app/page.tsx`
- Create: `apps/web/mdx-components.tsx`
- Create: `apps/web/src/styles/globals.css`

**Step 1: Update app dependencies**

Replace `apps/web/package.json` scripts and dependencies with a Next/Nextra setup:

```json
{
  "name": "@x-filter/web",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "preview": "npx serve@latest out",
    "lint": "biome lint .",
    "format": "biome format . --write",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@x-filter/antd": "workspace:*",
    "@x-filter/core": "workspace:*",
    "@x-filter/react": "workspace:*",
    "@x-filter/shadcn": "workspace:*",
    "antd": "^5.0.0",
    "next": "^15.0.0",
    "nextra": "^4.0.0",
    "nextra-theme-docs": "^4.0.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  }
}
```

If current Nextra peer dependencies require a newer compatible Next major, update `next`, `nextra`,
and `nextra-theme-docs` together. Do not upgrade root React unless package peer requirements force
it and full repository tests still pass.

**Step 2: Install**

```bash
pnpm install --registry=https://registry.npmjs.org
```

Expected: lockfile updates without unresolved peer dependency failures.

**Step 3: Remove Vite entry files**

Delete:

```bash
apps/web/index.html
apps/web/vite.config.ts
apps/web/src/main.tsx
```

**Step 4: Add static Next config**

Create `apps/web/next.config.mjs`:

```js
import nextra from 'nextra';

const withNextra = nextra({
  search: {
    codeblocks: false,
  },
});

export default withNextra({
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  reactStrictMode: true,
});
```

Adjust the Nextra options only if the installed Nextra major requires a different config shape.

**Step 5: Add minimal layout and page**

Create `apps/web/app/layout.tsx`:

```tsx
import type { ReactNode } from 'react';
import '../src/styles/globals.css';

export const metadata = {
  title: 'X-Filter',
  description: 'Composable filter builders for React products.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

Create `apps/web/app/page.tsx`:

```tsx
export default function HomePage() {
  return <main>X-Filter documentation website</main>;
}
```

Create `apps/web/mdx-components.tsx`:

```tsx
import type { MDXComponents } from 'mdx/types';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return components;
}
```

Create `apps/web/src/styles/globals.css`:

```css
:root {
  color-scheme: light dark;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
```

**Step 6: Verify static build**

```bash
pnpm --filter @x-filter/web typecheck
pnpm --filter @x-filter/web build
```

Expected: typecheck passes and `apps/web/out` is generated.

**Step 7: Commit**

```bash
git add apps/web package.json pnpm-lock.yaml
git commit -m "chore: convert web app to nextra"
```

## Task 3: Add Static Bilingual Routing and Docs Shell

**Files:**
- Create: `apps/web/src/site/locales.ts`
- Create: `apps/web/src/site/routes.ts`
- Create: `apps/web/src/site/page-map.ts`
- Create: `apps/web/app/[[...mdxPath]]/page.tsx`
- Create: `apps/web/app/zh/[[...mdxPath]]/page.tsx`
- Create: `apps/web/content/en/index.mdx`
- Create: `apps/web/content/en/docs/index.mdx`
- Create: `apps/web/content/en/playground.mdx`
- Create: `apps/web/content/en/changelog.mdx`
- Create: `apps/web/content/zh/index.mdx`
- Create: `apps/web/content/zh/docs/index.mdx`
- Create: `apps/web/content/zh/playground.mdx`
- Create: `apps/web/content/zh/changelog.mdx`
- Modify: `apps/web/app/layout.tsx`
- Delete: `apps/web/app/page.tsx`

**Step 1: Write locale tests**

Create `apps/web/src/__tests__/locale-routing.spec.ts`:

```ts
import { getAlternateLocalePath, isLocale, locales } from '../site/locales';

describe('locale routing', () => {
  it('defines English as default and Chinese as secondary locale', () => {
    expect(locales.defaultLocale).toBe('en');
    expect(locales.supported).toEqual(['en', 'zh']);
  });

  it('recognizes supported locales', () => {
    expect(isLocale('en')).toBe(true);
    expect(isLocale('zh')).toBe(true);
    expect(isLocale('fr')).toBe(false);
  });

  it('maps equivalent language switch paths', () => {
    expect(getAlternateLocalePath('/docs/getting-started', 'zh')).toBe(
      '/zh/docs/getting-started'
    );
    expect(getAlternateLocalePath('/zh/docs/getting-started', 'en')).toBe(
      '/docs/getting-started'
    );
    expect(getAlternateLocalePath('/', 'zh')).toBe('/zh');
    expect(getAlternateLocalePath('/zh', 'en')).toBe('/');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm exec jest --selectProjects web --runInBand apps/web/src/__tests__/locale-routing.spec.ts
```

Expected: FAIL because `src/site/locales.ts` does not exist.

**Step 3: Implement locale helpers**

Create `apps/web/src/site/locales.ts`:

```ts
export type Locale = 'en' | 'zh';

export const locales = {
  defaultLocale: 'en' as const,
  supported: ['en', 'zh'] as const,
};

export function isLocale(value: string): value is Locale {
  return locales.supported.includes(value as Locale);
}

export function stripLocalePrefix(pathname: string): string {
  if (pathname === '/zh') return '/';
  if (pathname.startsWith('/zh/')) return pathname.slice(3) || '/';
  return pathname || '/';
}

export function getAlternateLocalePath(pathname: string, targetLocale: Locale): string {
  const path = stripLocalePrefix(pathname);
  if (targetLocale === 'en') return path;
  return path === '/' ? '/zh' : `/zh${path}`;
}
```

**Step 4: Add route metadata**

Create `apps/web/src/site/routes.ts`:

```ts
export const docsRoutes = [
  'getting-started',
  'core-concepts',
  'adapters',
  'guides',
  'api',
  'examples',
  'migration',
  'contributing',
] as const;
```

**Step 5: Add Nextra catch-all routes**

Create a catch-all app route for English default pages and a matching route under `/zh`.
Delete the temporary `apps/web/app/page.tsx` from Task 2 before adding the English catch-all route,
otherwise the root page and catch-all route will conflict.

The exact Nextra helper API can differ between Nextra major versions. Use the installed Nextra
version's official App Router example, but preserve this public route contract:

- English content under `content/en` renders at `/`, `/docs`, `/playground`, and `/changelog`.
- Chinese content under `content/zh` renders at `/zh`, `/zh/docs`, `/zh/playground`, and
  `/zh/changelog`.

Implementation shape should be equivalent to:

```tsx
import { importPage } from 'nextra/pages';

export async function generateStaticParams() {
  return [
    { mdxPath: [] },
    { mdxPath: ['docs'] },
    { mdxPath: ['playground'] },
    { mdxPath: ['changelog'] },
  ];
}

export default async function MdxPage({ params }: { params: { mdxPath?: string[] } }) {
  const { default: MDXContent } = await importPage(params.mdxPath ?? [], 'en');
  return <MDXContent />;
}
```

If the current Nextra API requires a different helper, use that helper and update
`apps/web/README.md` later with the chosen structure.

**Step 6: Add placeholder MDX content**

Create English MDX placeholders. Example `apps/web/content/en/index.mdx`:

```mdx
# X-Filter

Composable filter builders for React products.
```

Create Chinese MDX placeholders. Example `apps/web/content/zh/index.mdx`:

```mdx
# X-Filter

面向 React 产品的可组合筛选构建器。
```

**Step 7: Run tests and build**

```bash
pnpm exec jest --selectProjects web --runInBand apps/web/src/__tests__/locale-routing.spec.ts
pnpm --filter @x-filter/web typecheck
pnpm --filter @x-filter/web build
```

Expected: test, typecheck, and static build pass.

**Step 8: Commit**

```bash
git add apps/web
git commit -m "feat: add bilingual static routes"
```

## Task 4: Add Shared Layout, Navigation, and Language Switcher

**Files:**
- Create: `apps/web/src/components/site/site-layout.tsx`
- Create: `apps/web/src/components/site/language-switcher.tsx`
- Create: `apps/web/src/components/site/main-nav.tsx`
- Create: `apps/web/src/components/site/footer.tsx`
- Create: `apps/web/src/components/site/__tests__/language-switcher.spec.tsx`
- Modify: `apps/web/app/layout.tsx`
- Modify: `apps/web/app/[[...mdxPath]]/page.tsx`
- Modify: `apps/web/app/zh/[[...mdxPath]]/page.tsx`

**Step 1: Write language switcher test**

Create `apps/web/src/components/site/__tests__/language-switcher.spec.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { LanguageSwitcher } from '../language-switcher';

describe('LanguageSwitcher', () => {
  it('links to the equivalent Chinese route from English', () => {
    render(<LanguageSwitcher locale="en" pathname="/docs/getting-started" />);
    expect(screen.getByRole('link', { name: '中文' })).toHaveAttribute(
      'href',
      '/zh/docs/getting-started'
    );
  });

  it('links to the equivalent English route from Chinese', () => {
    render(<LanguageSwitcher locale="zh" pathname="/zh/docs/getting-started" />);
    expect(screen.getByRole('link', { name: 'English' })).toHaveAttribute(
      'href',
      '/docs/getting-started'
    );
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm exec jest --selectProjects web --runInBand apps/web/src/components/site/__tests__/language-switcher.spec.tsx
```

Expected: FAIL because the component does not exist.

**Step 3: Implement `LanguageSwitcher`**

Create `apps/web/src/components/site/language-switcher.tsx`:

```tsx
import type { Locale } from '../../site/locales';
import { getAlternateLocalePath } from '../../site/locales';

export function LanguageSwitcher({ locale, pathname }: { locale: Locale; pathname: string }) {
  const targetLocale = locale === 'en' ? 'zh' : 'en';
  const label = targetLocale === 'en' ? 'English' : '中文';

  return <a href={getAlternateLocalePath(pathname, targetLocale)}>{label}</a>;
}
```

**Step 4: Implement site layout components**

Create `main-nav.tsx`, `footer.tsx`, and `site-layout.tsx` with simple semantic markup:

- Header contains brand, Docs, Playground, Changelog, and language switcher.
- Main wraps page content.
- Footer links to GitHub and docs.
- Use `locale` and `pathname` props; do not depend on Next server runtime.
- Wrap page content with the Nextra Docs Theme `Layout` or the current Nextra equivalent so MDX
  pages get docs navigation, search, table of contents, theme support, and consistent docs chrome.

**Step 5: Apply layout to route pages**

Wrap MDX catch-all routes with `SiteLayout`. Keep routes compatible with static export.

**Step 6: Verify**

```bash
pnpm exec jest --selectProjects web --runInBand apps/web/src/components/site/__tests__/language-switcher.spec.tsx
pnpm --filter @x-filter/web typecheck
pnpm --filter @x-filter/web build
```

Expected: all pass.

**Step 7: Commit**

```bash
git add apps/web
git commit -m "feat: add docs site layout"
```

## Task 5: Add Bilingual Content Copy Model

**Files:**
- Create: `apps/web/src/content/copy.ts`
- Create: `apps/web/src/content/docs.ts`
- Create: `apps/web/src/content/__tests__/content-coverage.spec.ts`
- Modify: `apps/web/content/en/**/*.mdx`
- Modify: `apps/web/content/zh/**/*.mdx`

**Step 1: Write content coverage tests**

Create `apps/web/src/content/__tests__/content-coverage.spec.ts`:

```ts
import { homepageContent } from '../copy';
import { docsContent } from '../docs';
import { docsRoutes } from '../../site/routes';

describe('bilingual content coverage', () => {
  it('has homepage copy for both languages', () => {
    expect(homepageContent.en.hero.title).toBeTruthy();
    expect(homepageContent.zh.hero.title).toBeTruthy();
  });

  it('has every docs route in both languages', () => {
    for (const route of docsRoutes) {
      expect(docsContent.en[route]).toBeDefined();
      expect(docsContent.zh[route]).toBeDefined();
    }
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm exec jest --selectProjects web --runInBand apps/web/src/content/__tests__/content-coverage.spec.ts
```

Expected: FAIL because content files do not exist.

**Step 3: Implement content files**

Create `apps/web/src/content/copy.ts` with typed English and Chinese copy for:

- Homepage hero.
- Homepage install block.
- Homepage CTAs.
- Playground labels.
- Changelog labels.

Create `apps/web/src/content/docs.ts` with page metadata and short body sections for each docs route.

Keep first content concise. Use accurate pre-release wording:

```ts
export const releaseStatus = {
  en: 'Pre-release documentation for upcoming npm packages.',
  zh: '面向即将发布的 npm 包的预发布文档。',
};
```

**Step 4: Replace MDX placeholders with content**

Use MDX files for long-form page body content. Keep `copy.ts` for reusable localized UI labels,
homepage snippets, demo labels, and testable metadata.

Update the MDX placeholders under `content/en` and `content/zh` so they render the first real
homepage, docs index, playground page, and changelog page.

**Step 5: Verify**

```bash
pnpm exec jest --selectProjects web --runInBand apps/web/src/content/__tests__/content-coverage.spec.ts
pnpm --filter @x-filter/web typecheck
pnpm --filter @x-filter/web build
```

Expected: tests and static build pass.

**Step 6: Commit**

```bash
git add apps/web
git commit -m "docs: add bilingual website content"
```

## Task 6: Build Demo Data and Output Helpers

**Files:**
- Create: `apps/web/src/demos/demo-data.ts`
- Create: `apps/web/src/demos/output.ts`
- Create: `apps/web/src/demos/__tests__/output.spec.ts`

**Step 1: Write output helper tests**

Create `apps/web/src/demos/__tests__/output.spec.ts`:

```ts
import { createTicketPreset } from '../demo-data';
import { getDemoOutputs } from '../output';

describe('demo outputs', () => {
  it('formats JSON, DSL, SQL, and validation from the ticket preset', () => {
    const preset = createTicketPreset();
    const output = getDemoOutputs(preset.filter, preset.schema);

    expect(output.json).toContain('"conditions"');
    expect(output.dsl).toContain('status');
    expect(output.sql.sql).toContain('status');
    expect(output.validation.valid).toBe(true);
  });

  it('returns validation errors for invalid presets without throwing', () => {
    const preset = createTicketPreset();
    const invalidFilter = {
      ...preset.filter,
      conditions: [{ id: 'invalid', field: 'missing', operator: 'equals', value: 'x' }],
    };

    const output = getDemoOutputs(invalidFilter, preset.schema);

    expect(output.validation.valid).toBe(false);
    expect(output.errors.length).toBeGreaterThan(0);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm exec jest --selectProjects web --runInBand apps/web/src/demos/__tests__/output.spec.ts
```

Expected: FAIL because demo helpers do not exist.

**Step 3: Implement demo data**

Create `apps/web/src/demos/demo-data.ts`:

- Export `createTicketPreset()`.
- Include fields: `status`, `priority`, `assignee`, `createdAt`, `tags`, `isEscalated`.
- Include a valid starting `Filter`.
- Use operators that exist in `@x-filter/core` SQL output.

**Step 4: Implement output helper**

Create `apps/web/src/demos/output.ts`:

```ts
import { formatDSL, toSQL, validate } from '@x-filter/core';
import type { FieldSchema, Filter, SQLResult, ValidationResult } from '@x-filter/core';

export type DemoOutputs = {
  json: string;
  dsl: string;
  sql: SQLResult;
  validation: ValidationResult;
  errors: string[];
};

export function getDemoOutputs(filter: Filter, schema: FieldSchema[]): DemoOutputs {
  const errors: string[] = [];
  const validation = validate(filter, schema);
  let dsl = '';
  let sql: SQLResult = { sql: '', params: [] };

  try {
    dsl = formatDSL(filter);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  try {
    sql = toSQL(filter);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  return {
    json: JSON.stringify(filter, null, 2),
    dsl,
    sql,
    validation,
    errors,
  };
}
```

**Step 5: Verify**

```bash
pnpm exec jest --selectProjects web --runInBand apps/web/src/demos/__tests__/output.spec.ts
pnpm --filter @x-filter/web typecheck
```

Expected: tests and typecheck pass.

**Step 6: Commit**

```bash
git add apps/web/src/demos
git commit -m "feat: add docs demo output model"
```

## Task 7: Build Output Panel and Code Preview Components

**Files:**
- Create: `apps/web/src/components/demos/output-panel.tsx`
- Create: `apps/web/src/components/demos/code-preview.tsx`
- Create: `apps/web/src/components/demos/__tests__/output-panel.spec.tsx`

**Step 1: Write output panel tests**

Create `apps/web/src/components/demos/__tests__/output-panel.spec.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { createTicketPreset } from '../../../demos/demo-data';
import { getDemoOutputs } from '../../../demos/output';
import { OutputPanel } from '../output-panel';

describe('OutputPanel', () => {
  it('renders JSON, DSL, SQL, and validation output', () => {
    const preset = createTicketPreset();
    render(<OutputPanel locale="en" output={getDemoOutputs(preset.filter, preset.schema)} />);

    expect(screen.getByText('Filter JSON')).toBeInTheDocument();
    expect(screen.getByText('DSL')).toBeInTheDocument();
    expect(screen.getByText('SQL')).toBeInTheDocument();
    expect(screen.getByText('Validation')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm exec jest --selectProjects web --runInBand apps/web/src/components/demos/__tests__/output-panel.spec.tsx
```

Expected: FAIL because `OutputPanel` does not exist.

**Step 3: Implement components**

`OutputPanel` renders simple tabs or stacked sections. If tabs add unnecessary complexity, render
stacked sections first.

`CodePreview` renders a title, optional description, and a copyable code block. Copy behavior can be
added later; first version may render a regular code block.

**Step 4: Verify**

```bash
pnpm exec jest --selectProjects web --runInBand apps/web/src/components/demos/__tests__/output-panel.spec.tsx
pnpm --filter @x-filter/web typecheck
```

Expected: tests and typecheck pass.

**Step 5: Commit**

```bash
git add apps/web/src/components/demos
git commit -m "feat: add docs output components"
```

## Task 8: Build Adapter Parity Demo

**Files:**
- Create: `apps/web/src/components/demos/adapter-parity-demo.tsx`
- Create: `apps/web/src/components/demos/__tests__/adapter-parity-demo.spec.tsx`
- Modify: `apps/web/content/en/index.mdx`
- Modify: `apps/web/content/zh/index.mdx`

**Step 1: Write interaction test**

Create `apps/web/src/components/demos/__tests__/adapter-parity-demo.spec.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { AdapterParityDemo } from '../adapter-parity-demo';

describe('AdapterParityDemo', () => {
  it('renders both adapters and live outputs', () => {
    render(<AdapterParityDemo locale="en" />);

    expect(screen.getByText('Ant Design')).toBeInTheDocument();
    expect(screen.getByText('shadcn')).toBeInTheDocument();
    expect(screen.getByText('Filter JSON')).toBeInTheDocument();
    expect(screen.getByText('DSL')).toBeInTheDocument();
  });

  it('updates output when a field changes', () => {
    render(<AdapterParityDemo locale="en" />);
    fireEvent.mouseDown(screen.getAllByRole('combobox', { name: /field/i })[0]);

    expect(screen.getByText('Filter JSON')).toBeInTheDocument();
  });
});
```

Keep the second test minimal because Ant Design select behavior can be verbose in jsdom. The goal is
to verify rendering and output wiring, not test Ant Design internals.

**Step 2: Run test to verify it fails**

```bash
pnpm exec jest --selectProjects web --runInBand apps/web/src/components/demos/__tests__/adapter-parity-demo.spec.tsx
```

Expected: FAIL because component does not exist.

**Step 3: Implement `AdapterParityDemo`**

Implementation requirements:

- Use one preset schema.
- Keep separate filter state for Ant Design and shadcn, or synchronize one filter into both adapters
  if controlled updates are stable.
- Render compact builders.
- Render `OutputPanel` for the active or shared filter.
- Catch errors at output helper boundary.
- Localize section labels.

**Step 4: Add demo to homepage**

Update English and Chinese homepages to render:

- Product statement.
- Pre-release install command.
- Minimal code snippet.
- `AdapterParityDemo`.

**Step 5: Verify**

```bash
pnpm exec jest --selectProjects web --runInBand apps/web/src/components/demos/__tests__/adapter-parity-demo.spec.tsx
pnpm --filter @x-filter/web typecheck
pnpm --filter @x-filter/web build
```

Expected: tests, typecheck, and static build pass.

**Step 6: Commit**

```bash
git add apps/web
git commit -m "feat: add adapter parity demo"
```

## Task 9: Build Full Playground Workbench

**Files:**
- Create: `apps/web/src/components/demos/playground-workbench.tsx`
- Create: `apps/web/src/components/demos/preset-selector.tsx`
- Create: `apps/web/src/components/demos/__tests__/playground-workbench.spec.tsx`
- Modify: `apps/web/content/en/playground.mdx`
- Modify: `apps/web/content/zh/playground.mdx`

**Step 1: Write workbench tests**

Create `apps/web/src/components/demos/__tests__/playground-workbench.spec.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { PlaygroundWorkbench } from '../playground-workbench';

describe('PlaygroundWorkbench', () => {
  it('renders preset selector, both adapters, and output tabs', () => {
    render(<PlaygroundWorkbench locale="en" />);

    expect(screen.getByText('Preset')).toBeInTheDocument();
    expect(screen.getByText('Ant Design')).toBeInTheDocument();
    expect(screen.getByText('shadcn')).toBeInTheDocument();
    expect(screen.getByText('Filter JSON')).toBeInTheDocument();
  });

  it('can reset the workbench', () => {
    render(<PlaygroundWorkbench locale="en" />);
    fireEvent.click(screen.getByRole('button', { name: /reset/i }));
    expect(screen.getByText('Filter JSON')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm exec jest --selectProjects web --runInBand apps/web/src/components/demos/__tests__/playground-workbench.spec.tsx
```

Expected: FAIL because workbench components do not exist.

**Step 3: Implement `PresetSelector`**

Keep presets simple:

- Tickets.
- Customers.
- Audit logs.

Each preset returns schema and initial filter.

**Step 4: Implement `PlaygroundWorkbench`**

Required UI:

- Preset selector.
- Reset button.
- Copy buttons for JSON, DSL, and SQL. If Clipboard API is not available, render disabled buttons
  or fall back to selecting text.
- Ant Design and shadcn builders.
- Output panel.

Do not implement arbitrary schema JSON editing.

**Step 5: Wire workbench routes**

Update `content/en/playground.mdx` and `content/zh/playground.mdx` to render localized titles and
`PlaygroundWorkbench`.

**Step 6: Verify**

```bash
pnpm exec jest --selectProjects web --runInBand apps/web/src/components/demos/__tests__/playground-workbench.spec.tsx
pnpm --filter @x-filter/web typecheck
pnpm --filter @x-filter/web build
```

Expected: tests, typecheck, and static build pass.

**Step 7: Commit**

```bash
git add apps/web
git commit -m "feat: add docs playground workbench"
```

## Task 10: Fill Documentation Pages with Inline Demos

**Files:**
- Create: `apps/web/content/en/docs/getting-started.mdx`
- Create: `apps/web/content/en/docs/core-concepts.mdx`
- Create: `apps/web/content/en/docs/adapters.mdx`
- Create: `apps/web/content/en/docs/guides.mdx`
- Create: `apps/web/content/en/docs/api.mdx`
- Create: `apps/web/content/en/docs/examples.mdx`
- Create: `apps/web/content/en/docs/migration.mdx`
- Create: `apps/web/content/en/docs/contributing.mdx`
- Create: matching `apps/web/content/zh/docs/*.mdx` files

**Step 1: Add missing docs route files**

For each docs route in `docsRoutes`, create an English and Chinese MDX file if missing.

**Step 2: Add focused content**

Each page needs:

- Title.
- Short lead.
- At least two useful sections.
- Code block where relevant.
- Inline demo where relevant.

Do not try to write exhaustive API reference by hand if generated references are not available. The
first version should be correct and useful, not encyclopedic.

**Step 3: Ensure Chinese parity**

For every English page, confirm the matching Chinese page exists and has equivalent structure.

**Step 4: Verify**

```bash
pnpm --filter @x-filter/web typecheck
pnpm --filter @x-filter/web build
```

Expected: static build includes all docs routes.

**Step 5: Commit**

```bash
git add apps/web
git commit -m "docs: add bilingual documentation pages"
```

## Task 11: Add Developer-Tool Visual Styling and Responsive Layout

**Files:**
- Modify: `apps/web/src/styles/globals.css`
- Modify: `apps/web/src/components/site/*.tsx`
- Modify: `apps/web/src/components/demos/*.tsx`

**Step 1: Define layout tokens**

Add CSS variables for:

- Text color.
- Muted text.
- Border.
- Panel background.
- Accent color.
- Code background.

Avoid a one-note palette. Keep styling quiet and work-focused.

**Step 2: Make fixed tool surfaces stable**

For demo builders and output panels:

- Use responsive grids.
- Set stable min/max widths.
- Use `overflow: auto` for code.
- Ensure button text does not overflow.
- Ensure mobile stacks vertically.

**Step 3: Verify in browser**

Run:

```bash
pnpm --filter @x-filter/web dev
```

Check:

- `/`
- `/zh`
- `/docs`
- `/zh/docs`
- `/playground`
- `/zh/playground`

Expected: no incoherent overlaps on desktop or mobile widths.

**Step 4: Verify build**

```bash
pnpm --filter @x-filter/web build
```

Expected: static build passes.

**Step 5: Commit**

```bash
git add apps/web
git commit -m "style: polish docs website layout"
```

## Task 12: Update Root Documentation and Scripts

**Files:**
- Modify: `README.md`
- Modify: `package.json`
- Modify: `apps/web/README.md`

**Step 1: Update root scripts**

Add scripts if useful:

```json
{
  "scripts": {
    "web": "pnpm --filter @x-filter/web dev",
    "web:build": "pnpm --filter @x-filter/web build"
  }
}
```

Keep existing `dev` pointing at playground unless intentionally changing the developer workflow.

**Step 2: Update root README**

Add:

- `apps/web` is the public documentation website.
- `pnpm web` starts docs website.
- `pnpm web:build` validates static export.
- `pnpm dev` still starts playground.
- `pnpm storybook` still starts Storybook.

**Step 3: Update `apps/web/README.md`**

Document:

- Static export requirement.
- Vercel deployment.
- Bilingual page requirement.
- No SSR/API routes.
- How to add demo components.

**Step 4: Verify**

```bash
pnpm check
pnpm --filter @x-filter/web typecheck
pnpm --filter @x-filter/web build
```

Expected: formatting, typecheck, and web build pass.

**Step 5: Commit**

```bash
git add README.md package.json apps/web/README.md
git commit -m "docs: document website workflow"
```

## Task 13: Full Verification

**Files:**
- No planned source changes.

**Step 1: Run full checks**

```bash
pnpm check
pnpm typecheck
pnpm test
pnpm --filter @x-filter/web build
pnpm build
pnpm audit --registry=https://registry.npmjs.org --audit-level=low
```

Expected:

- Biome check passes.
- All TypeScript projects pass.
- All Jest projects pass.
- Web static export passes.
- Full monorepo build passes.
- Audit reports no known vulnerabilities.

**Step 2: Inspect Git state**

```bash
git status --short --branch
git log --oneline -8 --decorate
```

Expected:

- Branch is ahead of base by implementation commits.
- Worktree is clean.

**Step 3: Manual static preview**

Run:

```bash
pnpm --filter @x-filter/web preview
```

Open the preview URL and check:

- `/`
- `/zh`
- `/docs`
- `/zh/docs`
- `/playground`
- `/zh/playground`

Expected:

- English and Chinese pages render.
- Language switch links map to equivalent pages.
- Homepage compact demo renders.
- Playground renders both adapters and outputs.
- No visible overlap on desktop or mobile.

**Step 4: Commit final fixes if needed**

If manual preview reveals issues, fix them in the smallest possible commit and rerun relevant checks.

**Step 5: Prepare for review**

```bash
git status --short --branch
```

Expected: clean worktree.

## Notes for Implementation

- The public route contract is more important than the internal Nextra content layout. If Nextra's
  current i18n implementation requires different file organization, preserve the public routes from
  the design and document the internal structure in `apps/web/README.md`.
- Static export compatibility is non-negotiable.
- Bilingual completeness is a release requirement for the first version.
- Prefer reliable button-based move controls in documentation demos instead of pointer-only drag.
