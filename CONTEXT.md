# X-Filter Core

Filter query builder 的框架无关核心：定义 Filter 树模型、变更、验证与序列化。

## Language

**Filter**:
一棵表达查询条件的不可变树，根为 group。
_Avoid_: query, condition tree

**FilterRule**:
Filter 树的叶子节点，表达单个条件（field + operator + value）。
_Avoid_: clause, predicate, criterion

**FilterGroup**:
Filter 树的分支节点，持有子条件集合与组合方式。
_Avoid_: node, container, branch

### 表示模式

**Standard 模式**:
Filter 的默认表示。Group 通过 `combinator` 属性统一声明子条件的组合方式（`and` / `or`），`conditions` 仅含 rule 与 group。
_Avoid_: classic mode, combinator mode

**IC 模式**:
Independent Combinator 表示。Group 无 `combinator` 属性，combinator 作为裸字符串内联在 `conditions` 数组的节点之间，允许相邻条件使用不同组合符。
_Avoid_: inline-combinator mode, mixed mode

**Combinator (胶水)**:
连接子条件的逻辑算子 `and` / `or`。Standard 模式下是 group 的属性；IC 模式下是 conditions 数组里的字符串元素，起"胶水"作用连接前后节点。
_Avoid_: operator（与 FilterRule 的 operator 区分）, connector
