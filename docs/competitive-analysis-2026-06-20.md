# X-Filter 竞品分析报告

> 生成日期: 2026-06-20
> 对标竞品: React Query Builder, React Awesome Query Builder, Ant Design ProTable
> 规格对照: [specs/004-ui-modules/prd.md](../specs/004-ui-modules/prd.md)

---

## 一、能力矩阵

### 1.1 核心数据模型

| 能力 | core | react·UI | React QB | Awesome QB | 说明 |
|------|------|----------|----------|------------|------|
| 树形嵌套 Group | ✅ | ✅ | ✅ | ✅ | 基础能力 |
| IC (Infix Combinator) | ✅ | ❌ | ✅ | ❌ | core 有 FilterGroupIC + icMutationAdapter；useFilterBuilder 仅消费标准模式，UI 无行级 combinator |
| 取反 (Negate) | ✅ | ✅ | ✅ | ✅ | Rule/Group 均支持 |
| 结构共享 | ✅ | ✅ | ❌ | ❌ | 增量构造 + ViewModel === 复用 |
| ID 自动生成 | ✅ | ✅ | ✅ | ✅ | - |

### 1.2 字段类型

| 类型 | X-Filter | React QB | Awesome QB | 缺口 |
|------|----------|----------|------------|------|
| text | ✅ | ✅ | ✅ | - |
| number | ✅ | ✅ | ✅ | - |
| date | ✅ | ✅ | ✅ | - |
| select | ✅ | ✅ | ✅ | - |
| multiSelect | ✅ | ✅ | ✅ | - |
| boolean | ✅ | ✅ | ✅ | - |
| **time** | ❌ | ✅ | ✅ | 🟡 |
| **dateTime** | ❌ | ✅ | ✅ | 🟡 |
| **treeSelect** | ❌ | ❌ | ✅ | 🟡 |

### 1.3 操作符

| 操作符 | X-Filter | React QB | Awesome QB | 缺口 |
|--------|----------|----------|------------|------|
| equals / notEquals | ✅ | ✅ | ✅ | - |
| contains / notContains | ✅ | ✅ | ✅ | - |
| startsWith / endsWith | ✅ | ✅ | ✅ | - |
| isEmpty / isNotEmpty | ✅ | ✅ | ✅ | - |
| gt / gte / lt / lte | ✅ | ✅ | ✅ | - |
| between (ternary) | ✅ | ✅ | ✅ | - |
| before / after (date) | ✅ | ✅ | ✅ | - |
| **notBetween / in / notIn** | ❌ | ✅ | ✅ | 🟡 |
| **isNull / isNotNull / regex** | ❌ | ✅ | ✅ | 🟡 |
| 自定义操作符 | ✅ | ✅ | ✅ | 通过 OperatorDef |

### 1.4 导出/编译格式

| 格式 | X-Filter | React QB | Awesome QB | 缺口 |
|------|----------|----------|------------|------|
| SQL (参数化) | ✅ | ✅ | ✅ | - |
| JSON 序列化 | ✅ | ✅ | ✅ | - |
| DSL 文本 | ✅ | ❌ | ❌ | **独有优势** |
| **JsonLogic** | ❌ | ✅ | ✅ | 🟡 |
| **MongoDB / Elasticsearch** | ❌ | ✅ | ✅ | 🟡 |

### 1.5 UI 组件层

| 组件/能力 | X-Filter | React QB | Awesome QB | 说明 |
|-----------|----------|----------|------------|------|
| FilterBuilder (组合) | ✅ | ✅ | ✅ | - |
| RuleRow | ✅ | ✅ | ✅ | - |
| GroupBlock | ✅ | ✅ | ✅ | - |
| FieldSelector / OperatorSelector | ✅ | ✅ | ✅ | - |
| ValueEditor | ✅ | ✅ | ✅ | - |
| CombinatorSelector (Group 级) | ✅ | ✅ | ✅ | - |
| NotToggle | ✅ | ✅ | ✅ | - |
| DslEditor + Completion | ✅ | ❌ | ❌ | **独有** |
| **Remove 按钮** | ✅ | ✅ | ✅ | - |
| **Clone 按钮** | ❌ | ✅ | ✅ | 🔴 |
| **Lock/Disable 按钮** | ❌ | ✅ | ✅ | 🔴 |
| **IC 行级 Combinator** | ❌ | ✅ | ❌ | 🔴 core 有，UI 未接 |
| **Validation 行内视觉反馈** | ❌ | ✅ | ✅ | 🔴 ViewModel 有 errors/describedBy，缺行内 DOM |
| **Chips 摘要视图** | ❌ | ✅ | ❌ | 🟡 |
| **slots 全局自定义** (Root/Rule/ValueEditor…) | ✅ | ✅ | ✅ | render-prop 整体替换 |
| **按 field·type registry 覆盖** | ❌ | ✅ | ✅ | 🟡 特定字段自定义编辑器 |

