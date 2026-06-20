# Contract: Package Structure Specification

**Feature**: 002-monorepo-init  
**Created**: 2026-01-01  
**Version**: 1.1.0

---

## Overview

本文档定义 x-filter Monorepo 中包的结构规范和配置标准。

---

## 1. package.json 规范

### Library Package

```json
{
  "name": "@x-filter/{package-name}",
  "version": "0.0.0",
  "private": true,
  "type": "module",
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
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "lint": "biome lint src",
    "format": "biome format src --write",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {},
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.6.0"
  },
  "peerDependencies": {}
}
```

### Application Package

```json
{
  "name": "@x-filter/{app-name}",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "biome lint src",
    "format": "biome format src --write",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {},
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.6.0",
    "vite": "^5.4.0"
  }
}
```

---

## 2. tsconfig.json 规范

### Library Package

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Application Package

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "noEmit": true
  },
  "include": ["src/**/*", "vite-env.d.ts"],
  "exclude": ["node_modules", "dist"]
}
```

---

## 3. tsup.config.ts 规范

### Standard Library

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  minify: false,
});
```

### React Library (带 peerDependencies)

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  minify: false,
  external: ['react', 'react-dom'], // 排除 peerDeps
});
```

### UI Library (带外部 UI 框架)

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  minify: false,
  external: ['react', 'react-dom', 'antd'], // 或 tailwindcss 等
});
```

---

## 4. vite.config.ts 规范

### Standard Application

```typescript
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
});
```

---

## 5. 目录结构规范

### Library Package

```
packages/{name}/
├── src/
│   └── index.ts        # 必须: 入口文件
├── dist/               # 构建产物 (gitignore)
├── package.json        # 必须: 包配置
├── tsconfig.json       # 必须: TS 配置
├── tsup.config.ts      # 必须: 构建配置
└── README.md           # 必须: 文档
```

### Application Package

```
apps/{name}/
├── src/
│   ├── main.tsx        # 必须: 入口
│   └── App.tsx         # 必须: 根组件
├── public/             # 静态资源
├── index.html          # 必须: HTML 模板
├── package.json        # 必须: 包配置
├── tsconfig.json       # 必须: TS 配置
├── vite.config.ts      # 必须: Vite 配置
└── README.md           # 必须: 文档
```

---

## 6. 命名规范

| Category | Convention | Example |
|----------|-----------|---------|
| 包名 | `@x-filter/{name}` | `@x-filter/core` |
| 文件名 | kebab-case | `filter-builder.ts` |
| 组件名 | PascalCase | `FilterBuilder` |
| 函数名 | camelCase | `useFilter` |
| 常量名 | UPPER_SNAKE_CASE | `DEFAULT_CONFIG` |
| 类型名 | PascalCase | `FilterNode` |

---

## 7. Workspace 依赖规范

### 内部依赖

```json
{
  "dependencies": {
    "@x-filter/core": "workspace:*"
  }
}
```

### 外部依赖层级

| Package | Allowed Dependencies |
|---------|---------------------|
| core | 无内部依赖 |
| react | core + React (peer) |
| shadcn | react + Tailwind/Shadcn (peer) |
| antd | react + Antd (peer) |
| apps | 任意 @x-filter/* 包 |

---

## 8. Git Conventions

### .gitignore 条目

```gitignore
# Build outputs
dist/
*.tsbuildinfo

# Dependencies
node_modules/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
```

### 分支命名

```
{issue-number}-{feature-name}
```

Example: `002-monorepo-init`

---

## 9. 变更记录

### v1.1.0 — 2026-06-20

- **移除 `@x-filter/utils` 包层级。** 该包导出 `isNil`/`isDefined`，但全仓零源码导入，属死代码。同步删除 `packages/utils/` 目录及 `tsconfig.json` 项目引用、`jest.config.js` project、`CODEOWNERS` 规则。
- **修正 `core` 依赖声明。** 原契约 §7 声明 `core → utils only`，但 `packages/core/package.json` 从未声明该依赖（T014 标记完成但实际未执行）。现改为 `core → 无内部依赖`，契约与代码对齐。
- **不预留共享工具层。** 未来跨包共享的工具函数先内联，待真实重复痛点积累后再建 `@x-filter/shared`，避免重蹈"预留即死代码"的覆辙。
