# @x-filter/ui-modules — PRD & Technical Plan

**Feature**: 004-ui-modules  
**Created**: 2026-03-17  
**Status**: Draft  
**Branch**: `main`

---

# Part 1: Product Requirement Document (PRD)

## 1. 概览

### 背景/动机

`@x-filter/core` 已完成并可稳定提供过滤树模型、变更函数、验证、JSON/SQL 序列化能力。当前 `@x-filter/react`、`@x-filter/shadcn`、`@x-filter/antd` 仍是占位实现，尚未形成可生产的筛选体验。

目标是构建完整的 UI 模块体系：
- `react` 提供 headless 状态与逻辑能力
- `shadcn` / `antd` 提供等价原子组件
- 支持 Notion/GitHub 风格的 inline custom filter 交互（仅交互风格参考，不绑定其语义字段）
- 新增 `apps/storybook` 展示组合 demo

### 目标

- 提供一套 schema-driven 的 Query Builder 体验（树形 + inline DSL 双编辑）
- 保持分层清晰：`core`（框架无关）→ `react`（headless）→ `shadcn/antd`（原子 UI）
- `shadcn` 与 `antd` 在功能上完整等价
- 提供完整 DSL（括号、引号/转义、数组字面量、范围语法）
- 提供可复用 URL 同步 hook（默认 DSL 编码）
- 发布 `apps/storybook` 展示基础树编辑器 / Notion 风格 / GitHub inline 风格 demo

### 主要用户/角色

- 库消费者（前端开发者）：在 React 应用中集成过滤器
- 设计系统开发者：基于原子组件拼装业务 UI
- 内部维护者：维护 core/react/ui 层一致行为

### 成功判断/衡量标准

- `@x-filter/react` API 支持受控 + 非受控模式
- `@x-filter/shadcn` 与 `@x-filter/antd` 通过同一行为测试集（功能等价）
- DSL 模式与树模式双向可用，树为单一真相源
- P0 场景在键盘与 A11y 层面可用（可达性测试通过）
- Storybook 展示至少 3 套可运行 demo（基础树/Notion/GitHub inline）

---

## 2. User Stories & Acceptance Criteria (核心)

### US-1: Headless 状态管理（React）

- **Story**: As a 开发者, I want to 使用 headless hooks 管理 filter 树和 DSL 草稿, so that 我可以构建自定义筛选 UI。
- **AC**:
  - [ ] 提供受控模式：`value + onChange`
  - [ ] 提供非受控模式：`defaultValue + internal state`
  - [ ] 树结构是单一真相源
  - [ ] 提供 `draftDSL`、`setDraftDSL`、`parseError`
  - [ ] DSL 解析成功才同步树；解析失败保留草稿且不覆盖树
- **Priority**: P0

### US-2: DSL 能力（Core）

- **Story**: As a 开发者, I want to 把 DSL 与 Filter Tree 相互转换, so that 用户可以在 inline 输入与可视化树之间切换。
- **AC**:
  - [ ] 在 `@x-filter/core/dsl` 提供 parser / formatter / converter
  - [ ] 支持括号分组
  - [ ] 支持引号与转义
  - [ ] 支持数组字面量
  - [ ] 支持范围语法
  - [ ] 语义完全来自 `FieldSchema`，不内置 GitHub/GitLab 领域字段
- **Priority**: P0

### US-3: Inline 智能补全

- **Story**: As a 用户, I want to 在输入 DSL 时获得补全建议, so that 我可以快速构建过滤条件。
- **AC**:
  - [ ] 支持字段名补全
  - [ ] 支持操作符补全
  - [ ] 支持候选值基础补全（基于 schema 的 values）
  - [ ] 支持键盘选择补全项
- **Priority**: P0

### US-4: 原子组件（Shadcn / Antd）

- **Story**: As a 开发者, I want to 使用原子组件自行组合筛选器, so that 我可以实现不同产品风格。
- **AC**:
  - [ ] 仅导出原子组件，不导出官方高阶组合组件
  - [ ] 两个包组件能力一一对应（字段选择、操作符选择、值编辑、组合器、规则行、分组块等）
  - [ ] 样式采用默认 shadcn/antd 风格；具体视觉由业务侧调整
  - [ ] `@x-filter/shadcn` 要求 Tailwind + shadcn 运行环境（peerDependencies）
