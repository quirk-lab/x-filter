# Feature Specification: Monorepo 初始化与基础设施

**Feature Branch**: `002-monorepo-init`  
**Created**: 2026-01-01  
**Status**: Draft  
**Input**: 用户描述：基于 pnpm workspace 建立标准 Monorepo 结构，统一工具链（Biome, Tsup），构建完整依赖链路

---

## 背景与动机

当前项目 `x-filter` 处于初期阶段，文件结构尚未完全规范化。为了支撑未来核心逻辑（Core）、React 适配层（React）以及不同 UI 库适配（Shadcn/Antd）的并行开发与测试，需要构建一个健壮的 Monorepo 架构。

此外，现有的工程化配置（ESLint/Prettier/Build）较为分散，需要统一工具链以提升开发效率和代码质量。

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 开发者安装与启动项目 (Priority: P1)

作为开发者，我希望能够一键安装所有依赖并启动开发环境，以便快速开始工作。

**Why this priority**: 这是所有开发工作的前提条件，没有可用的开发环境，其他所有功能都无法进行。

**Independent Test**: 克隆仓库后执行 `pnpm install && pnpm dev`，能够成功启动 playground 应用并在浏览器中访问。

**Acceptance Scenarios**:

1. **Given** 全新克隆的仓库，**When** 执行 `pnpm install`，**Then** 所有依赖成功安装，无报错
2. **Given** 依赖已安装，**When** 执行 `pnpm dev`，**Then** playground 应用成功启动，可在浏览器访问
3. **Given** 依赖已安装，**When** 执行 `pnpm build`，**Then** 所有包成功构建，无报错

---

### User Story 2 - 开发核心库并实时预览 (Priority: P1)

作为开发者，我希望修改 `packages/core` 中的代码时，能在 `apps/playground` 中实时看到变化，以便快速验证功能。

**Why this priority**: 实时反馈是高效开发的核心需求，直接影响开发效率。

**Independent Test**: 修改 `@x-filter/core` 中的导出内容，保存后 playground 自动刷新并显示更新。

**Acceptance Scenarios**:

1. **Given** playground 正在运行，**When** 修改 `packages/core` 中的代码并保存，**Then** playground 自动检测到变化并刷新
2. **Given** playground 正在运行，**When** 在 core 中新增导出函数，**Then** playground 可立即导入并使用该函数
3. **Given** core 包已构建，**When** 在 playground 中引用 core，**Then** TypeScript 类型提示正常工作

---

### User Story 3 - 依赖链路验证 (Priority: P1)

作为开发者，我希望验证完整的包依赖链路（Utils -> Core -> React -> UI -> Apps）是否正确打通，以确保架构设计正确。

**Why this priority**: 依赖链路是 Monorepo 架构的核心，必须在初期就验证通过。

**Independent Test**: 在 playground 中成功导入并使用来自 core、shadcn 或 antd 的导出内容。

**Acceptance Scenarios**:

1. **Given** 所有包已构建，**When** playground 导入 `@x-filter/core`，**Then** 导入成功且功能正常
2. **Given** 所有包已构建，**When** playground 导入 `@x-filter/react`，**Then** React hooks/组件可正常使用
3. **Given** 所有包已构建，**When** playground 导入 `@x-filter/shadcn` 或 `@x-filter/antd`，**Then** UI 组件可正常渲染
4. **Given** utils 被 core 依赖，**When** core 调用 utils 的函数，**Then** 函数执行正确

---

### User Story 4 - 代码规范检查与提交 (Priority: P2)

作为开发者，我希望提交代码时自动检查代码规范，以确保代码风格统一且无错误。

**Why this priority**: 代码规范是团队协作的基础，但可以在核心功能完成后再完善。

**Independent Test**: 提交包含格式问题的代码时，Husky 触发 Biome 检查并阻止提交。

**Acceptance Scenarios**:

1. **Given** Husky 已配置，**When** 提交代码，**Then** Biome 自动运行检查
2. **Given** 代码存在格式问题，**When** 尝试提交，**Then** 提交被阻止并显示错误信息
3. **Given** 代码符合规范，**When** 执行 `pnpm lint`，**Then** 检查通过，无报错

---

### User Story 5 - CI 流水线验证 (Priority: P2)

作为开发者，我希望推送代码后 GitHub Actions 自动运行构建和检查，以确保代码质量。

**Why this priority**: CI 是持续集成的保障，确保所有合并的代码都经过验证。

**Independent Test**: 推送代码后 GitHub Actions 的 lint 和 build 步骤全部通过。

**Acceptance Scenarios**:

1. **Given** 代码已推送到远程分支，**When** GitHub Actions 触发，**Then** ci.yml 开始执行
2. **Given** CI 正在执行，**When** lint 步骤完成，**Then** Biome 检查通过
3. **Given** CI 正在执行，**When** build 步骤完成，**Then** 所有包构建成功
4. **Given** CI 全部完成，**When** 查看状态，**Then** 所有检查项显示绿色（Success）

---

### Edge Cases

- **循环依赖**: 如果包之间产生循环引用，构建应明确报错并提示问题位置
- **类型丢失**: 如果 tsup 未正确生成 `.d.ts` 文件，消费端导入时应有明确的类型错误提示
- **依赖版本冲突**: 如果同一依赖在不同包中版本不一致，pnpm 应发出警告
- **构建顺序错误**: 如果依赖包未先构建，构建应失败并提示依赖关系

---

## Requirements *(mandatory)*

### Functional Requirements

#### 架构与结构

