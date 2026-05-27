# Tasks: UI Modules (React / Shadcn / Antd / Storybook)

**Input**: `specs/004-ui-modules/prd.md`, `specs/004-ui-modules/research-interactions.md`  
**Prerequisites**: `@x-filter/core` 已实现并通过现有测试  
**Delivery Mode**: 一次性全量交付（单里程碑）

**Tests**: 必须采用 TDD（先失败测试，再实现）

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行执行（无文件冲突、无前置依赖）
- **[Story]**: 对应 PRD User Story（US-1 ~ US-8）

---

## Phase 1: Foundation & Contracts

**Purpose**: 冻结语法、接口、目录骨架，避免后续反复返工

- [ ] T001 [US-2] 创建 `specs/004-ui-modules/contracts/dsl-grammar.md`，冻结 DSL 语法（括号/引号/转义/数组/范围）
- [ ] T002 [US-2] 创建 `specs/004-ui-modules/contracts/dsl-error-codes.md`，定义 parser 错误码与错误位置信息结构
- [ ] T003 [US-1] 创建 `specs/004-ui-modules/contracts/react-headless-api.md`，冻结 `useFilterBuilder/useFilterDsl/useFilterUrlSync/useReorderContract` API
- [ ] T004 [US-4] 创建 `specs/004-ui-modules/contracts/ui-atom-matrix.md`，列出 shadcn/antd 一一对应原子组件矩阵
- [ ] T005 [US-5] 创建 `specs/004-ui-modules/contracts/reorder-contract.md`，定义 DnD 输入/输出契约（不依赖 UI 库）
- [ ] T006 [US-7] 创建 `specs/004-ui-modules/contracts/a11y-keyboard-spec.md`，冻结键盘路径与 aria 规范
- [ ] T007 [US-8] 创建 `specs/004-ui-modules/contracts/storybook-scenarios.md`，定义三类 demo 场景和验收脚本

**Checkpoint**: 合同文档冻结，进入实现

---

## Phase 2: Core DSL Module (`@x-filter/core/dsl`)

**Purpose**: 实现框架无关 DSL 能力

- [ ] T008 [US-2] 创建 `packages/core/src/dsl/types.ts`（Token、AST、ParseError、CompletionItem）
- [ ] T009 [US-2] 创建 `packages/core/src/dsl/tokenize.ts`
- [ ] T010 [US-2] 创建 `packages/core/src/dsl/parse.ts`
- [ ] T011 [US-2] 创建 `packages/core/src/dsl/format.ts`
- [ ] T012 [US-2] 创建 `packages/core/src/dsl/convert.ts`（AST <-> Filter）
- [ ] T013 [US-3] 创建 `packages/core/src/dsl/completion.ts`
- [ ] T014 [US-2] 创建 `packages/core/src/dsl/index.ts`
- [ ] T015 [US-2] 更新 `packages/core/src/index.ts`，新增 `dsl` 子路径导出入口（仅类型/通用工具）
- [ ] T016 [US-2] 更新 `packages/core/package.json` `exports`，增加 `./dsl` 子路径

### DSL tests

- [ ] T017 [US-2] 创建 `packages/core/src/__tests__/dsl/tokenize.spec.ts`
- [ ] T018 [US-2] 创建 `packages/core/src/__tests__/dsl/parse.spec.ts`
- [ ] T019 [US-2] 创建 `packages/core/src/__tests__/dsl/format.spec.ts`
- [ ] T020 [US-2] 创建 `packages/core/src/__tests__/dsl/roundtrip.spec.ts`（Filter -> DSL -> Filter）
- [ ] T021 [US-2] 创建 `packages/core/src/__tests__/dsl/errors.spec.ts`（错误码与定位）
- [ ] T022 [US-3] 创建 `packages/core/src/__tests__/dsl/completion.spec.ts`

**Checkpoint**: `@x-filter/core/dsl` 可独立测试通过

---

## Phase 3: React Headless Hooks (`@x-filter/react`)

**Purpose**: 在 React 层实现状态与行为编排，不耦合 UI 与 DnD 库

- [ ] T023 [US-1] 创建 `packages/react/src/types.ts`（builder 状态与回调类型）
- [ ] T024 [US-1] 创建 `packages/react/src/use-filter-builder.ts`（受控 + 非受控）
- [ ] T025 [US-1] 创建 `packages/react/src/use-filter-dsl.ts`（draftDSL + parseError + commit）
- [ ] T026 [US-6] 创建 `packages/react/src/use-filter-url-sync.ts`（默认 dsl 编码）
- [ ] T027 [US-5] 创建 `packages/react/src/use-reorder-contract.ts`（语义契约）
- [ ] T028 [US-1] 更新 `packages/react/src/index.ts` 导出新 hooks
- [ ] T029 [US-1] 更新 `packages/react/README.md`，补齐 headless 使用示例

### React tests

