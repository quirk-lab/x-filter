# Quickstart: Monorepo 开发指南

**Feature**: 002-monorepo-init  
**Created**: 2026-01-01

---

## 前置条件

- Node.js 18+ 
- pnpm 9.x (`npm install -g pnpm`)
- Git

---

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/XFreeCoder/x-filter.git
cd x-filter
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 构建所有包

```bash
pnpm build
```

### 4. 启动开发环境

```bash
pnpm dev
```

浏览器访问 `http://localhost:5173` 查看 playground。

---

## 常用命令

| 命令 | 描述 |
|------|------|
| `pnpm install` | 安装所有依赖 |
| `pnpm build` | 构建所有 packages 和 apps |
| `pnpm dev` | 启动 playground 开发服务器 |
| `pnpm lint` | 使用 Biome 检查代码 |
| `pnpm format` | 使用 Biome 格式化代码 |
| `pnpm typecheck` | TypeScript 类型检查 |

---

## 包结构

```
x-filter/
├── packages/
│   ├── utils/      # @x-filter/utils - 工具函数
│   ├── core/       # @x-filter/core - 核心逻辑
│   ├── react/      # @x-filter/react - React 适配
│   ├── shadcn/     # @x-filter/shadcn - Shadcn UI
│   └── antd/       # @x-filter/antd - Ant Design
├── apps/
│   ├── playground/ # 开发调试应用
│   └── web/        # 官网 (空壳)
└── ...
```

---

## 开发单个包

### 进入包目录

```bash
cd packages/core
```

### 开发模式 (监听变化)

```bash
pnpm dev
```

### 构建

```bash
pnpm build
```

### 类型检查

```bash
pnpm typecheck
```

---

## 添加新包

### 1. 创建目录

```bash
mkdir -p packages/new-package/src
```

### 2. 初始化 package.json

```bash
cd packages/new-package
pnpm init
```

### 3. 复制配置文件

从现有包复制：
- `tsconfig.json`
- `tsup.config.ts`

### 4. 更新 package.json

```json
{
  "name": "@x-filter/new-package",
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
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "lint": "biome lint src",
    "format": "biome format src --write",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.6.0"
  }
}
```

### 5. 创建入口文件

```typescript
// src/index.ts
export function hello(): string {
  return 'Hello from new-package!';
}
```

### 6. 安装依赖

```bash
cd ../..  # 回到根目录
pnpm install
```

---

## 包间依赖

### 添加内部依赖

```bash
# 在 core 中添加对 utils 的依赖
cd packages/core
pnpm add @x-filter/utils
```

这会自动使用 `workspace:*` 协议：

```json
{
  "dependencies": {
    "@x-filter/utils": "workspace:*"
  }
}
```

### 使用内部依赖

```typescript
// packages/core/src/index.ts
import { someUtil } from '@x-filter/utils';

export function useSomeUtil() {
  return someUtil();
}
```

---

## 代码规范

### 运行 lint

```bash
pnpm lint
```

### 自动修复

```bash
pnpm lint --write
```

### 格式化代码

```bash
pnpm format
```

---

## 提交代码

### Git Hooks

项目使用 Husky 配置了 pre-commit hook：
- 提交前自动运行 `biome check`
- 如有问题会阻止提交

### 提交流程

```bash
git add .
git commit -m "feat: add new feature"
git push
```

---

## CI/CD

### GitHub Actions

推送代码后会自动触发 CI：
1. **Lint**: 运行 `pnpm lint`
2. **Build**: 运行 `pnpm build`

查看 `.github/workflows/ci.yml` 了解详情。

---

## 常见问题

### Q: 构建失败提示找不到依赖包

**A**: 确保先构建依赖包：

```bash
pnpm build  # 按拓扑顺序构建所有包
```

### Q: TypeScript 类型提示不工作

**A**: 
1. 确保依赖包已构建 (`pnpm build`)
2. 重启 IDE 或 TypeScript 服务器

### Q: Playground 没有热更新

**A**: 
1. 确保依赖包在 watch 模式：`pnpm --filter @x-filter/core dev`
2. 检查 Vite 配置中的 optimizeDeps

### Q: 如何查看构建产物

**A**: 构建后查看 `packages/{name}/dist/` 目录：

```bash
ls packages/core/dist/
# index.js  index.mjs  index.d.ts  ...
```

---

## 相关文档

- [Implementation Plan](./plan.md)
- [Package Structure Contract](./contracts/package-structure.md)
- [Build Outputs Contract](./contracts/build-outputs.md)
- [Data Model](./data-model.md)