- **FR-001**: 系统必须使用 pnpm workspace 管理 Monorepo
- **FR-002**: 系统必须支持 `packages/*` 和 `apps/*` 两级目录结构
- **FR-003**: 系统必须包含以下核心包：
  - `@x-filter/utils` - 底层工具函数
  - `@x-filter/core` - 核心过滤逻辑
  - `@x-filter/react` - React 适配层
  - `@x-filter/shadcn` - Shadcn UI 组件
  - `@x-filter/antd` - Ant Design 组件
- **FR-004**: 系统必须包含以下应用：
  - `apps/playground` - 开发调试应用
  - `apps/web` - 官网空壳（仅基础脚手架）

#### 构建与输出

- **FR-005**: Library 类包必须使用 tsup 进行构建
- **FR-006**: App 类包必须使用 vite 进行构建
- **FR-007**: Library 构建输出必须包含：
  - `.mjs` (ESM 格式)
  - `.js` (CJS 格式)
  - `.d.ts` (TypeScript 类型定义)
- **FR-021**: Library 类包必须在 `package.json` 中配置 `exports` 字段，明确 ESM/CJS 和类型导出路径
- **FR-008**: 所有包必须在 `tsconfig.json` 中开启 `strict: true`

#### 依赖链路

- **FR-009**: 系统必须支持完整的依赖链路：Utils -> Core -> React -> UI -> Apps
- **FR-010**: 系统必须确保包间引用时类型提示正常工作
- **FR-019**: 系统必须在根目录提供 `tsconfig.base.json`，各子包需继承此基础配置以保持一致性
- **FR-020**: 包间相互引用时，必须统一使用 `workspace:*` 协议

#### 工具链

- **FR-011**: 系统必须使用 Biome 进行代码规范检查和格式化
- **FR-012**: 系统禁止使用 ESLint 和 Prettier
- **FR-013**: 系统必须配置 Husky 进行 Git hooks 管理
- **FR-014**: 提交代码时必须自动触发 Biome 检查

#### 脚本命令

- **FR-015**: 系统必须支持以下根目录命令：
  - `pnpm install` - 安装所有依赖
  - `pnpm build` - 构建所有 packages 和 apps
  - `pnpm dev` - 启动 playground 进行调试
  - `pnpm lint` - 使用 Biome 检查全仓库代码

#### CI/CD

-   **FR-016**: 系统必须配置针对所有分支 push 和 PR 触发的 GitHub Actions `ci.yml`
-   **FR-017**: CI 必须包含 lint 和 build 两个步骤
-   **FR-018**: CI 成功执行后状态必须显示为 Success

---

## Clarifications

### Session 2026-01-01
- Q: 是否需要根目录 tsconfig.base.json 来统一控制所有包的基础编译选项？ → A: 创建 `tsconfig.base.json`：在根目录定义通用配置，各子包通过 `extends` 继承。
- Q: 包间引用是否统一使用 `workspace:*` 协议？ → A: 统一使用 `workspace:*`：包间相互引用时，版本号占位符统一使用星号。
- Q: Library 类包是否需要详细配置 `exports` 字段以精确控制 ESM/CJS 的入口？ → A: 统一配置 `exports`：在 Library 类包中使用 `exports` 字段定义 ESM、CJS 和 Types 入口。
- Q: GitHub Actions CI 的触发策略为何？ → A: 全量触发：对所有分支的 push 和 PR 均触发 CI。

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-006**: 代码库中不存在 `.eslintrc`、`.prettierrc` 等旧配置文件
- **SC-007**: Biome 配置文件 (`biome.json`) 存在于根目录并正确配置
- **SC-008**: 所有 Library 包的 `dist/` 目录均包含 `.mjs`、`.js` 和 `.d.ts` 文件

---

## Constraints & Rules

- **包管理器**: 必须使用 pnpm，禁止使用 npm 或 yarn
- **工具链**: 禁止使用 ESLint 和 Prettier，必须全量迁移至 Biome
- **构建工具**: 库文件必须使用 tsup，应用必须使用 vite
- **类型安全**: 所有包必须开启 `strict: true` 并生成类型定义
- **Node 版本**: 需要 Node.js 18+ 以支持现代 ESM 特性

---

## Out of Scope

- **具体业务功能**: 本次不包含 Query Builder 的具体复杂逻辑实现，仅保证代码能跑通、包能被引用
- **自动化发版**: 版本号暂时手动管理，不配置 Changesets，**将在后续迭代中通过专门功能补齐**
- **官网内容**: apps/web 仅搭建空壳（基础脚手架），不填充具体文档内容
- **测试框架配置**: 单元测试框架（如 Vitest）不在本次范围内，**将在 `003-test-infrastructure` 功能中专门处理以满足 Constitution 的测试覆盖率要求**

---

## Dependencies & Assumptions

### Dependencies

- pnpm 9.x+ 作为包管理器
- Node.js 18+ 运行环境
- GitHub 仓库用于代码托管和 CI
- Git 用于版本控制

### Assumptions

- 开发者已安装 pnpm 和 Node.js
- 开发者熟悉 TypeScript 和 React 基础
- 网络环境能够正常访问 npm registry
- 现有代码结构可以安全重组

---

## Relationship to Existing Features

这是一次**基础设施重构**，将现有的散乱文件组织成结构化的 Monorepo。该功能为后续所有功能开发奠定基础：

- **Query Builder Core**: 将迁移到 `@x-filter/core`
- **React Hooks**: 将迁移到 `@x-filter/react`
- **UI Components**: 将分别迁移到 `@x-filter/shadcn` 和 `@x-filter/antd`