- **Priority**: P0

### US-5: DnD 排序能力

- **Story**: As a 用户, I want to 拖拽调整规则/分组顺序, so that 我可以高效组织复杂条件。
- **AC**:
  - [ ] 支持 rule/group reorder
  - [ ] `react` 暴露统一 reorder contract（headless）
  - [ ] `shadcn` / `antd` 各自接入 `@dnd-kit`，不把 DnD 依赖引入 `react`
  - [ ] 跨层级拖拽和同层拖拽行为一致
- **Priority**: P0

### US-6: URL 同步能力

- **Story**: As a 开发者, I want to 把筛选状态同步到 URL, so that 我可以分享和恢复筛选状态。
- **AC**:
  - [ ] 提供工具型 hook（如 `useFilterUrlSync`）
  - [ ] 默认编码格式为 DSL
  - [ ] 支持初始化时从 URL 恢复
  - [ ] 保持路由实现解耦（不强绑定特定 router）
- **Priority**: P0

### US-7: 键盘与无障碍

- **Story**: As a 用户, I want to 使用键盘完整操作筛选器, so that 我可以高效且无障碍地完成筛选。
- **AC**:
  - [ ] 关键操作均支持键盘触达（新增/删除/移动/切换组合器）
  - [ ] 提供语义化 `aria-*` 标签与状态
  - [ ] 焦点管理一致（含补全菜单、分组与规则编辑）
  - [ ] 通过基础 a11y 自动化检测（含 `jest-axe`）
- **Priority**: P0

### US-8: Storybook Demo 应用

- **Story**: As a 开发者, I want to 在 Storybook 里查看可运行示例, so that 我可以理解如何组合原子能力。
- **AC**:
  - [ ] 新增 `apps/storybook`
  - [ ] 提供基础树编辑器 demo
  - [ ] 提供 Notion 风格组合 demo
  - [ ] 提供 GitHub inline 风格组合 demo（仅交互风格）
- **Priority**: P0

---

## 3. 详细规约

### 核心使用场景 (Flow)

1. 开发者传入 `FieldSchema[]` 初始化 filter。
2. 用户在可视化树中编辑规则或分组。
3. 用户可切换到 inline DSL 输入并编辑草稿。
4. DSL 解析成功时更新树；失败时仅更新 `draftDSL + parseError`。
5. 用户可拖拽调整规则/分组顺序。
6. 可选同步到 URL，支持分享与恢复。

### UI/UX 交互要点

- 以 inline 编辑效率为主，减少弹窗式编辑阻断
- 原子组件需支持组合为 Notion/GitHub 风格布局
- 不限制消费方视觉定制
- 保持 shadcn/antd 行为一致

### 输入输出行为

- 输入：`FieldSchema`、初始 `Filter`（可选）、DSL 字符串（可选）、URL 查询串（可选）
- 输出：最新 `Filter`、`draftDSL`、`parseError`、校验结果、URL 表达

### 约束/规则 (Business Rules)

- Tree 是唯一真相源
- DSL 语义仅由 schema 驱动
- `react` 层保持无 UI / 无 DnD 库耦合
- `shadcn/antd` 只输出原子组件

### 边界/不在范围 (Out of Scope)

- 不提供 GitHub/GitLab 语义字段预设（如 `is:open` 内建语义）
- 不提供官方高阶组合组件导出
- 不做跨框架（Vue/Svelte）UI 包

### 错误/异常场景

- DSL 语法错误：保留草稿并显示错误，不覆盖已有树
- URL 中 DSL 不可解析：回退到默认 filter，并上报错误状态
- 拖拽非法目标：拒绝提交并保持原状态

### 国际化/无障碍

- 文案支持 i18n 注入（由消费方提供）
- 提供可覆盖的标签与提示文案接口
- 键盘操作与 `aria-*` 为 P0

---

## 4. 遗留问题

