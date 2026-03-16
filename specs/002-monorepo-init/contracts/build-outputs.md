# Contract: Build Outputs Specification

**Feature**: 002-monorepo-init  
**Created**: 2026-01-01  
**Version**: 1.0.0

---

## Overview

本文档定义 x-filter Monorepo 中库包的构建输出规范。

---

## 1. 输出格式要求

### Library 包必须输出

| File | Format | Purpose |
|------|--------|---------|
| `dist/index.js` | CommonJS | Node.js 兼容 |
| `dist/index.mjs` | ESM | 现代打包器 |
| `dist/index.d.ts` | TypeScript Declaration | 类型提示 |
| `dist/index.d.mts` | ESM Declaration (可选) | ESM 类型 |

### 可选输出

| File | Format | Purpose |
|------|--------|---------|
| `dist/index.js.map` | Source Map | CJS 调试 |
| `dist/index.mjs.map` | Source Map | ESM 调试 |

---

## 2. 文件命名规范

### 入口文件

```
dist/
├── index.js          # CJS 入口
├── index.mjs         # ESM 入口
├── index.d.ts        # 类型入口
├── index.js.map      # CJS source map
└── index.mjs.map     # ESM source map
```

### 多入口 (未来扩展)

```
dist/
├── index.js
├── index.mjs
├── index.d.ts
├── client.js         # 附加入口
├── client.mjs
├── client.d.ts
├── server.js
├── server.mjs
└── server.d.ts
```

---

## 3. package.json exports 字段

### 单入口 (当前标准)

```json
{
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

### 多入口 (未来扩展)

```json
{
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
    },
    "./client": {
      "import": {
        "types": "./dist/client.d.ts",
        "default": "./dist/client.mjs"
      },
      "require": {
        "types": "./dist/client.d.ts",
        "default": "./dist/client.js"
      }
    }
  }
}
```

---

## 4. Tree Shaking 要求

### 必须满足

- [x] ESM 格式输出
- [x] 无副作用声明 (`"sideEffects": false`)
- [x] 模块级别导出 (避免 barrel 文件性能问题)

### package.json 配置

```json
{
  "sideEffects": false
}
```

### tsup 配置

```typescript
{
  treeshake: true,
  splitting: false, // 库模式禁用分割
}
```

---

## 5. Source Map 配置

### 开发阶段

```typescript
// tsup.config.ts
{
  sourcemap: true,
}
```

### 生产发布

```typescript
// tsup.config.ts
{
  sourcemap: 'inline', // 或 false
}
```

---

## 6. 类型定义要求

### TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true
  }
}
```

### tsup 配置

```typescript
{
  dts: true, // 自动生成 .d.ts
}
```

### 类型完整性检查

- 所有公开 API 必须有明确类型
- 避免使用 `any`，必要时使用 `unknown`
- 导出类型必须在 `index.d.ts` 中声明

---

## 7. Bundle Size 目标

| Package | Max Size (minified) | Max Size (gzip) |
|---------|---------------------|-----------------|
| utils | 5 KB | 2 KB |
| core | 20 KB | 8 KB |
| react | 10 KB | 4 KB |
| shadcn | 50 KB | 15 KB |
| antd | 50 KB | 15 KB |

**Note**: 以上为初期目标，随功能增加可调整。

---

## 8. 构建验证 Checklist

### 每次构建后检查

- [ ] `dist/` 目录存在
- [ ] `dist/index.js` 存在 (CJS)
- [ ] `dist/index.mjs` 存在 (ESM)
- [ ] `dist/index.d.ts` 存在 (Types)
- [ ] 无构建错误或警告
- [ ] TypeScript 类型检查通过

### CI 验证脚本

```bash
#!/bin/bash
# scripts/verify-build.sh

packages=("utils" "core" "react" "shadcn" "antd")

for pkg in "${packages[@]}"; do
  dir="packages/$pkg/dist"
  
  if [ ! -f "$dir/index.js" ]; then
    echo "❌ Missing $dir/index.js"
    exit 1
  fi
  
  if [ ! -f "$dir/index.mjs" ]; then
    echo "❌ Missing $dir/index.mjs"
    exit 1
  fi
  
  if [ ! -f "$dir/index.d.ts" ]; then
    echo "❌ Missing $dir/index.d.ts"
    exit 1
  fi
  
  echo "✅ $pkg build outputs verified"
done

echo "🎉 All packages verified!"
```

---

## 9. 兼容性矩阵

### Node.js

| Version | Support |
|---------|---------|
| 18.x | ✅ Full |
| 20.x | ✅ Full |
| 22.x | ✅ Full |

### Bundlers

| Bundler | Support |
|---------|---------|
| Vite 5.x | ✅ Full |
| Webpack 5.x | ✅ Full |
| Rollup 4.x | ✅ Full |
| esbuild | ✅ Full |

### TypeScript

| Version | Support |
|---------|---------|
| 5.0+ | ✅ Full |
| 4.9 | ⚠️ Legacy (不推荐) |

---

## 10. External Dependencies

### 不打包进产物

```typescript
// tsup.config.ts
{
  external: [
    // Peer dependencies
    'react',
    'react-dom',
    'antd',
    // Node built-ins (可选)
    'node:fs',
    'node:path',
  ],
}
```

### Workspace 包处理

tsup 自动识别 workspace 依赖，无需手动配置 external。
