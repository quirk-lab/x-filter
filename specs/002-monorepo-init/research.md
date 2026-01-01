# Research: Monorepo 初始化与基础设施

**Feature**: 002-monorepo-init  
**Created**: 2026-01-01  
**Status**: Complete

---

## Research Tasks

本文档记录 Phase 0 阶段的技术研究成果，解决实现计划中的技术未知项。

---

## 1. tsup 最佳实践

### Research Question
如何配置 tsup 以同时输出 ESM/CJS 格式并生成 `.d.ts` 类型定义？

### Findings

**Decision**: 采用标准 tsup 配置，启用 `dts` 插件和双格式输出

**Configuration Template**:
```typescript
// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false, // 库模式下禁用代码分割
  minify: false,    // 开发阶段不压缩，便于调试
});
```

**Key Points**:
- `dts: true` 自动调用 TypeScript 编译器生成 `.d.ts`
- `format: ['esm', 'cjs']` 输出双格式
- 输出文件命名: `index.mjs` (ESM), `index.js` (CJS), `index.d.ts` (Types)
- 需要安装 `tsup` 作为 devDependency

**package.json exports 配置**:
```json
{
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.mjs"
      },
      "require": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      }
    }
  }
}
```

**Rationale**: 
- tsup 是目前社区最推荐的 TypeScript 库构建工具
- 基于 esbuild，构建速度极快
- 配置简洁，默认即可满足大部分场景

**Alternatives Considered**:
- `tsc` + `rollup`: 配置复杂，构建慢
- `unbuild`: 功能类似但社区较小
- `vite library mode`: 更适合带资源的库

---

## 2. Biome 迁移策略

### Research Question
如何从 ESLint/Prettier 迁移到 Biome？需要哪些配置？

### Findings

**Decision**: 使用 Biome 官方推荐配置，启用 formatter 和 linter

**Configuration Template**:
```json
// biome.json
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedImports": "error",
        "noUnusedVariables": "warn"
      },
      "style": {
        "noNonNullAssertion": "warn"
      },
      "suspicious": {
        "noExplicitAny": "warn"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "es5",
      "semicolons": "always"
    }
  },
  "files": {
    "ignore": [
      "node_modules",
      "dist",
      "*.min.js",
      "coverage"
    ]
  }
}
```

**Migration Steps**:
1. 安装 Biome: `pnpm add -Dw @biomejs/biome`
2. 删除旧配置文件:
   - `.eslintrc.json`
   - `.eslintignore`
   - `.prettierrc`
   - `.prettierignore`
3. 创建 `biome.json`
4. 更新 `package.json` 脚本:
   ```json
   {
     "scripts": {
       "lint": "biome lint .",
       "format": "biome format . --write",
       "check": "biome check ."
     }
   }
   ```
5. 移除 ESLint/Prettier 依赖:
   ```bash
   pnpm remove eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin \
     eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-jsx-a11y prettier
   ```
6. 更新 Husky pre-commit hook

**Rationale**:
- Biome 集成 lint + format，减少工具链复杂度
- 性能显著优于 ESLint/Prettier 组合 (Rust 实现)
- 与 Constitution "Rigorous Code Quality Controls" 对齐

**Alternatives Considered**:
- 保留 ESLint/Prettier: 配置复杂，性能差
- oxlint: 仅 linter，无 formatter

---

## 3. pnpm Workspace 依赖管理

### Research Question
如何正确配置 workspace 内包间依赖？

### Findings

**Decision**: 使用 `workspace:*` 协议进行包间引用

**Configuration**:
```json
// packages/core/package.json
{
  "name": "@x-filter/core",
  "dependencies": {
    "@x-filter/utils": "workspace:*"
  }
}
```

**Key Points**:
- `workspace:*` 表示使用 workspace 内的最新版本
- 发布时 pnpm 会自动将 `workspace:*` 替换为实际版本号
- 确保 `pnpm-workspace.yaml` 正确配置:
  ```yaml
  packages:
    - packages/*
    - apps/*
  ```

**Build Order Consideration**:
由于存在依赖关系，构建需按顺序执行:
```
utils → core → react → shadcn/antd → apps
```

pnpm 的 `-r` 命令已自动处理拓扑排序:
```bash
pnpm -r run build  # 自动按依赖顺序构建
```

**Rationale**:
- pnpm workspace 是 Monorepo 管理的标准方案
- `workspace:*` 简化版本管理
- 自动拓扑排序构建顺序

---

## 4. Vite App 与 Workspace 包集成

### Research Question
如何在 Vite 应用中正确引用 workspace 内的库包？

### Findings

**Decision**: 利用 pnpm workspace 自动解析 + Vite optimizeDeps 配置

**Key Configuration**:
```typescript
// apps/playground/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      '@x-filter/core',
      '@x-filter/react',
      '@x-filter/shadcn',
      '@x-filter/antd',
    ],
  },
  server: {
    watch: {
      // 监听 packages 目录变化
      ignored: ['!**/node_modules/@x-filter/**'],
    },
  },
});
```

**HMR 配置**:
为实现修改 packages 代码时 playground 自动刷新：
1. 确保库包输出 source map
2. Vite 配置监听 packages 目录
3. 或使用 `workspace:*` + live reload 策略

**Rationale**:
- Vite 原生支持 ES 模块热更新
- pnpm workspace 已处理符号链接
- optimizeDeps 预构建依赖加速启动

---

## 5. GitHub Actions CI 配置

### Research Question
如何为 Monorepo 配置高效的 CI 流水线？

### Findings

**Decision**: 使用 pnpm 缓存 + 并行任务

**Configuration Template**:
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: ['**']
  pull_request:
    branches: ['**']

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v4
        with:
          version: 9
          
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Lint
        run: pnpm lint

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v4
        with:
          version: 9
          
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Build
        run: pnpm build
```

**Key Points**:
- 使用 `pnpm/action-setup@v4` 官方 Action
- 启用依赖缓存加速 CI
- lint 和 build 可并行执行
- `--frozen-lockfile` 确保锁文件一致性

**Rationale**:
- 符合 Spec 要求的全量触发策略
- lint/build 分离便于问题定位

---

## 6. Husky + Biome Pre-commit

### Research Question
如何配置 Husky 触发 Biome 检查？

### Findings

**Decision**: 使用 Husky + lint-staged 或直接 Biome check

**Option 1: 直接 Biome (推荐)**:
```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

pnpm biome check --staged --write
```

**Option 2: lint-staged**:
```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["biome check --write"]
  }
}
```

**Key Points**:
- Biome 内置 `--staged` 标志处理暂存文件
- `--write` 自动修复可修复的问题
- 无需额外安装 lint-staged

**Rationale**:
- Biome 原生支持 staged 文件检查
- 减少工具链依赖

---

## Summary

| Topic | Decision | Confidence |
|-------|----------|------------|
| 库构建工具 | tsup with ESM/CJS + dts | High |
| 代码规范 | Biome 替代 ESLint/Prettier | High |
| 包间依赖 | workspace:* 协议 | High |
| App 集成 | Vite + optimizeDeps | High |
| CI 配置 | pnpm 缓存 + 并行 jobs | High |
| Git Hooks | Husky + Biome check | High |

所有技术未知项已解决，可进入 Phase 1 设计阶段。
