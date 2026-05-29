# Documentation Website Design

Date: 2026-05-30

## Goal

Rebuild `apps/web` into the public documentation website for X-Filter. The site should work as a
developer-first product website, a full documentation system, and an interactive demo surface.

The first version must be fully bilingual, with English as the source/default language and Chinese
as a complete parallel locale.

## Decisions

- Rebuild `apps/web` from the current Vite placeholder into a Nextra + Next.js static site.
- Deploy as a fully static Vercel site.
- Use English as the default locale and Chinese as the secondary locale.
- Implement every public page in both languages in the first version.
- Do not rely on runtime language redirects, API routes, SSR, Server Actions, or dynamic server
  behavior.
- Keep Storybook and the existing playground as development and validation tools, not as the public
  documentation surface.
- Build public demos directly inside `apps/web`, reusing workspace packages.
- Use adapter parity as the primary demo story: the same schema/filter drives Ant Design and shadcn
  adapters, with synchronized JSON, DSL, SQL, and validation output.

## Site Architecture

`apps/web` becomes a Nextra site backed by Next.js static export:

- `next.config.mjs` uses `output: 'export'`.
- `images.unoptimized` is enabled for static export compatibility.
- Search is static, preferably via Nextra/Pagefind.
- Locale switching is explicit through navigation.
- Automatic locale detection is out of scope because Nextra's proxy-based locale redirect is not
  compatible with static export.

References:

- Nextra static exports: <https://nextra.site/docs/guide/static-exports>
- Nextra i18n: <https://nextra.site/docs/guide/i18n>
- Next.js static exports: <https://nextjs.org/docs/app/guides/static-exports>

## Routes

### Global Routes

- `/`: English developer-first homepage.
- `/zh`: Chinese homepage.
- `/docs`: English documentation index.
- `/zh/docs`: Chinese documentation index.
- `/playground`: English full interactive workbench.
- `/zh/playground`: Chinese full interactive workbench.
- `/changelog`: English changelog.
- `/zh/changelog`: Chinese changelog.

### Documentation Sections

Each section must exist in both English and Chinese:

- `/docs/getting-started`
- `/docs/core-concepts`
- `/docs/adapters`
- `/docs/guides`
- `/docs/api`
- `/docs/examples`
- `/docs/migration`
- `/docs/contributing`

The Chinese routes mirror these under `/zh/docs/...`.

## Content Strategy

English is the source of truth. Chinese pages are complete translations with localized explanatory
copy, but API names, package names, type names, and code identifiers stay in English.

The package distribution status is "upcoming" or "pre-release". Installation examples should use
future public package names, such as:

```bash
pnpm add @x-filter/core @x-filter/react @x-filter/antd
```

Docs should avoid presenting the packages as stable unless the release status changes.

## Homepage Experience

The homepage should feel like a developer tool, not a marketing landing page.

First viewport content:

- A precise product statement, such as "Composable filter builders for React products."
- A pre-release install command.
- A minimal schema + controlled builder code sample.
- A compact adapter parity demo.
- Live output for JSON, DSL, SQL, and validation.
- Clear links to Docs and Playground.

The homepage should use restrained visual styling, dense but readable layout, and direct technical
copy.

## Documentation Experience

Documentation pages should combine explanatory MDX content with small focused demos.

Expected pages:

- Getting Started: installation, minimum schema, minimum controlled builder, inline JSON output.
- Core Concepts: schema, filter tree, rule, group, operator, controlled state.
- Adapters: React headless hooks, Ant Design adapter, shadcn adapter.
- Guides:
  - DSL editing.
  - SQL output.
  - Runtime validation.
  - Custom slots.
  - DnD and keyboard move controls.
  - Accessibility.
  - URL sync.
- API: core types/functions, React hooks, adapter props.
- Examples: copyable recipes and embedded focused demos.
- Migration: pre-release policy first; version migrations later.
- Contributing: local development, tests, build, release workflow.

## Demo Components

Public demos live in `apps/web/components/demos`.

Shared demo components:

- `AdapterParityDemo`: compact inline demo for docs and homepage.
- `PlaygroundWorkbench`: full `/playground` experience.
- `CodePreview`: installation and usage snippets.
- `OutputPanel`: JSON, DSL, SQL, and validation tabs.
- `PresetSelector`: chooses prepared schemas and filters.
- `ValidationDemo`: intentionally invalid filters with visible errors.
- `DslDemo`: parse/format examples and error display.

Demos should catch DSL/SQL/validation errors and render them as UI output instead of crashing.

## Playground Experience

`/playground` is the full interactive workbench.

Layout:

- Left: preset selector and configuration toggles.
- Center: Ant Design and shadcn builders side by side.
- Right: output tabs for Filter JSON, DSL, SQL, and Validation.
- Top actions: Reset, Load Example, Copy JSON, Copy DSL, Copy SQL.

Scope:

- Use preset schemas and filters in the first version.
- Do not implement arbitrary JSON schema editing in the first version.
- Allow toggling DSL and DnD where adapter support exists.
- Prefer button-based move controls for reliable documentation interaction.

## Bilingual Requirements

The first version must ship complete English and Chinese content:

- All public pages exist in both locales.
- Navigation, page titles, button labels, demo labels, and error messages are localized.
- Code samples keep English identifiers.
- The language switcher keeps users on equivalent pages when possible.
- No public page should be English-only in the first version.

## Out of Scope

- Server-side rendering.
- API routes.
- Server Actions.
- User accounts.
- Remote save/share backend.
- Runtime locale detection and redirect.
- Arbitrary schema JSON editor in the first version.
- Real documentation version duplication before a stable release exists.

## Testing Strategy

Required verification:

- `pnpm --filter @x-filter/web typecheck`
- `pnpm --filter @x-filter/web build`
- `pnpm typecheck`
- `pnpm test`

Recommended test coverage:

- Demo state changes update JSON, DSL, SQL, and validation output.
- Invalid filter presets render validation errors.
- Language switch links exist and point to matching routes.
- Homepage renders the primary code sample and compact demo.
- Playground renders preset selector, both adapters, and output tabs.

Manual/visual checks:

- English and Chinese homepage.
- English and Chinese docs index.
- English and Chinese playground.
- Desktop and mobile viewport layout.
- Static preview or Vercel preview after build.

## Delivery Sequence

1. Replace `apps/web` with Nextra/Next static site skeleton.
2. Configure static export, bilingual routing, theme, navigation, and language switcher.
3. Create the English content structure.
4. Create complete Chinese translations for all public pages.
5. Build shared demo primitives.
6. Build inline documentation demos.
7. Build `/playground` workbench.
8. Add tests for demo behavior and language routing.
9. Update root README with website development commands.
10. Run full verification and prepare the implementation branch for review.
