# 交互 Research：Notion / GitHub / GitLab Filter

**Feature**: 004-ui-modules  
**Created**: 2026-03-17  
**Status**: Draft

---

## 1. 研究目标

本研究只回答一个问题：
- Notion / GitHub / GitLab 的 filter 交互里，哪些行为可抽象为 `x-filter` 的通用交互规范？

本研究不做视觉样式复刻，不做语义字段兼容（如 `is:open` 内建语义）。

---

## 2. 来源与证据（官方文档）

### 2.1 Notion（数据库筛选）

已确认行为：
- 支持高级筛选分组，可混合 `AND` / `OR`。
- 高级筛选支持嵌套，官方说明最多 3 层。
- 可把简单筛选转为高级筛选。

对 `x-filter` 的启发：
- 分组编辑必须是一级能力，不是附加插件。
- 需要“从简单到高级”的渐进式交互（先 rule，后 group）。

### 2.2 GitHub（Issues/PR 过滤搜索）

已确认行为：
- 过滤输入支持 inline query，输入时给 qualifier 建议、值建议、错误提示。
- 支持布尔 `AND` / `OR`，空格可视为 `AND`。
- 支持括号嵌套，官方说明最多 5 层。
- 标签支持逗号语法表达 OR（`label:"bug","wip"`）。
- 支持负向过滤（`-author:...`）。
- 支持键盘聚焦搜索框（站点范围 `S` 或 `/`）。

对 `x-filter` 的启发：
- Inline 输入必须是“可编辑语言”，不是纯文本框。
- 建议系统和错误反馈需要实时。
- 布尔逻辑与分组必须和树结构互通。

### 2.3 GitLab（Issues 列表过滤）

已确认行为：
- 使用 `Search or filter results` 入口，通过属性 -> 操作符 -> 值 的交互构造过滤。
- 多个过滤属性默认 `AND` 连接。
- 对部分属性支持 `||`（is one of）实现 inclusive OR。
- 支持通过 `#ID` 快速定位 issue。
- 标题/描述文本过滤依赖全文检索，并存在语义匹配限制。

对 `x-filter` 的启发：
- “字段-操作符-值”三段式编辑器是通用高可用形态。
- OR 不一定总是全局布尔，属性内 OR 很常见（多值匹配）。
- 文本搜索与结构化条件应可组合。

---

## 3. 抽象出的交互原语

1. **三段式条件编辑**：Field -> Operator -> Value。
2. **逻辑分组**：AND/OR + 嵌套 group。
3. **Inline DSL 编辑**：支持直接输入和实时反馈。
4. **建议系统**：字段、操作符、候选值分层补全。
5. **错误弹性**：非法输入不污染已生效条件。
6. **多值 OR**：同字段可表达“任一命中”。
7. **键盘优先**：补全导航、提交、撤销、焦点回退可全键盘完成。
8. **可排序结构**：rule/group 支持拖拽重排。

---

## 4. 落地为 x-filter 的交互决策

以下为本项目采用的行为决策（结合已确认 PRD 边界）：

### 4.1 双编辑模型

- `Tree` 是唯一真相源。
- `DSL` 是可编辑视图。
- DSL 解析成功才提交到 Tree；失败时保留 `draftDSL` + `parseError`。

### 4.2 DSL 语法能力（v1）

- 支持括号分组。
- 支持引号与转义。
- 支持数组字面量。
- 支持范围语法。
- 支持显式 `AND/OR/NOT`。
- 不内置 GitHub/GitLab 语义字段；字段语义完全来自 `FieldSchema`。

### 4.3 Inline 建议与输入节奏

- 输入后按上下文触发补全：
  - 期待字段位置 -> 字段建议
  - 期待操作符位置 -> 操作符建议
  - 期待值位置 -> 候选值建议（schema values）
- 键盘行为：
  - `ArrowUp/Down` 选择建议
  - `Enter` 提交建议或提交当前表达式
  - `Esc` 关闭建议
- 非法输入时：
  - 不改动当前 Tree
  - 明确显示错误位置与原因

### 4.4 树形编辑器行为

- 支持新增/删除 Rule。
- 支持新增/删除 Group（不可删除根组）。
- 支持 Group/Rule 级别 `NOT`。
- 支持 rule/group 拖拽排序与层级变更。

### 4.5 URL 同步

- 提供工具 hook。
- 默认编码为 DSL。
- URL 反序列化失败时回退默认值并暴露错误状态。

### 4.6 包边界

- `@x-filter/core/dsl`：parser/formatter/completion（框架无关）。
- `@x-filter/react`：headless 状态和行为契约（受控/非受控、URL sync、reorder contract）。
- `@x-filter/shadcn`、`@x-filter/antd`：原子组件 + 各自 DnD 接入（`@dnd-kit`），功能等价。
- 高阶组合风格（Notion/GitHub）只放 `apps/storybook` demo，不导出官方组合组件。

---

## 5. 明确不做（v1）

- 不做 GitHub/GitLab qualifier 语义兼容层。
- 不做官方高阶组合组件导出。
- 不做非 React UI 运行时支持。

---

## 6. 仍需产品验收的交互细节（实现前冻结）

以下不是技术不确定性，而是产品手感参数，需要在实现前冻结：

- DSL 解析触发时机：`onChange` 实时防抖 vs `Enter/Blur` 提交。
- 自动补全提交后是否自动补空格/逻辑连接词。
- DnD 占位与层级阈值规则（进入子组的手势阈值）。
- 移动端下 inline 与 DnD 的优先手势。

建议把上述细节补充进 `apps/storybook` 的交互 playground controls，边开发边校准。

---

## 7. 参考链接

- Notion: Using advanced database filters  
  https://www.notion.com/help/guides/using-advanced-database-filters
- Notion: Views, filters, sorts & groups  
  https://www.notion.com/help/views-filters-and-sorts
- GitHub: Filtering and searching issues and pull requests  
  https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/filtering-and-searching-issues-and-pull-requests
- GitHub: Keyboard shortcuts  
  https://docs.github.com/en/get-started/accessibility/keyboard-shortcuts
- GitLab: Manage issues  
  https://docs.gitlab.com/user/project/issues/managing_issues/