---

## 二、与 PRD 004 差距

US-5~8 及交互要点。以下逐项对照仓库现状：

| PRD 条目 | 承诺 | 仓库现状 | 差距 |
|----------|------|----------|------|
| **US-5** DnD 跨层产品化 | shadcn/antd 两包均支持拖拽排序，跨层级拖拽行为一致 | `useReorderContract` 已实现；两包各有 `sortable-context.tsx`；但跨层落点反馈、键盘拖拽仍弱 | ⚠️ **部分交付** |
| **US-6** URL 同步 | filter ↔ URL 双向同步，支持 DSL/JSON mode | `useFilterUrlSync` hook 已实现（DSL/JSON 两种 mode），但 **playground 未使用**，无 URL 带参演示 | 🔴 **仅 hook，无 demo** |
| **US-7** 键盘与无障碍 | 关键操作均支持键盘触达，语义化 aria 标签 | `jest-axe` + DSL 键盘测试有；Builder 树 Tab/Arrow 不足；`describedBy` 无错误节点 | 🔴 **键盘路径不完整** |
| **US-8** Storybook Demo | Notion 风格 / GitHub inline 风格端到端 demo | `apps/storybook` 存在但 **缺 Notion·GitHub 故事**，仅有原子组件文档 | 🔴 **缺场景 demo** |
| **US-2~3 / 交互要点** DSL 单行范式 | 单行 token 式输入（类 GitHub search bar），inline 编辑效率为主 | 当前 `DslEditor` 是 **多行 textarea + Apply 按钮** 模式；Completion 有 token 替换逻辑但 UI 是自由文本 | 🔴 **范式不符** |

### 2.1 行内校验闭环

**现状**: `useFilterValidation` 产出 errors → orchestrator 传入 ViewModel → `rule.errors` 和 `rule.aria.describedBy` 已就绪。`RuleRow`、`ValueEditor` 无 `aria-invalid` 与错误文案渲染。Playground 仅侧栏 Validation 列表，无行内反馈。

**竞品**: React QB 的 `showError` + `validationMessage` 直接渲染在 rule 旁。

**补法**: `ShadcnFilterRule` 从 ViewModel 拿 errors，向下传递给 `ValueEditor`；`ValueEditor` 加 `aria-invalid` + `border-destructive` class + 错误文案 `<span>`。

### 2.2 IC 行级 Combinator

**现状**: core 的 `FilterGroupIC` 将 combinator 内联到 children（`[ruleA, 'and', ruleB]`），`icMutationAdapter` 提供统一 mutation 接口。但 `useFilterBuilder` 仅消费 `Filter`（标准模式），UI 无行间 combinator 选择器。

**竞品**: React QB 的 `showCombinatorsBetweenRules` 模式。

**补法**: 新增 `useFilterBuilderIC` hook + `InlineCombinator` 组件；或在 orchestrator 层加 `icMode` prop 统一调度。

### 2.3 DSL 单行范式

**现状**: `DslEditor` 是 `<textarea>` + `onCommit`（Apply 按钮）模式。Completion 有 token 替换能力（`replaceCurrentSegment`），但 UI 是自由文本编辑。

**PRD 承诺**: 类 GitHub search bar 的单行 token 输入，每个 segment 是可点击/删除的 chip。

**补法**: 新增 `DslTokenInput` 组件，消费 `useDslEditor` + `useDslEditorInteraction`，将解析后的 AST segments 渲染为 token chips。

### 2.4 Notion / GitHub Storybook

**现状**: playground 只有基础用法，storybook 仅有原子组件文档。