- [ ] T030 [US-1] 创建 `packages/react/src/__tests__/use-filter-builder.spec.tsx`
- [ ] T031 [US-1] 创建 `packages/react/src/__tests__/use-filter-builder-controlled.spec.tsx`
- [ ] T032 [US-1] 创建 `packages/react/src/__tests__/use-filter-dsl.spec.tsx`
- [ ] T033 [US-6] 创建 `packages/react/src/__tests__/use-filter-url-sync.spec.tsx`
- [ ] T034 [US-5] 创建 `packages/react/src/__tests__/use-reorder-contract.spec.tsx`

**Checkpoint**: Headless hooks 完整可用

---

## Phase 4: Shared UI Behavior Tests (Parity Harness)

**Purpose**: 为 shadcn / antd 建立同一行为验收基线

- [ ] T035 [US-4] 创建 `packages/react/src/testing/filter-behavior-contract.ts`（共享行为断言）
- [ ] T036 [US-4] 创建 `packages/react/src/testing/filter-fixtures.ts`（统一 fixtures）
- [ ] T037 [US-7] 创建 `packages/react/src/testing/keyboard-contract.ts`
- [ ] T038 [US-7] 创建 `packages/react/src/testing/a11y-contract.ts`

**Checkpoint**: Parity contract 准备完毕

---

## Phase 5: Shadcn Atomic Components (`@x-filter/shadcn`)

**Purpose**: 实现 shadcn 原子组件与 DnD 集成

- [ ] T039 [US-4] 更新 `packages/shadcn/package.json`：补充 peerDependencies（Tailwind/shadcn 运行前提）
- [ ] T040 [US-5] 更新 `packages/shadcn/package.json`：添加 `@dnd-kit/core`、`@dnd-kit/sortable`、`@dnd-kit/utilities`
- [ ] T041 [US-4] 创建 `packages/shadcn/src/types.ts`
- [ ] T042 [US-4] 创建 `packages/shadcn/src/components/field-selector.tsx`
- [ ] T043 [US-4] 创建 `packages/shadcn/src/components/operator-selector.tsx`
- [ ] T044 [US-4] 创建 `packages/shadcn/src/components/value-editor.tsx`
- [ ] T045 [US-4] 创建 `packages/shadcn/src/components/combinator-selector.tsx`
- [ ] T046 [US-4] 创建 `packages/shadcn/src/components/not-toggle.tsx`
- [ ] T047 [US-4] 创建 `packages/shadcn/src/components/rule-row.tsx`
- [ ] T048 [US-4] 创建 `packages/shadcn/src/components/group-block.tsx`
- [ ] T049 [US-5] 创建 `packages/shadcn/src/components/dnd-sortable-group.tsx`
- [ ] T050 [US-3] 创建 `packages/shadcn/src/components/dsl-inline-input.tsx`（补全菜单 + 错误展示）
- [ ] T051 [US-4] 更新 `packages/shadcn/src/index.tsx` 导出全部原子组件
- [ ] T052 [US-4] 更新 `packages/shadcn/README.md`（原子组合示例）

### Shadcn tests

- [ ] T053 [US-4] 创建 `packages/shadcn/src/__tests__/atoms.spec.tsx`
- [ ] T054 [US-5] 创建 `packages/shadcn/src/__tests__/dnd.spec.tsx`
- [ ] T055 [US-3] 创建 `packages/shadcn/src/__tests__/dsl-inline-input.spec.tsx`
- [ ] T056 [US-7] 创建 `packages/shadcn/src/__tests__/keyboard.spec.tsx`
- [ ] T057 [US-7] 创建 `packages/shadcn/src/__tests__/a11y.spec.tsx`（`jest-axe`）

**Checkpoint**: shadcn 原子层完成

---

## Phase 6: Antd Atomic Components (`@x-filter/antd`)

**Purpose**: 实现 antd 原子组件并对齐 shadcn 行为

- [ ] T058 [US-4] 更新 `packages/antd/package.json`：添加 `antd@^5` peerDependencies（如未显式）
- [ ] T059 [US-5] 更新 `packages/antd/package.json`：添加 `@dnd-kit/*` 依赖
- [ ] T060 [US-4] 创建 `packages/antd/src/types.ts`
- [ ] T061 [US-4] 创建 `packages/antd/src/components/field-selector.tsx`
- [ ] T062 [US-4] 创建 `packages/antd/src/components/operator-selector.tsx`
- [ ] T063 [US-4] 创建 `packages/antd/src/components/value-editor.tsx`
- [ ] T064 [US-4] 创建 `packages/antd/src/components/combinator-selector.tsx`
- [ ] T065 [US-4] 创建 `packages/antd/src/components/not-toggle.tsx`
- [ ] T066 [US-4] 创建 `packages/antd/src/components/rule-row.tsx`
- [ ] T067 [US-4] 创建 `packages/antd/src/components/group-block.tsx`
- [ ] T068 [US-5] 创建 `packages/antd/src/components/dnd-sortable-group.tsx`
- [ ] T069 [US-3] 创建 `packages/antd/src/components/dsl-inline-input.tsx`
- [ ] T070 [US-4] 更新 `packages/antd/src/index.tsx` 导出全部原子组件
- [ ] T071 [US-4] 更新 `packages/antd/README.md`（原子组合示例）

