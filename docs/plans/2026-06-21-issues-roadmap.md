# X-Filter Issues Roadmap (#13–#29)

> **执行模式**：`/loop` 自动驱动，逐个 issue 开发，每个 issue 一个 PR。不使用 subagent。
> 每个 issue 在开发前**独立研究代码**验证其描述，再走 TDD 工作流。

**Goal:** 把 17 个 open issues（#13–#29）按依赖顺序逐个实现，每个产出一个独立 PR。

**Workflow per issue (superpowers):** 独立研究 → 轻量设计 → 建分支 → 写失败测试 → 实现 → `typecheck` + `test` 通过 → commit → push → 开 PR。

**Branch strategy（线性堆叠 / stacked PRs）：** 按依赖顺序逐个建分支，每个分支基于前一个分支（第一个基于 `main`），PR 的 base 设为前一分支。这样：
- 每个 PR 的 diff 只含该 issue 的改动；
- 依赖型 issue（#16、#25）能拿到前置功能；
- 测试始终跑在累积后的完整代码上。
- 合并时按从旧到新顺序合并，GitHub 会自动把后续 PR 的 base 改回 main。

---

## 依赖关系分析

硬依赖（代码层验证）：
- **#16**（Storybook 场景 demo）依赖 **#13**（ValidationDemo）、**#14**（Notion/GitHub token chips）、**#15**（ICMode）、**#17**（URL sync）。
- **#25**（键盘导航）依赖 **#13**（describedBy 错误节点）、**#19**（Ctrl+D clone）。

软依赖 / 同类机制：
- **#22**（readOnly 全局禁用）与 **#20**（lock 单节点禁用）共享 disable 机制。
- **#29**（Clear All）可与 **#23**（Undo/Redo）配合撤销清空。

其余多为独立功能，但多个 issue 触碰共享文件（`filter-builder.tsx`、`types.ts`、`mutations.ts`），线性堆叠可避免互相冲突。

## 开发顺序（拓扑排序，priority 作次级排序键）

| 顺序 | Issue | 标题 | 优先级 | 依赖 | 分支 |
|----|----|----|----|----|----|
| 1 | #13 | 行内校验闭环 | P0 | — | `feat/13-inline-validation` (base main) |
| 2 | #15 | IC 行级 Combinator | P0 | — (供 #16) | `feat/15-ic-combinator` |
| 3 | #14 | DSL 单行 Token 输入 | P0 | — (供 #16) | `feat/14-dsl-token-input` |
| 4 | #19 | Clone Rule/Group | P0 | — (供 #25) | `feat/19-clone-rule-group` |
| 5 | #18 | Presets / Saved Searches | P0 | — | `feat/18-presets` |
| 6 | #17 | URL 同步 Demo | P0 | — (供 #16) | `feat/17-url-sync-demo` |
| 7 | #20 | Lock/Disable | P0 | — | `feat/20-lock-disable` |
| 8 | #16 | Notion/GitHub Storybook Demo | P0 | 13,14,15,17 | `feat/16-storybook-demos` |
| 9 | #22 | Summary/ReadOnly View | P1 | (配 #20) | `feat/22-readonly-view` |
| 10 | #23 | Undo/Redo | P1 | — (供 #29) | `feat/23-undo-redo` |
| 11 | #21 | i18n 多语言 | P1 | — | `feat/21-i18n` |
| 12 | #24 | Import Filter UI | P1 | — | `feat/24-import-dialog` |
| 13 | #25 | Keyboard Navigation | P1 | 13,19 | `feat/25-keyboard-nav` |
| 14 | #28 | time/dateTime 字段类型 | P2 | — | `feat/28-time-datetime` |
| 15 | #26 | JsonLogic/MongoDB/ES 导出 | P2 | — | `feat/26-export-formats` |
| 16 | #27 | Responsive 移动端适配 | P2 | — | `feat/27-responsive` |
| 17 | #29 | Clear All + 空状态引导 | P2 | (配 #23) | `feat/29-clear-all` |

## 进度追踪

