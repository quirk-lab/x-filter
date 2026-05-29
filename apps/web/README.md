# @x-filter/web

Static documentation website and interactive demo for X-Filter.

The site uses Next.js static export with MDX compiled by Nextra. English routes are the default path, and Chinese routes live under `/zh` so the build stays compatible with `output: "export"`.

## 开发

```bash
pnpm --filter @x-filter/web dev
```

## 构建

```bash
pnpm --filter @x-filter/web... build
```

The filtered build compiles workspace dependencies first, then writes static output to `apps/web/out`.

## Preview

```bash
pnpm --filter @x-filter/web preview
```

## Vercel

Use the repository root as the Vercel project directory. The root `vercel.json` points Vercel at this app and its static output directory.