### Antd tests

- [ ] T072 [US-4] 创建 `packages/antd/src/__tests__/atoms.spec.tsx`
- [ ] T073 [US-5] 创建 `packages/antd/src/__tests__/dnd.spec.tsx`
- [ ] T074 [US-3] 创建 `packages/antd/src/__tests__/dsl-inline-input.spec.tsx`
- [ ] T075 [US-7] 创建 `packages/antd/src/__tests__/keyboard.spec.tsx`
- [ ] T076 [US-7] 创建 `packages/antd/src/__tests__/a11y.spec.tsx`

**Checkpoint**: antd 原子层完成，功能应与 shadcn 等价

---

## Phase 7: Storybook App (`apps/storybook`)

**Purpose**: 提供可运行 demo 与交互对照

- [ ] T077 [US-8] 创建 `apps/storybook/package.json`
- [ ] T078 [US-8] 创建 `apps/storybook/tsconfig.json`
- [ ] T079 [US-8] 创建 `apps/storybook/.storybook/main.ts`
- [ ] T080 [US-8] 创建 `apps/storybook/.storybook/preview.ts`
- [ ] T081 [US-8] 创建 `apps/storybook/src/stories/basic-tree.stories.tsx`
- [ ] T082 [US-8] 创建 `apps/storybook/src/stories/notion-style.stories.tsx`
- [ ] T083 [US-8] 创建 `apps/storybook/src/stories/github-inline-style.stories.tsx`
- [ ] T084 [US-8] 创建 `apps/storybook/src/stories/shared/fixtures.ts`
- [ ] T085 [US-8] 创建 `apps/storybook/src/stories/shared/playground-controls.tsx`（解析策略/补全策略/错误策略切换）
- [ ] T086 [US-8] 更新根 `package.json` 脚本：`storybook`、`build-storybook`

### Storybook tests/checks

- [ ] T087 [US-8] 运行 `pnpm --filter @x-filter/storybook dev` 验证 demo 可启动
- [ ] T088 [US-8] 运行 `pnpm --filter @x-filter/storybook build-storybook` 验证构建

**Checkpoint**: Storybook 可演示 3 种场景

---

## Phase 8: Parity, Cross-Browser, Quality Gates

**Purpose**: 一次性全量交付前的硬门禁

- [ ] T089 [US-4] 创建 `specs/004-ui-modules/checklists/parity-matrix.md`（组件与行为逐项对照）
- [ ] T090 [US-4] 执行 shadcn 与 antd 行为对照测试并记录结果
- [ ] T091 [US-7] 执行键盘路径回归测试并记录结果
- [ ] T092 [US-7] 执行 a11y 自动化测试（含 `jest-axe`）并记录结果
- [ ] T093 [US-8] 在 Chrome 最新版执行关键流程 smoke
- [ ] T094 [US-8] 在 Edge 最新版执行关键流程 smoke
- [ ] T095 [US-8] 在 Firefox 最新版执行关键流程 smoke
- [ ] T096 [US-8] 在 Safari 最新版执行关键流程 smoke
- [ ] T097 [US-8] 在 iOS Safari 最近两个版本执行关键流程 smoke
- [ ] T098 [US-6] 验证 URL 同步在路由前进/后退下行为正确
- [ ] T099 [US-2] 验证 DSL round-trip 与 Tree 编辑一致性
- [ ] T100 [US-1] 更新 `README.md`（新增 react/shadcn/antd/storybook 使用指引）

---

## Dependencies & Execution Order

### Phase dependencies

1. Phase 1 -> 阻塞后续全部阶段
2. Phase 2 -> Phase 3 的前置（React 依赖 core/dsl）
3. Phase 3 + Phase 4 -> Phase 5/6 前置（先冻结行为 contract）
4. Phase 5 + Phase 6 -> Phase 7 前置（Storybook 依赖 UI 原子组件）
5. Phase 8 -> 最终交付门禁

### Parallel opportunities

- Phase 1 中 T001~T007 可并行分工
- Phase 2 中 tokenizer/parser/formatter/completion 可并行（T009~T013），但需要先统一 types（T008）
- Phase 5 与 Phase 6 可并行，但必须共同遵循 Phase 4 contract
- Phase 7 story 文件（T081~T083）可并行

### Critical blocking risks

- DSL grammar 不冻结直接编码 -> 高返工风险
- shadcn/antd 未共用行为 contract -> 功能漂移风险
- 一次性交付缺少阶段门禁 -> 回归不可控
