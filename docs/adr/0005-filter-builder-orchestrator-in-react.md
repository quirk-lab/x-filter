# ADR 0005: FilterBuilder 编排器住在 @x-filter/react

## Context

`@x-filter/shadcn` 和 `@x-filter/antd` 两个 UI 包存在约 70% 行级重复。以下逻辑在两个包中逐字相同：

- `rule-defaults.ts`（字段变更时的默认规则更新）—— 100% 相同
- `sortable-context.tsx`（DnD 排序上下文）—— 100% 相同
- `operator-selector` 中的 `findSchemaField` / `getFieldOperators` 工具函数 —— 100% 相同
- `value-editor` 中的值转换工具（`asStringValue`、`asArrayValue`、`parseNumberInput` 等）—— 100% 相同
- `dsl-editor` 中的键盘处理和补全文本替换逻辑（`needsStringQuoting`、`formatCompletionValue`、`replaceCurrentSegment`、`handleKeyDown`）—— 100% 相同
- `filter-builder.tsx` 中约 400 行编排逻辑（`canUseAtomicRule`/`canUseAtomicGroup` 启发式、`actions` useMemo、`renderRule`/`renderGroup`/`renderNode`、`moveChild`、`handleSortableMove`、`renderMoveControls`）—— 仅 UI 原语引用不同

PRD US-4 原文写"仅导出原子组件，不导出官方高阶组合组件"，且约束 `@x-filter/react` "无 UI / 无 DnD 库耦合"。2026-05-28 设计文档已修正为"提供原子组件 + 可选完整 FilterBuilder"。当前代码已交付 `ShadcnFilterBuilder`/`AntdFilterBuilder`，playground 与 storybook demo 依赖它们。

重复使得 shadcn 与 antd 功能漂移不可避免——任何 bug 修复、键盘行为调整、值转换修正都要在两处同步，遗漏一处即产生行为差异，违反 PRD"两个包功能完整等价"的要求。

## Decision

将 FilterBuilder 的框架无关编排逻辑提升到 `@x-filter/react`，作为 headless 编排器（render-prop 组件 + 纯工具函数）。UI 包的 `FilterBuilder` 组合件缩减为：把 UI 原语接到编排器的 render-prop 上。

### 编排器边界

- **允许**：渲染原生 HTML 元素（`<div>`、`<button>`、`<fieldset>` 等）作为无样式语义结构。
- **允许**：消费 `useFilterBuilder`/`useFilterViewModel`/`useReorderContract` 的输出。
- **允许**：输出 render-prop 回调和 slot 派发。
- **禁止**：导入 `antd`、`shadcn`、`@dnd-kit` 或任何样式化组件库。
- **禁止**：输出带 className 的样式化组件。

### 导出可见性

全部新增内容通过主 `index.ts` 公开导出，不引入子路径多入口（避免 tsup 多入口和 `exports` 字段的构建复杂度）。内部启发式用 `/** @internal */` JSDoc 标注，向消费者传达"别依赖这个"：

- **无标注（公共 API）**：`useDslEditorInteraction`、值转换工具（`asStringValue`/`asArrayValue`/`asPairValue`/`parseNumberInput`/`updatePairValue`）、DSL 补全工具（`needsStringQuoting`/`formatCompletionValue`/`replaceCurrentSegment`）——终端消费者自定义 DSL 编辑器或 value editor 时可能直接用。
- **`@internal` 标注**：`useFilterBuilderOrchestrator`、`resolveRuleRender`/`resolveGroupRender`、`canUseAtomicRule`/`canUseAtomicGroup`、`findSchemaField`/`getFieldOperators`/`findOperator`、`getDefaultRuleUpdatesForField`——UI 包编排内部契约，未来调整不应受消费者兼容性约束。

### 编排器 API 形态：混合方案

采用三层分离，避免把 JSX 结构锁死在 react 包（两包 fallback 结构本就该不同）：