- 一次性全量交付风险较高，需要严格控制实现顺序与回归范围
- 完整 DSL 的边界语法样例需要在实现前冻结（另附 grammar 文档）
- DnD 在移动端 Safari 的可用性需重点验证

---

# Part 2: Technical Plan

## 1. 计划申明

- **迭代性质**: 新功能（在 core 之上扩展 react/ui/storybook）
- **适用范围**: Frontend Libraries + DX Infrastructure

## 2. 技术决策

### 技术栈变更

- 新增 `@x-filter/core/dsl` 子路径导出
- `@x-filter/react`：新增 headless hooks（受控/非受控、DSL 草稿、URL 同步、reorder contract）
- `@x-filter/shadcn` / `@x-filter/antd`：引入 `@dnd-kit` 实现 DnD
- 新增 `apps/storybook`（用于 demo 展示）
- 兼容矩阵：React `>=18`、Ant Design `v5`、Node.js `>=20`

### 边界和范围控制

- `react` 不依赖 `@dnd-kit`，只提供拖拽语义契约
- UI 包保持原子导出，不做官方高阶组合组件
- 不处理 GitHub/GitLab 专有语义，仅参考交互风格

## 3. 架构设计

### 接口设计 (API)

- `@x-filter/core/dsl`
  - `parseDSL(input, schema) -> Filter`
  - `formatDSL(filter, schema?) -> string`
  - `tryParseDSL(input, schema) -> { ok, filter?, error? }`
  - `getDslCompletions(context) -> CompletionItem[]`
- `@x-filter/react`
  - `useFilterBuilder({ value?, defaultValue?, onChange?, schema })`
  - `useFilterDsl({ filter, schema, onCommit })`
  - `useFilterUrlSync({ mode: 'dsl' | 'json', ... })`
  - `useReorderContract({ onMoveRule, onMoveGroup })`
- `@x-filter/shadcn` / `@x-filter/antd`
  - 原子组件集（RuleRow、GroupBlock、FieldSelector、OperatorSelector、ValueEditor、CombinatorSelector、NotToggle 等）

### 数据模型 (Schema)

- 复用 `@x-filter/core` 既有 `Filter/FilterGroup/FilterRule/FieldSchema`
- DSL AST 仅作为中间表示，不作为持久化主模型
- URL 默认存储 DSL 字符串，可选 JSON

### 外部集成

- DnD：`@dnd-kit`（仅 UI 层）
- Demo：Storybook（作为 app）

## 4. 非功能性设计

### 安全与合规

- 不在 UI 层执行动态脚本
- URL 同步默认 encode/decode，避免直接拼接未转义文本

### 性能/规模

- DSL 解析采用增量触发策略（防抖/提交触发）
- 大 schema 下补全建议做前缀过滤和结果数量限制
- 复杂树编辑保持 immutable 最小变更

### 可观察性

- 提供解析错误与校验错误结构化输出
- demo 中展示状态面板（当前树、DSL、错误）便于调试

## 5. 实施与测试

### 数据迁移策略

- 无数据库迁移
- 保持当前 `core` API 向后兼容；DSL 作为新增子路径

### 测试重点

- Unit:
  - DSL parser/formatter round-trip
  - completion 建议正确性
  - hooks 受控/非受控行为
  - URL 同步读写
- Integration:
  - shadcn/antd 同一行为用例跑通
  - DnD reorder（同层/跨层）
  - 树编辑与 DSL 编辑双向联动
- A11y:
  - `jest-axe` 自动检查
  - 键盘路径覆盖（新增/删除/移动/补全选择）
- Cross-browser:
  - Chrome/Edge/Firefox/Safari 最近两个主版本
  - iOS Safari 最近两个版本

---

## 风险与缓解

- **风险**: 一次性全量交付导致回归面过大  
  **缓解**: 强制按模块顺序集成（core/dsl → react hooks → shadcn → antd → storybook），每层通过测试门禁后再进入下一层。

- **风险**: `shadcn` 与 `antd` 实现漂移  
  **缓解**: 维护共享行为测试矩阵，要求两套 UI 复用同一 AC 用例。

- **风险**: 完整 DSL 边界复杂  
  **缓解**: 先冻结 grammar 与异常行为表，再编码。
