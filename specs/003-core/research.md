# 竞品研究：Filter Builder Core

**Feature**: 003-core  
**Created**: 2026-03-17  
**Status**: Draft

---

## 1. 定位与目标

X-Filter 要做一个 **通用的 Filter/Query Builder 库**，核心（`@x-filter/core`）与 UI 解耦，支持多种 UI 形态：

| UI 形态 | 代表产品 | 特点 |
|---------|---------|------|
| **Token 搜索栏** | GitHub Issues, GitLab Issues, Elastic UI SearchBar | 输入框 + token chips, 键值对语法（`label:bug status:open`）|
| **面板式筛选** | Notion Database Filter, Airtable | 下拉面板, 逐条添加条件, 支持 AND/OR 嵌套分组 |
| **传统 QueryBuilder** | react-querybuilder, DevExtreme FilterBuilder | 树形 UI, 条件 + 分组嵌套, 可导出 SQL/MongoDB |
| **表头筛选** | AG Grid, Ant Design Table | 每列独立过滤, 内嵌在表格列头 |

**X-Filter 的核心价值**：提供 **一个统一的数据模型 + 操作引擎**，让以上所有 UI 形态都能复用同一套核心逻辑。

---

## 2. 竞品分析

### 2.1 react-querybuilder

- **GitHub**: https://github.com/react-querybuilder/react-querybuilder (1.5k ⭐)
- **架构**: monorepo, core 包 + 多 UI 适配包（Ant Design, Material UI, Chakra, etc.）
- **定位**: 传统 QueryBuilder UI, 不支持 token 搜索栏形态

**数据模型**:
```typescript
// RuleGroupType - 标准模式
interface RuleGroupType {
  combinator: 'and' | 'or';   // 组内逻辑
  rules: (RuleType | RuleGroupType)[];  // 递归嵌套
  not?: boolean;               // 取反
}

interface RuleType {
  field: string;
  operator: string;    // '=', '!=', '<', '>', 'contains', 'between', 'in', 'null' 等
  value: any;
  valueSource?: 'value' | 'field';  // 值来自用户输入还是其他字段
}

// RuleGroupTypeIC - 独立组合器模式
interface RuleGroupTypeIC {
  rules: (RuleType | RuleGroupTypeIC | string)[];  // 组合器穿插在规则之间
}
```

**Field 定义**:
```typescript
interface Field {
  name: string;
  label: string;
  inputType?: string;       // 'text' | 'number' | 'date' 等
  datatype?: string;        // 自定义字段类型
  operators?: Operator[];   // 覆盖默认操作符
  values?: Option[];        // select/radio 的选项
  defaultValue?: any;
  defaultOperator?: string;
}
```

**优点**:
- 数据模型成熟, 经过社区验证
- `formatQuery()` 支持导出 SQL, MongoDB, CEL, JsonLogic 等格式
- `parseSQL()` / `parseMongoDB()` 支持从查询语句反解析
- 支持 `controlElements` 自定义所有子组件
- 支持拖拽排序

**缺点**:
- 与 React 强耦合, 没有框架无关的 core
- 只支持传统 QueryBuilder UI 形态, 不支持 token 搜索栏
- API 表面积太大（70+ 个 props）
- 没有 headless 模式

---

### 2.2 Elastic UI SearchBar

- **GitHub**: https://github.com/elastic/eui
- **定位**: token 搜索栏形态

**查询语法**:
```
// 自由文本搜索
website -production

// 字段搜索
tag:bug -severity:high

// 布尔标志
is:open -is:assigned

// OR 分组
(is:active OR owner:dewey) followers>5

// 操作符: : (部分匹配), = (精确匹配), >, >=, <, <=
```

**Filter 类型**:
- `field_value_selection` - 字段值选择器（单选/多选）
- `field_value_toggle` - 单个字段值开关
- `field_value_toggle_group` - 字段值切换按钮组
- `is` - 布尔标志切换

**优点**:
- 用户体验友好, 适合开发者工具
- 查询语法直观, 支持自由文本 + 结构化搜索混合
- 提供预设 filter 按钮加速操作

**缺点**:
- 与 Elastic UI 框架强耦合
- 查询语法绑定 Elasticsearch DSL
- 不支持 Notion 式的面板筛选 UI

---

### 2.3 GitHub Issues Filter

**特点**:
- 搜索栏支持 `key:value` 语法
- 支持 `AND`, `OR` 逻辑操作符
- 支持括号嵌套（最多 5 层）: `(type:"Bug" AND assignee:octocat) OR (type:"Feature" AND assignee:hubot)`
- 逗号表示 OR: `label:bug,enhancement`
- `-` 前缀表示取反: `-label:bug`
- 自动补全建议
- 语法高亮

**查询语法**:
```
# 基础
label:bug assignee:octocat   (隐式 AND)

# OR
label:bug,enhancement
assignee:octocat OR assignee:hubot

# NOT
-label:wontfix

# 嵌套
(type:"Bug" AND assignee:octocat) OR (type:"Feature" AND assignee:hubot)

# 比较
created:>2024-01-01
reactions:>=10

# 存在性
has:label
no:assignee
```

---

### 2.4 Notion Database Filter

**特点**:
- 面板式 UI, 逐条添加筛选条件
- 支持简单筛选和高级筛选
- 高级筛选支持 AND/OR 嵌套分组, 最多 3 层
- 每种属性类型有专属操作符

**Notion Filter 数据模型 (API)**:
```typescript
// 简单条件
interface FilterCondition {
  property: string;              // 属性名称
  [propertyType]: {              // checkbox | date | number | rich_text | select | ...
    [operator]: value;           // equals, contains, greater_than, is_empty, ...
  };
}

// 复合条件
interface CompoundFilter {
  and?: (FilterCondition | CompoundFilter)[];
  or?: (FilterCondition | CompoundFilter)[];
}
```

