# Data Model: Monorepo 包结构定义

**Feature**: 002-monorepo-init  
**Created**: 2026-01-01  
**Status**: Complete

---

## Overview

本文档定义 x-filter Monorepo 的包结构、依赖关系和数据流。

---

## Package Entities

### 1. @x-filter/utils

**Purpose**: 底层工具函数库，无外部依赖

| Field | Type | Description |
|-------|------|-------------|
| name | string | `@x-filter/utils` |
| type | enum | `library` |
| dependencies | array | `[]` (无依赖) |
| peerDependencies | array | `[]` |
| exports | object | ESM/CJS/Types 入口 |

**Example Exports**:
```typescript
// 预期导出
export function deepClone<T>(obj: T): T;
export function isNil(value: unknown): value is null | undefined;
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T;
```

**Validation Rules**:
- 不允许依赖其他 @x-filter/* 包
- 不允许依赖 React 或 UI 框架
- 必须是纯函数，无副作用

---

### 2. @x-filter/core

**Purpose**: 核心过滤逻辑，包含 AST、验证等

| Field | Type | Description |
|-------|------|-------------|
| name | string | `@x-filter/core` |
| type | enum | `library` |
| dependencies | array | `[@x-filter/utils]` |
| peerDependencies | array | `[]` |
| exports | object | ESM/CJS/Types 入口 |

**Example Exports**:
```typescript
// 预期导出
export interface FilterNode { /* AST 节点 */ }
export interface FilterSchema { /* 过滤器 Schema */ }
export function parse(input: string): FilterNode;
export function validate(node: FilterNode, schema: FilterSchema): ValidationResult;
export function stringify(node: FilterNode): string;
```

**Validation Rules**:
- 只允许依赖 @x-filter/utils
- 不允许依赖 React 或 UI 框架
- 核心逻辑必须框架无关

---

### 3. @x-filter/react

**Purpose**: React 适配层，提供 Hooks 和 Context

| Field | Type | Description |
|-------|------|-------------|
| name | string | `@x-filter/react` |
| type | enum | `library` |
| dependencies | array | `[@x-filter/core]` |
| peerDependencies | array | `[react, react-dom]` |
| exports | object | ESM/CJS/Types 入口 |

**Example Exports**:
```typescript
// 预期导出
export function useFilter(options?: FilterOptions): UseFilterReturn;
export function useFilterValidation(node: FilterNode): ValidationState;
export const FilterContext: React.Context<FilterContextValue>;
export const FilterProvider: React.FC<FilterProviderProps>;
```

**Validation Rules**:
- 只允许依赖 @x-filter/core
- React 作为 peerDependency，不打包进产物
- 不允许依赖特定 UI 框架 (Shadcn/Antd)

---

### 4. @x-filter/shadcn

**Purpose**: Shadcn UI 组件适配

| Field | Type | Description |
|-------|------|-------------|
| name | string | `@x-filter/shadcn` |
| type | enum | `library` |
| dependencies | array | `[@x-filter/react]` |
| peerDependencies | array | `[react, react-dom, tailwindcss]` |
| exports | object | ESM/CJS/Types 入口 |

**Example Exports**:
```typescript
// 预期导出
export const FilterBuilder: React.FC<FilterBuilderProps>;
export const FilterCondition: React.FC<FilterConditionProps>;
export const FilterGroup: React.FC<FilterGroupProps>;
```

**Validation Rules**:
- 只允许依赖 @x-filter/react
- Shadcn 组件依赖通过 peerDependencies 声明
- 样式使用 Tailwind CSS

---

### 5. @x-filter/antd

**Purpose**: Ant Design 组件适配

| Field | Type | Description |
|-------|------|-------------|
| name | string | `@x-filter/antd` |
| type | enum | `library` |
| dependencies | array | `[@x-filter/react]` |
| peerDependencies | array | `[react, react-dom, antd]` |
| exports | object | ESM/CJS/Types 入口 |

**Example Exports**:
```typescript
// 预期导出
export const FilterBuilder: React.FC<FilterBuilderProps>;
export const FilterCondition: React.FC<FilterConditionProps>;
export const FilterGroup: React.FC<FilterGroupProps>;
```

**Validation Rules**:
- 只允许依赖 @x-filter/react
- Ant Design 作为 peerDependency
- 样式遵循 Antd 设计规范

---

### 6. apps/playground

**Purpose**: 开发调试应用

| Field | Type | Description |
|-------|------|-------------|
| name | string | `@x-filter/playground` |
| type | enum | `application` |
| dependencies | array | `[@x-filter/shadcn, @x-filter/antd]` |
| buildTool | string | `vite` |

**Features**:
- 组件实时预览
- 多 UI 框架切换
- 开发调试工具

---

### 7. apps/web

**Purpose**: 官网应用（空壳）

| Field | Type | Description |
|-------|------|-------------|
| name | string | `@x-filter/web` |
| type | enum | `application` |
| dependencies | array | `[@x-filter/shadcn]` (可选) |
| buildTool | string | `vite` |

**Features**:
- 基础脚手架
- 未来文档展示

---

## Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                         APPLICATIONS                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐              ┌──────────────────┐      │
│  │   playground    │              │       web        │      │
│  │   (调试应用)     │              │   (官网空壳)     │      │
│  └────────┬────────┘              └────────┬─────────┘      │
│           │                                │                 │
│           ▼                                ▼                 │
├─────────────────────────────────────────────────────────────┤
│                         UI ADAPTERS                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐              ┌──────────────────┐      │
│  │     shadcn      │              │       antd       │      │
│  │  (Shadcn 适配)   │              │  (Antd 适配)     │      │
│  └────────┬────────┘              └────────┬─────────┘      │
│           │                                │                 │
│           └───────────────┬────────────────┘                 │
│                           ▼                                  │
├─────────────────────────────────────────────────────────────┤
│                      REACT ADAPTER                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                   ┌─────────────────┐                        │
│                   │      react      │                        │
│                   │  (React Hooks)  │                        │
│                   └────────┬────────┘                        │
│                            │                                 │
│                            ▼                                 │
├─────────────────────────────────────────────────────────────┤
│                      CORE LOGIC                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                   ┌─────────────────┐                        │
│                   │      core       │                        │
│                   │   (核心逻辑)     │                        │
│                   └────────┬────────┘                        │
│                            │                                 │
│                            ▼                                 │
├─────────────────────────────────────────────────────────────┤
│                      UTILITIES                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                   ┌─────────────────┐                        │
│                   │      utils      │                        │
│                   │   (工具函数)     │                        │
│                   └─────────────────┘                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## State Transitions

### Package Build State

```
┌─────────────┐      build      ┌─────────────┐
│   Source    │ ───────────────▶│    Built    │
│  (src/*.ts) │                 │ (dist/*.js) │
└─────────────┘                 └─────────────┘
       │                               │
       │     typecheck                 │     publish
       ▼                               ▼
┌─────────────┐                 ┌─────────────┐
│   Checked   │                 │  Published  │
│ (tsc pass)  │                 │  (npm pkg)  │
└─────────────┘                 └─────────────┘
```

### Dependency Resolution

```
Install → Resolve workspace:* → Link packages → Ready for dev/build
```

---

## Versioning Rules

| Package | Current Version | Policy |
|---------|-----------------|--------|
| @x-filter/utils | 0.0.0 | 独立版本，稳定后升 1.0.0 |
| @x-filter/core | 0.0.0 | 依赖 utils 版本 |
| @x-filter/react | 0.0.0 | 依赖 core 版本 |
| @x-filter/shadcn | 0.0.0 | 依赖 react 版本 |
| @x-filter/antd | 0.0.0 | 依赖 react 版本 |

**Note**: 版本管理 (Changesets) 不在本次范围内，暂时手动管理。

---

## File Structure per Package

### Library Package Structure

```
packages/{package-name}/
├── src/
│   ├── index.ts          # 入口文件，re-exports
│   ├── types.ts          # 类型定义 (可选)
│   └── {module}/         # 功能模块
│       ├── index.ts
│       └── {file}.ts
├── dist/                 # 构建产物 (gitignore)
│   ├── index.js          # CJS
│   ├── index.mjs         # ESM
│   ├── index.d.ts        # Types
│   └── index.d.mts       # Types for ESM
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── README.md
```

### Application Package Structure

```
apps/{app-name}/
├── src/
│   ├── main.tsx          # 入口
│   ├── App.tsx           # 根组件
│   ├── components/       # 组件
│   └── pages/            # 页面 (可选)
├── public/               # 静态资源
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```