1. **纯工具函数**（无 React、无状态）——直接导出：
   - `getDefaultRuleUpdatesForField`
   - schema 查询：`findSchemaField`、`getFieldOperators`、`findOperator`（三者构成 schema 查询工具族，放在一起）
   - 值转换：`asStringValue`、`asArrayValue`、`asPairValue`、`parseNumberInput`、`updatePairValue`
   - **不提取**（UI 原语契约适配器，签名不同或仅单包使用）：shadcn 的 `asNumberInputValue`（返回 `number | string`）、`selectedValues`（原生 DOM）；antd 的 `asOptionalNumber`（返回 `number | undefined`）。标准：两包逐字相同的才提取，不同的留各自。
   - DSL 补全：`needsStringQuoting`、`formatCompletionValue`、`replaceCurrentSegment`
   - 启发式：`canUseAtomicRule`、`canUseAtomicGroup`
   - 渲染决策：`resolveRuleRender`（输入 slots+classNames+resolvedLabels，输出 `'slot' | 'atomic' | 'fallback'`）、`resolveGroupRender`（同上）。纯决策函数，不执行任何分支、不调用 slot 回调、不返回 ReactNode。UI 包拿到 mode 后自己组装对应分支的 JSX。

2. **有状态纯逻辑 hook**：
   - `useFilterBuilderOrchestrator`：
     - 输入：原始 props（`value`、`defaultValue`、`onChange`、`schema`、`errors`）
     - 内部调用 `useFilterBuilder`/`useFilterViewModel`/`useReorderContract`
     - 输出：`builder`/`viewModel`/`reorder`（透传，供 DslEditor 等需要直接访问的组件用）+ `actions`（memoized handlers）、`moveChild`、`canMoveChild`、`handleSortableMove`、`slotProps`（编排闭包）
     - **不渲染任何 JSX**，只返回数据和闭包
   - `useDslEditorInteraction`：
     - 输入：`useDslEditor` 的返回值
     - 内部管理 `cursor`/`isCompletionOpen`/`activeIndex` 三个 state
     - 输出：`handleKeyDown`、`applyCompletion`、`handleChange`、`updateCursor`、`visibleCompletions`、`activeIndex`、`isCompletionOpen`、`setIsCompletionOpen`
     - 职责：补全菜单的 UI 交互状态与键盘/事件处理，与 `useDslEditor`（纯数据层：draftDSL/parseError/completions/commit）分离
     - **不渲染任何 JSX**，只返回数据和闭包

3. **JSX 组装保留在 UI 包**：
   - `renderRule`/`renderGroup`/`renderNode` 的 fallback JSX 结构留在 UI 包（shadcn 用 `<fieldset>`+`cn()`，antd 用 `<Space>`，本就该不同）
   - UI 包调用 `resolveRuleRender`/`resolveGroupRender` 判断分支，调用 `useFilterBuilderOrchestrator` 拿 actions/move 闭包，然后自己组装 JSX
   - 重复的是决策逻辑（已消除），不重复的是 JSX 结构（本就该不同）
   - **例外**：`renderMoveControls`（原生 `<button>`，两包逐字相同，无 UI 库差异）搬进 react 包作为纯函数组件 `<MoveControls>`，接收 orchestrator 的 `canMoveChild`/`moveChild` 闭包作为 props。符合编排器边界（原生 HTML 元素允许）。UI 包在 `renderGroup` 里把它放进 `<SortableFilterItem>` 内部。

### 保留在 UI 包的内容

- 所有原子组件（FieldSelector、OperatorSelector、ValueEditor、CombinatorSelector、NotToggle、RuleRow、GroupBlock、DslEditor、CompletionMenu）
- `sortable-context.tsx`（`@dnd-kit` 实现）——两包各保留一份，接受 54 行无害重复。理由：纯 `@dnd-kit` API 胶水，不含业务逻辑或会漂移的决策；搬进 `@x-filter/react` 违反 US-5"react 不依赖 @dnd-kit"；新建 `@x-filter/dnd` 包对 54 行代码过度工程化。
- `FilterBuilder` 组合件（缩减为：调用共享 hook + 调用共享决策函数 + 组装 fallback JSX + 注入原子组件到 slots）

## Alternatives Considered

- **(A) 直接宣布 PRD US-4 过时**：拒绝。PRD 是批准的规约，单方面废弃不留决策痕迹，未来读者会困惑。应通过勘误澄清范围，而非废弃。
- **(C) 移除 FilterBuilder 组合件，回归纯原子导出**：拒绝。组合件已交付并被 playground/storybook 依赖，回退破坏消费者。且 US-4"原子组件"本意是保留组合自由，不是禁止便利层。
- **不处理重复，依赖共享行为测试矩阵兜底**：拒绝。测试只能检测漂移，不能消除漂移根源。每次修改仍需两处同步，认知负担和遗漏风险持续存在。

