# Tasks: Monorepo 初始化与基础设施

**Input**: Design documents from `/specs/002-monorepo-init/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: 测试任务不包含（本功能规范未明确要求 TDD）

**Organization**: 任务按用户故事分组，支持独立实现和测试

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行执行（不同文件，无依赖）
- **[Story]**: 所属用户故事（如 US1, US2, US3）
- 描述中包含确切文件路径

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 项目初始化和基础结构

- [x] T001 清理旧工具链配置文件（如存在）：删除 `.eslintrc.json`, `.eslintignore`, `.prettierrc`, `.prettierignore`
- [x] T002 创建根目录 `tsconfig.base.json`，配置共享的 TypeScript 编译选项
- [x] T003 [P] 更新根目录 `pnpm-workspace.yaml`，确保包含 `packages/*` 和 `apps/*`
- [x] T004 [P] 在根目录安装 Biome 依赖：`pnpm add -Dw @biomejs/biome`
- [x] T005 [P] 在根目录安装 tsup 依赖：`pnpm add -Dw tsup`
- [x] T006 创建根目录 `biome.json`，按 research.md 配置 linter 和 formatter
- [x] T007 更新根目录 `package.json`，添加 `lint`, `format`, `build`, `dev`, `typecheck` 脚本

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 核心基础设施，所有用户故事都依赖此阶段完成

**⚠️ CRITICAL**: 用户故事任务开始前必须完成此阶段

- [x] T008 创建 `packages/utils/` 目录结构：`src/index.ts`, `package.json`, `tsconfig.json`, `tsup.config.ts`, `README.md`
- [x] T009 配置 `packages/utils/package.json`，按 contracts/package-structure.md 规范设置 exports 字段
- [x] T010 [P] 配置 `packages/utils/tsconfig.json`，继承 `../../tsconfig.base.json`
- [x] T011 [P] 配置 `packages/utils/tsup.config.ts`，按 research.md 模板设置 ESM/CJS/dts 输出
- [x] T012 在 `packages/utils/src/index.ts` 添加占位导出函数（如 `isNil`）

---

- [x] T013 创建 `packages/core/` 目录结构：`src/index.ts`, `package.json`, `tsconfig.json`, `tsup.config.ts`, `README.md`
- [x] T014 配置 `packages/core/package.json`，添加 `@x-filter/utils` 依赖 (`workspace:*`)
- [x] T015 [P] 配置 `packages/core/tsconfig.json`
- [x] T016 [P] 配置 `packages/core/tsup.config.ts`
- [x] T017 在 `packages/core/src/index.ts` 添加占位导出（导入并使用 utils 函数）

---

- [x] T018 创建 `packages/react/` 目录结构：`src/index.ts`, `package.json`, `tsconfig.json`, `tsup.config.ts`, `README.md`
- [x] T019 配置 `packages/react/package.json`，添加 `@x-filter/core` 依赖，`react`/`react-dom` 为 peerDependencies
- [x] T020 [P] 配置 `packages/react/tsconfig.json`，启用 `jsx: react-jsx`
- [x] T021 [P] 配置 `packages/react/tsup.config.ts`，external 排除 react/react-dom
- [x] T022 在 `packages/react/src/index.ts` 添加占位导出（导入 core 并导出示例 hook）

---

- [x] T023 创建 `packages/shadcn/` 目录结构：`src/index.ts`, `package.json`, `tsconfig.json`, `tsup.config.ts`, `README.md`
- [x] T024 配置 `packages/shadcn/package.json`，添加 `@x-filter/react` 依赖，tailwindcss 为 peerDependency
- [x] T025 [P] 配置 `packages/shadcn/tsconfig.json`
- [x] T026 [P] 配置 `packages/shadcn/tsup.config.ts`，external 排除 react/react-dom/tailwindcss
- [x] T027 在 `packages/shadcn/src/index.ts` 添加占位组件导出

---

- [x] T028 创建 `packages/antd/` 目录结构：`src/index.ts`, `package.json`, `tsconfig.json`, `tsup.config.ts`, `README.md`
- [x] T029 配置 `packages/antd/package.json`，添加 `@x-filter/react` 依赖，antd 为 peerDependency
- [x] T030 [P] 配置 `packages/antd/tsconfig.json`
- [x] T031 [P] 配置 `packages/antd/tsup.config.ts`，external 排除 react/react-dom/antd
- [x] T032 在 `packages/antd/src/index.ts` 添加占位组件导出

**Checkpoint**: 所有库包结构已创建，可开始用户故事实现

---

## Phase 3: User Story 1 - 开发者安装与启动项目 (Priority: P1) 🎯 MVP

**Goal**: 开发者能够一键安装所有依赖并启动开发环境

**Independent Test**: 克隆仓库后执行 `pnpm install && pnpm dev`，能够成功启动 playground 应用并在浏览器中访问

### Implementation for User Story 1

- [x] T033 [US1] 创建 `apps/playground/` 目录结构：`src/main.tsx`, `src/App.tsx`, `index.html`, `package.json`, `tsconfig.json`, `vite.config.ts`, `README.md`
- [x] T034 [US1] 配置 `apps/playground/package.json`，添加 `@x-filter/shadcn` 和 `@x-filter/antd` 依赖，以及 vite/react 开发依赖
- [x] T035 [P] [US1] 配置 `apps/playground/tsconfig.json`，继承根配置并启用 JSX
- [x] T036 [P] [US1] 配置 `apps/playground/vite.config.ts`，按 research.md 设置 optimizeDeps
- [x] T037 [US1] 实现 `apps/playground/src/main.tsx`，渲染 App 组件
- [x] T038 [US1] 实现 `apps/playground/src/App.tsx`，导入并展示各包的占位内容
- [x] T039 [US1] 创建 `apps/playground/index.html`，引入 main.tsx

---

- [x] T040 [US1] 创建 `apps/web/` 目录结构（空壳）：`src/main.tsx`, `index.html`, `package.json`, `tsconfig.json`, `vite.config.ts`, `README.md`
- [x] T041 [US1] 配置 `apps/web/package.json`，基础 Vite/React 配置
- [x] T042 [P] [US1] 配置 `apps/web/tsconfig.json`
- [x] T043 [P] [US1] 配置 `apps/web/vite.config.ts`
- [x] T044 [US1] 实现 `apps/web/src/main.tsx`，渲染基础 App

---

- [x] T045 [US1] 更新根目录 `package.json` 的 `dev` 脚本，启动 playground
- [x] T046 [US1] 更新根目录 `package.json` 的 `build` 脚本，按拓扑顺序构建所有包 (`pnpm -r run build`)
- [x] T047 [US1] 运行 `pnpm install` 验证所有依赖正确解析
- [x] T048 [US1] 运行 `pnpm build` 验证所有包成功构建
- [x] T049 [US1] 运行 `pnpm dev` 验证 playground 成功启动并可在浏览器访问

**Checkpoint**: User Story 1 完成，开发者可以一键安装并启动项目

---

## Phase 4: User Story 2 - 开发核心库并实时预览 (Priority: P1)

**Goal**: 修改 packages/core 中的代码时，能在 apps/playground 中实时看到变化

**Independent Test**: 修改 `@x-filter/core` 中的导出内容，保存后 playground 自动刷新并显示更新

### Implementation for User Story 2

- [x] T050 [US2] 在 `packages/core/package.json` 添加 `dev` 脚本：`tsup --watch`
- [x] T051 [P] [US2] 在 `packages/utils/package.json` 添加 `dev` 脚本：`tsup --watch`
- [x] T052 [P] [US2] 在 `packages/react/package.json` 添加 `dev` 脚本：`tsup --watch`
- [x] T053 [P] [US2] 在 `packages/shadcn/package.json` 添加 `dev` 脚本：`tsup --watch`
- [x] T054 [P] [US2] 在 `packages/antd/package.json` 添加 `dev` 脚本：`tsup --watch`
- [x] T055 [US2] 更新 `apps/playground/vite.config.ts`，配置 server.watch 监听 packages 目录变化
- [x] T056 [US2] 在 `packages/core/src/index.ts` 添加一个导出函数用于验证 HMR
- [x] T057 [US2] 在 `apps/playground/src/App.tsx` 调用 core 的函数并显示结果
- [x] T058 [US2] 验证：修改 core 函数返回值后，playground 自动刷新显示更新

**Checkpoint**: User Story 2 完成，开发时可实时预览核心库变化

---

## Phase 5: User Story 3 - 依赖链路验证 (Priority: P1)

**Goal**: 验证完整的包依赖链路（Utils -> Core -> React -> UI -> Apps）是否正确打通

**Independent Test**: 在 playground 中成功导入并使用来自 core、shadcn 或 antd 的导出内容

### Implementation for User Story 3

- [x] T059 [US3] 在 `packages/utils/src/index.ts` 实现一个实际工具函数（如 `isNil`）
- [x] T060 [US3] 在 `packages/core/src/index.ts` 导入并使用 utils 函数，导出新函数证明依赖链路
- [x] T061 [US3] 在 `packages/react/src/index.ts` 导入 core，导出一个使用 core 的 React hook
- [x] T062 [P] [US3] 在 `packages/shadcn/src/index.ts` 导入 react hook，导出一个占位 React 组件
- [x] T063 [P] [US3] 在 `packages/antd/src/index.ts` 导入 react hook，导出一个占位 React 组件
- [x] T064 [US3] 在 `apps/playground/src/App.tsx` 导入 shadcn 和 antd 组件并渲染
- [x] T065 [US3] 运行 `pnpm build` 验证按 utils -> core -> react -> shadcn/antd 顺序构建成功
- [x] T066 [US3] 运行 `pnpm dev` 验证 playground 正确渲染所有组件，类型提示正常

**Checkpoint**: User Story 3 完成，完整依赖链路验证通过

---

## Phase 6: User Story 4 - 代码规范检查与提交 (Priority: P2)

**Goal**: 提交代码时自动检查代码规范，确保代码风格统一

**Independent Test**: 提交包含格式问题的代码时，Husky 触发 Biome 检查并阻止提交

### Implementation for User Story 4

- [x] T067 [US4] 确认 Husky 已初始化，检查 `.husky/` 目录存在
- [x] T068 [US4] 创建或更新 `.husky/pre-commit`，配置运行 `pnpm biome check --staged --write`
- [x] T069 [US4] 确保 Husky hooks 可执行：`chmod +x .husky/pre-commit`
- [x] T070 [US4] 为每个库包的 `package.json` 添加 `lint` 脚本：`biome lint src`
- [x] T071 [US4] 为每个库包的 `package.json` 添加 `format` 脚本：`biome format src --write`
- [x] T072 [US4] 运行 `pnpm lint` 验证全仓库代码检查通过
- [x] T073 [US4] 测试 pre-commit hook：创建格式错误的代码，尝试提交，验证被阻止

**Checkpoint**: User Story 4 完成，代码提交时自动执行规范检查

---

## Phase 7: User Story 5 - CI 流水线验证 (Priority: P2)

**Goal**: 推送代码后 GitHub Actions 自动运行构建和检查

**Independent Test**: 推送代码后 GitHub Actions 的 lint 和 build 步骤全部通过

### Implementation for User Story 5

- [x] T074 [US5] 创建或更新 `.github/workflows/ci.yml`，按 research.md 配置 lint 和 build jobs
- [x] T075 [US5] 配置 CI 触发条件：所有分支的 push 和 pull_request
- [x] T076 [US5] 配置 pnpm 缓存加速 CI
- [x] T077 [US5] 确保 CI 使用 `pnpm install --frozen-lockfile`
- [x] T078 [US5] 推送代码到远程分支，验证 CI 自动触发
- [x] T079 [US5] 验证 lint job 成功完成
- [x] T080 [US5] 验证 build job 成功完成
- [x] T081 [US5] 确认所有检查项显示绿色 (Success)

**Checkpoint**: User Story 5 完成，CI 流水线正常工作

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 跨用户故事的改进和收尾

- [x] T082 [P] 为每个库包创建 `README.md`，包含包描述、安装使用方法
- [x] T083 [P] 更新根目录 `README.md`，添加 Monorepo 结构说明和快速开始指南
- [x] T084 确保 `.gitignore` 包含 `dist/`, `node_modules/`, `*.tsbuildinfo` 等条目
- [x] T085 运行 `pnpm typecheck` 验证所有包类型检查通过
- [x] T086 验证构建产物符合 contracts/build-outputs.md 规范（每个库包 dist/ 包含 .js, .mjs, .d.ts）
- [x] T087 运行 quickstart.md 中的所有验证步骤，确保指南准确
- [x] T088 清理任何遗留的旧工具链依赖（eslint, prettier 相关包）

### Success Criteria 验证

- [x] T089 验证 SC-006：确认代码库中不存在 `.eslintrc`、`.prettierrc` 等旧配置文件
- [x] T090 验证 SC-007：确认 `biome.json` 存在于根目录并正确配置
- [x] T091 验证 SC-008：确认所有 Library 包的 `dist/` 目录均包含 `.mjs`、`.js` 和 `.d.ts` 文件

### Edge Cases 验证 (P3 - 可选)

- [ ] T092 [P3] 验证循环依赖检测：尝试在 core 中引入 react 依赖，确认构建报错
- [ ] T093 [P3] 验证类型丢失检测：临时移除 tsup dts 配置，确认消费端有类型错误提示
- [ ] T094 [P3] 验证构建顺序：在 core 未构建时尝试构建 react，确认失败并提示依赖关系

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 无依赖 - 可立即开始
- **Foundational (Phase 2)**: 依赖 Setup 完成 - **阻塞所有用户故事**
- **User Stories (Phase 3-7)**: 全部依赖 Foundational 完成
  - US1, US2, US3 均为 P1 优先级，建议顺序执行以确保依赖正确
  - US4, US5 为 P2 优先级，可在 US1-3 完成后并行执行
- **Polish (Phase 8)**: 依赖所有用户故事完成

### User Story Dependencies

- **User Story 1 (P1)**: Foundational 完成后可开始 - 基础项目结构
- **User Story 2 (P1)**: 依赖 US1 - 需要 playground 已可运行
- **User Story 3 (P1)**: 依赖 US1 - 需要所有包结构已创建
- **User Story 4 (P2)**: 依赖 Foundational - 仅需 Biome 配置就位
- **User Story 5 (P2)**: 依赖 US1 + US4 - 需要 lint 和 build 可用

### Within Each User Story

- 配置文件先于实现代码
- 包依赖按 utils -> core -> react -> shadcn/antd -> apps 顺序
- 验证步骤放在最后

### Parallel Opportunities

- T003, T004, T005 可并行（不同根目录配置）
- T010, T011 可并行（utils 的 tsconfig 和 tsup 配置）
- 所有 `[P]` 标记的任务可并行
- US4 和 US5 完成 Foundational 后可与 US1/US2/US3 并行（但建议等待 US1 完成）

---

## Parallel Example: Foundational Phase

```bash
# 并行创建库包的配置文件：
Task: "配置 packages/utils/tsconfig.json"
Task: "配置 packages/utils/tsup.config.ts"

# 并行创建多个库包的 tsconfig：
Task: "配置 packages/core/tsconfig.json"
Task: "配置 packages/react/tsconfig.json"
Task: "配置 packages/shadcn/tsconfig.json"
Task: "配置 packages/antd/tsconfig.json"
```

---

## Implementation Strategy

### MVP First (User Story 1-3)

1. 完成 Phase 1: Setup
2. 完成 Phase 2: Foundational (CRITICAL - 阻塞所有故事)
3. 完成 Phase 3: User Story 1 (安装与启动)
4. **STOP and VALIDATE**: 运行 `pnpm install && pnpm build && pnpm dev`
5. 完成 Phase 4: User Story 2 (实时预览)
6. 完成 Phase 5: User Story 3 (依赖链路)
7. **STOP and VALIDATE**: 验证完整依赖链路

### Incremental Delivery

1. Setup + Foundational → 基础设施就绪
2. 添加 User Story 1 → 独立测试 → 可演示 MVP!
3. 添加 User Story 2 → 独立测试 → 开发体验提升
4. 添加 User Story 3 → 独立测试 → 架构验证完成
5. 添加 User Story 4 → 独立测试 → 代码质量保障
6. 添加 User Story 5 → 独立测试 → CI/CD 就绪

### Parallel Team Strategy

多人协作时：

1. 团队共同完成 Setup + Foundational
2. Foundational 完成后：
   - Developer A: User Story 1 (项目启动)
   - Developer B: User Story 4 (代码规范) - 可与 US1 并行
3. US1 完成后：
   - Developer A: User Story 2 + 3 (开发体验)
   - Developer B: User Story 5 (CI)

---

## Notes

- [P] 标记 = 不同文件，无依赖，可并行
- [Story] 标签 = 任务归属的用户故事
- 每个用户故事应独立可完成可测试
- 提交后验证每个任务或逻辑分组
- 在任何 Checkpoint 处停止并独立验证
- 避免：模糊任务、同文件冲突、破坏独立性的跨故事依赖