**各类型支持的操作符**:
| 类型 | 操作符 |
|------|--------|
| Checkbox | equals, does_not_equal |
| Number | equals, does_not_equal, greater_than, less_than, greater_than_or_equal_to, less_than_or_equal_to, is_empty, is_not_empty |
| Rich Text | equals, does_not_equal, contains, does_not_contain, starts_with, ends_with, is_empty, is_not_empty |
| Select | equals, does_not_equal, is_empty, is_not_empty |
| Multi-select | contains, does_not_contain, is_empty, is_not_empty |
| Date | equals, before, after, on_or_before, on_or_after, is_empty, is_not_empty, past_week, past_month, past_year, next_week, next_month, next_year |
| People | contains, does_not_contain, is_empty, is_not_empty |
| Files | is_empty, is_not_empty |

---

### 2.5 DevExtreme FilterBuilder

- 嵌套数组表示法: `[["field", "operator", value], "and/or", ["field", "operator", value]]`
- 支持无限嵌套
- 紧凑但可读性差

---

## 3. 共性抽象

通过竞品分析, 可以提取出 Filter Builder 的通用概念:

### 3.1 核心概念

| 概念 | 说明 | react-querybuilder | Notion | GitHub |
|------|------|-------------------|--------|--------|
| **Field** | 可筛选的字段定义 | `Field { name, label, inputType }` | `property` | `qualifier` (label, assignee, etc.) |
| **Operator** | 比较操作符 | `=, !=, <, >, contains, between, in, null` | type-specific | `:, =, >, >=, <, <=` |
| **Value** | 条件值 | `any` | type-specific | `string` |
| **Rule/Condition** | 单条筛选条件 | `RuleType { field, operator, value }` | `FilterCondition` | `qualifier:value` |
| **Group** | 条件分组 | `RuleGroupType { combinator, rules }` | `CompoundFilter { and/or }` | `(expr AND/OR expr)` |
| **Combinator** | 逻辑连接 | `'and' \| 'or'` | `and \| or` | `AND \| OR` |
| **Negation** | 取反 | `not: true` | N/A | `-` 前缀 |

### 3.2 字段类型系统

不同竞品都按字段类型决定可用操作符, 这是核心设计:

```
FieldType → 决定 → 可用 Operators
         → 决定 → Value 输入控件 (ValueEditor)
         → 决定 → 默认值
```

常见字段类型:
- **text** (string): equals, contains, startsWith, endsWith, isEmpty
- **number**: equals, gt, gte, lt, lte, between, isEmpty
- **date**: equals, before, after, between, relative (past_week 等), isEmpty
- **select** (enum): equals, doesNotEqual, isEmpty
- **multi-select**: contains, doesNotContain, isEmpty
- **boolean**: is, isNot
- **people/relation**: contains, doesNotContain, isEmpty

---

## 4. X-Filter 差异化方向

| 维度 | react-querybuilder | X-Filter (目标) |
|------|-------------------|----------------|
| 框架依赖 | React only | Core 框架无关, React 包提供 hooks |
| UI 形态 | 仅传统 QueryBuilder | 支持多种形态 (token bar, panel, tree) |
| 类型安全 | 运行时 | 编译时 (泛型约束字段/操作符) |
| 序列化 | formatQuery → SQL/MongoDB | 可扩展 serializer 插件 |
| API 复杂度 | 70+ props | 最小 API, 渐进式扩展 |

---

## 5. 建议的 Core 数据模型方向

```typescript
// ---- Field Schema (字段定义) ----
interface FieldSchema {
  name: string;
  label: string;
  type: FieldType;           // 'text' | 'number' | 'date' | 'select' | 'multiSelect' | 'boolean'
  operators?: OperatorDef[]; // 覆盖默认操作符
  values?: Option[];         // select/multiSelect 的可选值
  defaultOperator?: string;
  defaultValue?: unknown;
}

// ---- Filter Condition (单条条件) ----
interface FilterRule {
  id: string;
  field: string;
  operator: string;
  value: unknown;
}

// ---- Filter Group (条件分组) ----
interface FilterGroup {
  id: string;
  combinator: 'and' | 'or';
  not?: boolean;
  conditions: (FilterRule | FilterGroup)[];  // 递归
}

// ---- 顶层 Filter ----
type Filter = FilterGroup;
```

---

## 6. 待决问题

1. **是否支持独立组合器模式 (Independent Combinators)?** — react-querybuilder 的 IC 模式允许每对条件间有不同的 combinator, 更灵活但复杂度更高
2. **序列化格式优先级** — 先支持哪些输出格式? SQL? MongoDB? Elasticsearch? 还是只提供 JSON?
3. **验证策略** — 是在 core 层做 filter 合法性验证, 还是交给消费方?
4. **字段类型是否可扩展** — 用户是否能注册自定义字段类型?

---

## 参考链接

- [react-querybuilder](https://react-querybuilder.js.org/) - 最成熟的 React QueryBuilder
- [Elastic UI SearchBar](https://eui.elastic.co/docs/components/forms/search-and-filter/search-bar/) - Token 搜索栏范例
- [Notion Filter API](https://developers.notion.com/reference/post-database-query-filter) - 面板式 Filter 数据模型
- [DevExtreme FilterBuilder](https://js.devexpress.com/Angular/Documentation/Guide/UI_Components/FilterBuilder/Overview/) - 嵌套数组表示法
- [Filter UX Design Patterns (Pencil & Paper)](https://pencilandpaper.io/articles/ux-pattern-analysis-enterprise-filtering/) - Filter UX 最佳实践
