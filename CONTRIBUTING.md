# Contributing to X-Filter

Thanks for your interest in contributing! This guide covers setup, code style, testing, and the pull request process.

## Getting started

```bash
git clone https://github.com/quirk-lab/x-filter.git
cd x-filter
pnpm install
pnpm build
```

## Project structure

```
packages/
├── core/       # @x-filter/core — pure TS, zero deps
├── react/      # @x-filter/react — headless hooks
├── shadcn/     # @x-filter/shadcn — shadcn/Tailwind adapter
└── antd/       # @x-filter/antd — Ant Design adapter

apps/
├── playground/ # dev sandbox
├── storybook/  # component stories
└── web/        # docs site (Next.js static export)
```

Dependency flow: `core` → `react` → `shadcn`/`antd` → `apps`.

## Development commands

```bash
pnpm dev                    # start playground (Vite, port 5173)
pnpm storybook              # start Storybook
pnpm --filter @x-filter/web dev  # start docs site
pnpm build                  # build all packages + apps
pnpm test                   # run Jest test suite
pnpm typecheck              # TypeScript type checking
pnpm lint                   # Biome lint
pnpm format                 # Biome format (write)
pnpm check                  # Biome check (lint + format)
```

## Code style

- **Biome** handles linting and formatting. Pre-commit hooks (Husky + lint-staged) run `biome check --write` automatically on staged files — you don't need to format manually.
- **TypeScript strict mode** is enabled across all packages.
- Follow existing patterns in neighboring files. If you're adding a new component, look at how similar components are structured first.

## Testing

- Tests use **Jest**, **Testing Library**, and **jest-axe** (accessibility).
- Test files live next to source files as `*.spec.tsx` or `*.spec.ts`.
- We recommend writing a failing test first (TDD), but it's not mandatory.
- Reviewers may ask you to add tests if coverage drops significantly for the area you're changing.

## Changesets

Every PR that changes package behavior should include a changeset:

```bash
pnpm changeset
```

This prompts you to:
1. Select the affected package(s)
2. Choose bump type (`patch` / `minor` / `major`)
3. Write a short summary of the change

The generated `.changeset/*.md` file should be committed to your PR. A maintainer will run `pnpm version` to aggregate changesets and bump versions before publishing.

## Pull request process

1. **One feature/bug per PR.** Keep PRs focused.
2. **Include a changeset** if you're changing package behavior (see above).
3. **CI must pass.** The CI workflow runs lint, typecheck, test, and build on every PR.
4. **Two maintainer approvals** are required for `main` (see `.github/BRANCH_PROTECTION.md`).
5. **Linear history.** Rebase your branch onto `main` — don't introduce merge commits.

## Working with the codebase

- **Domain terminology:** Read `CONTEXT.md` for the glossary of filter domain terms.
- **Architecture decisions:** See `docs/adr/` for ADRs (Architecture Decision Records).
- **Layering:** `core` (pure TS) → `react` (hooks) → `shadcn`/`antd` (UI). Don't import UI packages from `core` or `react`.

## Reporting bugs / Requesting features

Open a [GitHub Issue](https://github.com/quirk-lab/x-filter/issues) with:
- A clear description of the problem or feature request
- Steps to reproduce (for bugs)
- Expected vs. actual behavior
- Your React version, adapter package, and browser (if relevant)

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