**补法**: 在 `apps/storybook` 新增 stories：
- `NotionFilter` — 紧凑 chips + inline editor
- `GitHubIssueFilter` — 筛选栏 + 结果联动
- `ICMode` — 行间 combinator 演示

### 2.5 URL 同步 Demo

**现状**: `useFilterUrlSync` hook 已实现（DSL/JSON 两种 mode），但 playground 未使用，无 URL 带参演示。

**补法**: playground 加一个带 URL sync 的 tab，或在 Storybook 加 story 演示 `?filter=` 参数。

---

## 三、竞品 P0 缺口 (非 PRD 承诺，但竞品标配)

### 3.1 Clone / Duplicate Rule & Group

**现状**: 无 clone 机制。**竞品**: React QB 每个 rule 旁有 clone 按钮。

**补法**:
```typescript
// core mutations
cloneRule(filter: Filter, ruleId: string): Filter
cloneGroup(filter: Filter, groupId: string): Filter
```

### 3.2 Lock / Disable

**现状**: 无锁定/禁用机制。**竞品**: 锁定后不可编辑但可见，用于预设条件。

**补法**: `FilterRule.locked?: boolean` + UI 层 disabled 样式。

### 3.3 Presets / Saved Searches

**现状**: 无内置预设管理。**竞品**: Awesome QB 有 `stored tree`。

**补法**: `useFilterPresets` hook（localStorage）+ UI preset 下拉。

---

## 四、P1 缺口 (近期补齐)

| 缺口 | 说明 |
|------|------|
| **Undo / Redo** | 历史栈 hook，误操作回退 |
| **i18n** | `labels` prop 部分覆盖，缺内置多语言 |
| **Summary / ReadOnly View** | `readOnly` prop 禁用编辑，仅展示 |
| **Import Filter UI** | JSON/DSL 导入对话框 |
| **Keyboard Navigation** | Builder 树的 Tab/Arrow 键导航 |

---

## 五、P2 缺口 (按需)

| 缺口 | 说明 |
|------|------|
| time / dateTime 字段类型 | 时间筛选场景 |
| JsonLogic / MongoDB 导出 | 规则引擎 / NoSQL 场景 |
| Responsive 移动端适配 | 当前固定 flex 布局 |
| Clear All / 空状态引导 | 体验优化 |

---

## 六、独有优势

| 优势 | 说明 |
|------|------|
| **DSL 引擎** | tokenizer + parser + completion，竞品无内置 |
| **Headless 架构** | `@x-filter/react` 纯逻辑，UI 完全解耦 |
| **增量构造 + 增量渲染** | ViewModel `===` 复用，性能领先 |
| **双 UI 框架** | shadcn + antd 同时支持 |
| **AST 双向转换** | Filter ↔ AST ↔ DSL 完整管道 |

---

## 七、优先级总览 (双轨)

```
PRD 承诺 (已批准规约):
  ├── 行内校验闭环        → ViewModel 就绪，缺行内 DOM
  ├── IC 行级 combinator  → core 就绪，缺 UI
  ├── DSL 单行 token 范式  → 当前是 textarea + Apply
  ├── Notion·GH Storybook → 缺场景 demo
  └── URL 同步 demo       → hook 就绪，缺演示

竞品标配 (用户高频):
  ├── Clone Rule/Group    → 无 clone 机制
  ├── Lock/Disable        → 无锁定机制
  └── Presets API         → 无预设管理

P1 (近期):
  ├── Undo/Redo
  ├── i18n 基础
  ├── Summary View
  └── Import Filter UI

P2 (按需):
  ├── time/dateTime 类型
  ├── JsonLogic 导出
  └── Responsive
```

---

## 八、结论

**双轨缺口**：PRD 004 的 US-5~8 + 行内校验 / IC 中，DnD 部分交付，URL / 键盘 / Storybook / DSL 范式 / 行内校验 / IC 均未闭环（hook 层就绪但 UI 层缺交付）。竞品标配的 Clone / Lock / Presets 同样缺失。

**差异化优势明确**：DSL 引擎、Headless 架构、增量渲染、双 UI 框架是竞品没有的。这些优势在补齐缺口后会形成更强的产品力。

**建议**：先闭合 PRD 承诺（行内校验 → IC → DSL 范式 → Storybook → URL demo），再补竞品标配（Clone → Lock → Presets）。PRD 缺口是已批准的交付义务，优先级高于竞品追赶。
