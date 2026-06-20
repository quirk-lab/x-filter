# X-Filter Domain Glossary

本文件是术语表，仅定义领域概念，不包含实现细节。

## 术语

### Headless 编排器（Headless Orchestrator）

住在 `@x-filter/react` 的框架无关编排逻辑。它消费 `useFilterBuilder`/`useFilterViewModel`/`useReorderContract` 的输出，承担 action dispatch、DnD 语义连接、atomic-rule/atomic-group 启发式判断、renderRule/Group/Node 派发。

边界：可渲染原生 HTML 元素（`<div>`、`<button>`、`<fieldset>` 等）作为无样式语义结构；**禁止**导入 `antd`、`shadcn`、`@dnd-kit` 或任何样式化组件库；**禁止**输出带 className 的样式化组件。

区别于：
- **原子组件（Atomic Component）**：UI 包导出的单个样式化控件（FieldSelector、OperatorSelector、ValueEditor 等），是消费者自行组合的公开 API。
- **组合件（Composite / FilterBuilder）**：UI 包导出的便利层，把原子组件接到编排器上，提供开箱即用的完整筛选器。是可选的，不是主 API。

### Filter Tree

过滤树，整个系统的单一真相源。由 `FilterGroup`（组合节点）和 `FilterRule`（叶子节点）递归构成。DSL 草稿、URL 同步、DnD 操作最终都写回树。

### DSL 草稿（draftDSL）

用户在 inline DSL 编辑器中输入的文本。解析成功才同步到 Filter Tree；解析失败保留草稿且不覆盖树。树始终是真相源，草稿只是待提交的候选。

### FieldSchema

字段规约，描述一个可过滤字段的名称、类型、可用操作符、默认值、候选值。DSL 语义、操作符候选、值编辑器形态全部由 schema 驱动，不内置任何领域字段预设。
