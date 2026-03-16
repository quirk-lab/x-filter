# Implementation Plan: Monorepo 初始化与基础设施

**Branch**: `002-monorepo-init` | **Date**: 2026-01-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-monorepo-init/spec.md`

---

## Summary

本计划实施 pnpm Workspace Monorepo 架构重构，涵盖：
1. **包结构规范化** - 建立 `packages/*` 和 `apps/*` 的完整依赖链路
2. **构建工具链统一** - 从 tsc/ESLint/Prettier 迁移至 tsup/Biome
3. **CI/CD 更新** - 重构 GitHub Actions 以适配新工具链
4. **开发体验优化** - 配置 HMR、类型自动生成和预提交检查

技术核心决策：使用 tsup (esbuild 驱动) 替代 tsc 进行库构建，使用 Biome 统一代码规范。

---

## Technical Context

**Language/Version**: TypeScript 5.6.x (已安装) 向 TypeScript 5.x 最新稳定版对齐  
**Primary Dependencies**:
- pnpm 9.x (Workspace 管理)
- tsup (esbuild-based 库构建器)
- Vite 5.x (应用构建器，已安装)
- Biome (替代 ESLint/Prettier 的一体化工具)
- Husky 9.x (Git Hooks，已安装)

**Storage**: N/A (纯前端库项目)  
**Testing**: 暂不配置 (Vitest 不在本次范围。现存 Jest 可保留供未来迁移)  
**Target Platform**: Node.js 18+, 现代浏览器 (ESM-first)  
**Project Type**: Monorepo (packages/* + apps/*)  
**Performance Goals**: 
- 增量构建时间 < 2s (单包)
- 全量构建时间 < 30s
- HMR 响应 < 500ms

**Constraints**: 
- 库输出必须支持 ESM + CJS 双格式
- 必须输出 `.d.ts` 类型定义文件
- Tree Shaking 友好

**Scale/Scope**: 
- 5 个库包 (utils, core, react, shadcn, antd)
- 2 个应用包 (playground, web)

---

## Constitution Check

*GATE: 必须在 Phase 0 研究前通过。Phase 1 设计后需重新检查。*

### Pre-Phase 0 Check

| Principle | Status | Notes |
|-----------|--------|-------|
| Consumer-Ready API Contracts | ⚠️ DEFER | 本次仅初始化空壳，不涉及具体 API |
| Rigorous Code Quality Controls | ✅ PASS | 通过 Biome + Husky 满足规范检查需求 |
| Comprehensive Test Coverage | ⚠️ DEFER | 测试框架不在本次范围 (Out of Scope) |
| Documentation-First Delivery | ✅ PASS | 每个包含 README.md |
| Predictable Release Discipline | ⚠️ DEFER | Changesets 不在本次范围 |

**Gate Result**: ✅ PASS (核心质量控制已满足，延迟项有合理理由)

---

## Project Structure

### Documentation (this feature)

```text
specs/002-monorepo-init/
├── plan.md              # 本文件 (实现计划)
├── research.md          # Phase 0 输出 (技术研究)
├── data-model.md        # Phase 1 输出 (包结构定义)
├── quickstart.md        # Phase 1 输出 (快速上手指南)
├── contracts/           # Phase 1 输出 (接口契约)
│   ├── package-structure.md   # 包结构规范
│   └── build-outputs.md       # 构建输出规范
└── tasks.md             # Phase 2 输出 (/speckit.tasks 生成)
```

### Source Code (repository root)

```text
# Monorepo 目标结构
.
├── packages/
│   ├── utils/                 # @x-filter/utils - 底层工具
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tsup.config.ts
│   │
│   ├── core/                  # @x-filter/core - 核心逻辑
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json       # 依赖 @x-filter/utils
│   │   ├── tsconfig.json
│   │   └── tsup.config.ts
│   │
│   ├── react/                 # @x-filter/react - React 适配层
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json       # 依赖 @x-filter/core
│   │   ├── tsconfig.json
│   │   └── tsup.config.ts
│   │
│   ├── shadcn/                # @x-filter/shadcn - Shadcn UI
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json       # 依赖 @x-filter/react
│   │   ├── tsconfig.json
│   │   └── tsup.config.ts
│   │
│   └── antd/                  # @x-filter/antd - Ant Design
│       ├── src/
│       │   └── index.ts
│       ├── package.json       # 依赖 @x-filter/react
│       ├── tsconfig.json
│       └── tsup.config.ts
│
├── apps/
│   ├── playground/            # 调试应用 (Vite)
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── index.html
│   │   ├── package.json       # 依赖所有 UI 包
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   │
│   └── web/                   # 官网应用 (Vite - 空壳)
│       ├── src/
│       │   └── main.tsx
│       ├── index.html
│       ├── package.json
│       ├── tsconfig.json
│       └── vite.config.ts
│
├── biome.json                 # Biome 根配置
├── tsconfig.base.json         # TypeScript 基础配置 (已存在)
├── pnpm-workspace.yaml        # pnpm Workspace 配置 (已存在)
├── package.json               # 根 package.json
└── .husky/
    └── pre-commit             # Biome lint 检查
```

**Structure Decision**: 采用标准 Monorepo 双层结构 (`packages/*` + `apps/*`)，库包使用 tsup 构建，应用包使用 Vite 构建。

---

## Key Design Decisions

### 1. 构建工具选择: tsup over tsc

**Decision**: 使用 tsup 替代 tsc 进行库构建

**Rationale**:
- tsup 基于 esbuild，构建速度提升 10-100 倍
- 内置 ESM/CJS 双格式输出
- 自动生成 `.d.ts` 文件 (通过 dts 插件)
- 默认 Tree Shaking 支持
- 零配置即可满足大部分场景

**Alternatives Rejected**:
- tsc: 太慢，无内置 bundling，需额外工具生成 CJS
- Rollup: 功能强大但配置复杂
- esbuild direct: 不支持 `.d.ts` 生成

### 2. 代码规范工具: Biome over ESLint/Prettier

**Decision**: 使用 Biome 替代 ESLint + Prettier

**Rationale**:
- 单一工具替代两个工具，减少配置复杂度
- 性能显著优于 ESLint/Prettier 组合
- 开箱即用的 TypeScript 和 React 支持
- 与 Constitution 要求的"Rigorous Code Quality Controls"对齐

**Migration Path**:
1. 删除 `.eslintrc.json`, `.eslintignore`, `.prettierrc`, `.prettierignore`
2. 创建 `biome.json`
3. 更新根 `package.json` 的 lint/format 脚本
4. 更新子包的 lint/format 脚本
5. 移除 ESLint/Prettier 相关 devDependencies

### 3. 包依赖层级设计

**Decision**: 严格的单向依赖链路

```
utils (无依赖) 
  ↓
core (依赖 utils)
  ↓
react (依赖 core)
  ↓
shadcn/antd (依赖 react)
  ↓
apps (依赖 UI 包)
```

**Rationale**:
- 清晰的依赖边界防止循环依赖
- 支持独立版本发布
- 便于 Tree Shaking 优化

---

## Implementation Phases

### Phase 0: Research & Preparation ✅
- 技术研究输出至 [research.md](./research.md)
- 确认 tsup、Biome 最佳实践
- 分析现有代码结构迁移路径

### Phase 1: Design & Contracts ✅
- 包结构定义输出至 [data-model.md](./data-model.md)
- 构建输出规范输出至 [contracts/build-outputs.md](./contracts/build-outputs.md)
- 快速上手指南输出至 [quickstart.md](./quickstart.md)

### Phase 2: Task Generation (下一步)
- 运行 `/speckit.tasks` 生成可执行任务列表

---

## Post-Design Constitution Re-Check

| Principle | Status | Notes |
|-----------|--------|-------|
| Consumer-Ready API Contracts | ✅ PASS | 包结构规范和构建输出契约已定义 |
| Rigorous Code Quality Controls | ✅ PASS | Biome 配置方案明确 |
| Comprehensive Test Coverage | ⚠️ DEFER | 测试框架不在本次范围（本次为纯基础设施重构，不涉及业务逻辑）；**将在 `003-test-infrastructure` 中专门补齐，届时满足 95%+ 覆盖率要求** |
| Documentation-First Delivery | ✅ PASS | quickstart.md 和各包 README |
| Predictable Release Discipline | ⚠️ DEFER | Changesets 不在本次范围；**将在后续迭代中通过专门功能补齐自动化版本管理** |

**Final Gate**: ✅ PASS (核心质量控制已满足，DEFER 项有明确的后续迭代计划)

---

## Complexity Tracking

本次重构属于**基础设施**类别，不涉及复杂业务逻辑。主要复杂度在于：

| Area | Complexity | Mitigation |
|------|------------|------------|
| 旧工具链清理 | Low | 删除配置文件，移除依赖 |
| Biome 迁移 | Medium | 参考官方迁移指南，逐步测试 |
| tsup 配置 | Low | 标准配置模板可复用 |
| 依赖链路打通 | Medium | 从底层向上逐层构建验证 |

无 Constitution 违规需特别说明。

---

## Generated Artifacts

- Phase 0: [research.md](./research.md)
- Phase 1: [data-model.md](./data-model.md)
- Phase 1: [contracts/package-structure.md](./contracts/package-structure.md)
- Phase 1: [contracts/build-outputs.md](./contracts/build-outputs.md)
- Phase 1: [quickstart.md](./quickstart.md)