- [x] #13 行内校验闭环 → PR #30
- [x] #15 IC 行级 Combinator → PR #31
- [x] #14 DSL 单行 Token 输入 → ShadcnDslTokenInput + dsl-token-utils（defer: 点击编辑 popover / Tab 导航）
- [x] #19 Clone Rule/Group → core cloneRule/cloneGroup(+IC) + hook + shadcn/antd clone 按钮
- [x] #18 Presets / Saved Searches → useFilterPresets hook（localStorage + FIFO + serialize/deserialize）+ ShadcnPresetBar（save/load/二次确认删除）
- [x] #17 URL 同步 Demo → playground UrlSyncDemo（restore/write/parse-error 测试）+ Storybook Hooks/URL Sync story + README URL 同步章节
- [x] #20 Lock/Disable → PR #36：core `locked` 字段 + isLocked + 标准/IC mutation 守卫（update/remove/move/add/negate/setCombinator 锁定时静默忽略；clone 允许且解锁副本）+ ViewModel 暴露 locked + shadcn/antd 锁定禁用控件并隐藏 add/clone/remove（atomic+fallback）。defer: 锁定继承（子节点跟随父组锁定）、toJSON 序列化 locked
- [x] #16 Notion/GitHub Storybook Demo → 4 场景 Story（Scenarios/Notion·GitHub·IC Mode·Validation）+ scenario-data 共享 fixtures/演示用 evaluateFilter/结果联动表。复用 #13 校验、#14 DslTokenInput、#15 IC、#17 URL。验证：storybook build + 全量 typecheck。defer: 点击展开 popover 行内编辑、dark mode/locale 切换
- [x] #22 Summary/ReadOnly View → ShadcnFilterBuilder/AntdFilterBuilder 新增 `readOnly` prop：复用 #20 locked 渲染（viewmodel 在 readOnly 时强制所有节点 locked + 缓存失效），builder 层额外隐藏 DSL 编辑器 / 关闭 DnD。新增 react viewmodel 测试 + shadcn/antd readonly 集成测试 + Storybook `Scenarios/Read-only View` demo。验证：924 测试全过、覆盖率达标、storybook build。defer: 在 core mutation 层硬阻断（当前 readOnly 为 UI 视觉层，自定义 slot 仍可改）
- [x] #23 Undo/Redo → 新增 `useFilterHistory` hook（past/present/future 栈，`current`/`setFilter`/`undo`/`redo`/`canUndo`/`canRedo`/`clear`，`maxHistory` 默认 50，相同引用 no-op）。导出 + 10 个单测 + Storybook `Scenarios/Undo Redo` demo（工具栏按钮 + Ctrl/Cmd+Z / Shift+Z 快捷键）。验证：934 测试全过、覆盖率达标、storybook build。UI 快捷键留给消费者（按 issue「UI 可选」）
- [x] #21 i18n 多语言 → 内置 locale 包 `enUS`/`zhCN`/`jaJP`（均为 `Required<FilterBuilderLabels>`，编译期保证 key 齐全）+ `locales` 注册表 + `LocaleCode` 类型，从 @x-filter/react 导出。传给现有 `labels` prop 即可。新增 locales 单测（key parity / 非空 / 注册表）+ Storybook `Scenarios/i18n` 语言切换 demo + README 章节。验证：938 测试全过、覆盖率达标（注意：locale 测试需经 @x-filter/react 桶文件导入以覆盖 re-export getter）、storybook build
- [x] #24 Import Filter UI → 共享 `parseFilterInput`（react，DSL/JSON → Filter 判别式结果）+ `ShadcnImportFilterDialog`（自建 overlay dialog）/ `AntdImportFilterDialog`（antd Modal）：格式切换 DSL/JSON、解析、预览、确认导入、错误内联。新增 react 解析单测 + shadcn/antd 对话框集成测试 + Storybook `Scenarios/Import` demo。验证：955 测试全过、覆盖率达标、storybook build
- [x] #25 Keyboard Navigation → headless `useFilterKeyboardNav`（roving tabindex + WAI-ARIA tree 键盘语义：↑/↓、Home/End、Enter 进入控件、Esc 退回行、Delete 删除、Ctrl/Cmd+D 克隆）。Builder 整棵树渲染为 ARIA `tree`，每个 rule/group 是 `treeitem`（根分组本身也是 treeitem，以屏蔽其头部控件 + DnD live region，满足 `aria-required-children`），group 带 `aria-expanded`、聚焦行带 `aria-selected`；根分组不可键盘删除/克隆，readOnly 下禁用改动型快捷键但保留浏览。hook 全权拥有 ARIA 属性（spread 输出 `role`/`aria-*`）。新增 hook 单测 + shadcn/antd builder 集成测试 + Storybook `Scenarios/Keyboard Navigation` demo + README 章节。验证：976 测试全过、覆盖率达标、typecheck、biome
- [x] #28 time/dateTime 字段类型 → `FieldType` 扩展 `'time'`/`'dateTime'`；core 抽出 `temporalOperators`（equals/notEquals/before/after/between/isEmpty/isNotEmpty），date/time/dateTime 共用同一操作符集；`validate` 对 time/dateTime 复用 date 的字符串/区间校验；SQL 编译与 DSL 格式化天然按字符串参数透传（无需改动，加测试锁定）。UI value-editor（shadcn/antd）按字段类型映射原生 `<input type>`：date→`date`、time→`time`、dateTime→`datetime-local`（单值 + between 两值）。新增 core 测试（operators 8 种类型 / validate / to-sql / dsl roundtrip）+ shadcn/antd value-editor 原生输入测试。验证：990 测试全过、typecheck、biome
- [ ] #26 JsonLogic/MongoDB/ES 导出
- [ ] #27 Responsive 移动端适配
- [ ] #29 Clear All + 空状态引导

## 命令参考

- 测试：`pnpm test`（根目录 jest）
- 类型检查：`pnpm typecheck`
- Lint：`pnpm check`（biome）