## Migration Strategy

自底向上分步迁移，每一步提取后 UI 包改导入、删除本地副本、跑现有测试验证行为不变。前 4 步测试不动（现有测试验证行为不变），最后一步才动测试分层。每一步 diff 小、可 review、可回退。

1. **提取纯工具函数**：`rule-defaults.ts`、`schema-utils.ts`（`findSchemaField`/`getFieldOperators`/`findOperator`）、`value-utils.ts`（`asStringValue`/`asArrayValue`/`asPairValue`/`parseNumberInput`/`updatePairValue`）、`dsl-completion-utils.ts`（`needsStringQuoting`/`formatCompletionValue`/`replaceCurrentSegment`）→ react 包新增文件 + `index.ts` 导出 → UI 包删除本地副本，改从 `@x-filter/react` 导入 → 跑现有测试，绿
2. **提取 `useDslEditorInteraction`**：react 包新增 `use-dsl-editor-interaction.ts` → UI 包 `dsl-editor.tsx` 删除本地 `useState` + 事件闭包，改用 hook → 跑现有测试，绿
3. **提取 `canUseAtomic*` + `resolveRuleRender`/`resolveGroupRender`**：react 包新增 `render-decisions.ts` → UI 包 `filter-builder.tsx` 删除本地启发式，改用共享决策函数 → 跑现有测试，绿
4. **提取 `useFilterBuilderOrchestrator`**：react 包新增 `use-filter-builder-orchestrator.ts` → UI 包 `filter-builder.tsx` 删除三个 hook 调用 + `actions` memo + `moveChild`/`handleSortableMove`/`canMoveChild`，改用 orchestrator → 跑现有测试，绿
5. **测试重组**：编排行为测试移到 react 包（新增 `use-filter-builder-orchestrator.spec.tsx`、`render-decisions.spec.ts`、`use-dsl-editor-interaction.spec.tsx`、工具函数单测）→ UI 包 `filter-builder.spec.tsx`/`dsl-editor.spec.tsx` 缩减为仅渲染特定项 → 跑全部测试，绿

## Consequences

- UI 包代码量大幅缩减，`FilterBuilder` 组合件从约 400 行降到预计 50-80 行（仅 slot 连接）。
- bug 修复、键盘处理、值转换集中在一处，shadcn/antd 行为等价由结构保证而非测试兜底。
- `@x-filter/react` 新增编排器组件和工具函数导出，包体积略增，但不引入 UI 库依赖。
- `@x-filter/react` 的"无 UI"约束需要重新澄清为"无样式化组件 / 无 UI 库耦合"，原生 HTML 元素允许。此澄清通过 CONTEXT.md 术语条目和 PRD US-4 勘误落地。

### 测试重新分层

- **移到 `@x-filter/react`**（编排逻辑单测）：
  - `use-filter-builder-orchestrator.spec.tsx`：actions memo、moveChild 索引计算、canDrop 规则、handleSortableMove
  - `render-decisions.spec.ts`：canUseAtomicRule/canUseAtomicGroup、resolveRuleRender/resolveGroupRender 决策
  - `use-dsl-editor-interaction.spec.tsx`：键盘状态机（Escape/ArrowDown/ArrowUp/Enter）、补全应用、cursor 跟踪
  - 纯工具函数单测：rule-defaults、schema-utils、value-utils、dsl-completion-utils
- **留 UI 包但缩减**：
  - `filter-builder.spec.tsx`：仅保留 UI 渲染特定项（value editor 各 field type 渲染、classNames 到 DOM、slot 渲染替换）；删除编排行为测试（add rule、controlled updates、moveItem、canDrop、atomic rule controls 等——这些移到 react 包）
  - `dsl-editor.spec.tsx`：仅保留渲染断言（listbox 出现、classNames、`dsl` prop 开关）；删除键盘/补全行为测试（移到 react 包）
- **不动**：`adapter-contract.spec.tsx`（4 个基础 wiring 烟测）、`atomic-components.spec.tsx`、`a11y.spec.tsx`、`dnd-contract.spec.tsx`——本就是 UI 特定的
