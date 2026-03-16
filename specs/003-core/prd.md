# @x-filter/core — PRD & Technical Plan

**Feature**: 003-core  
**Created**: 2026-03-17  
**Status**: Draft  
**Branch**: `003-core`

---

# Part 1: Product Requirement Document (PRD)

## 1. 概览

### 背景/动机

X-Filter 项目已完成 monorepo 基础设施搭建（002），各包仅有占位代码。`@x-filter/core` 是整个库的基石 — 定义 Filter 的数据模型、提供构建/操作/验证/序列化工具函数。后续 `@x-filter/react`（hooks）、`@x-filter/shadcn`（Shadcn UI）、`@x-filter/antd`（Ant Design）均依赖此包。

竞品分析（见 `specs/003-core/research.md`）显示，现有方案（react-querybuilder、Elastic UI SearchBar）要么与特定 UI 框架耦合，要么只支持单一 UI 形态。X-Filter 的核心差异化在于：**一套框架无关的数据模型 + 工具函数，驱动多种 UI 形态**（token 搜索栏、面板式筛选、传统 QueryBuilder 树）。

### 目标

- 提供完整的 Filter 数据模型定义（TypeScript 类型）
- 提供 immutable 的 CRUD 工具函数（addRule、removeRule、updateRule、addGroup 等）
- 支持标准模式和独立组合器（IC）模式
- 提供可选的纯函数验证
- 提供 JSON 和 SQL 序列化（SQL 通过子路径导出）
- 零框架依赖，零运行时依赖（除 ID 生成）

### 主要用户/角色

1. **库消费者（应用开发者）**：使用 `@x-filter/react` + UI 包在应用中集成 filter builder
2. **UI 包开发者（内部）**：`@x-filter/react`、`@x-filter/shadcn`、`@x-filter/antd` 的开发者，基于 core 构建 hooks 和组件
3. **高级用户**：直接使用 core 构建自定义 filter 逻辑（非 React 项目、Node.js 后端等）

### 成功判断/衡量标准

- Core 包可独立使用，不依赖任何 UI 框架
- 所有公开 API 100% TypeScript 类型覆盖
- 单元测试覆盖率 ≥ 95%
- 包体积（minified + gzip）< 5KB（不含 SQL 序列化器）

---

## 2. User Stories & Acceptance Criteria

### US-1: 定义字段 Schema 并创建空 Filter

**Story**: As a 开发者, I want to 定义可筛选字段的 schema 并创建一个空的 filter 对象, so that 我可以开始构建过滤条件。

**AC**:
- [ ] 可通过 `FieldSchema[]` 定义字段，每个字段包含 `name`、`label`、`type`
- [ ] 内置字段类型：`text`、`number`、`date`、`select`、`multiSelect`、`boolean`
- [ ] 每种字段类型有默认操作符集，可通过 `operators` 属性覆盖
- [ ] `createFilter()` 返回一个空的 `FilterGroup` 对象，包含自动生成的 `id`
- [ ] `createFilter()` 支持传入 `combinator` 参数（默认 `'and'`）

**Priority**: P0

---

### US-2: 添加、更新、删除筛选条件（Rule）

**Story**: As a 开发者, I want to 对 filter 进行增删改操作, so that 用户可以交互式地构建过滤条件。

**AC**:
- [ ] `addRule(filter, groupId, rule)` 在指定 group 中添加新 rule，返回新 filter 对象
- [ ] `updateRule(filter, ruleId, updates)` 更新指定 rule 的属性，返回新 filter 对象
- [ ] `removeRule(filter, ruleId)` 删除指定 rule，返回新 filter 对象
- [ ] `moveRule(filter, ruleId, targetGroupId, position)` 移动 rule 到指定 group 的指定位置，返回新 filter 对象
- [ ] 所有操作返回新对象，不修改原对象（immutable）
- [ ] 新 rule 自动生成 `id`，支持通过 `idGenerator` 选项自定义
- [ ] 删除 group 中最后一个 rule 后，group 保留（空 group 合法）

**Priority**: P0

---

### US-3: 添加、更新、删除条件分组（Group）

**Story**: As a 开发者, I want to 创建和管理嵌套分组, so that 用户可以构建复杂的 AND/OR 组合条件。

**AC**:
- [ ] `addGroup(filter, parentGroupId, group?)` 在指定 group 内添加子 group，返回新 filter 对象
- [ ] `updateGroup(filter, groupId, updates)` 更新 group 属性（combinator、not），返回新 filter 对象
- [ ] `removeGroup(filter, groupId)` 删除指定 group 及其所有子条件，返回新 filter 对象
- [ ] 不允许删除根 group
- [ ] 支持任意层级嵌套

**Priority**: P0

---

### US-4: 独立组合器（Independent Combinators）模式

**Story**: As a 开发者, I want to 使用独立组合器模式, so that 每对相邻条件之间可以有不同的逻辑组合器（AND/OR）。

**AC**:
- [ ] 提供 `FilterGroupIC` 类型，combinator 穿插在 rules 数组中（奇数索引为 combinator）
- [ ] `addRule` 在 IC 模式下自动在新 rule 前插入默认 combinator
- [ ] `removeRule` 在 IC 模式下自动移除关联的 combinator
- [ ] 提供 `isFilterGroupIC()` 类型守卫区分两种模式
- [ ] 提供 `convertToIC(filter)` 和 `convertFromIC(filter)` 互转函数

**Priority**: P0

---

### US-5: Rule 和 Group 级别的 NOT 取反

**Story**: As a 开发者, I want to 对单条规则或整个分组进行取反, so that 用户可以表达"不满足条件"的逻辑。

**AC**:
- [ ] `FilterRule` 支持 `not?: boolean` 属性
- [ ] `FilterGroup` 支持 `not?: boolean` 属性
- [ ] `negateRule(filter, ruleId)` 切换 rule 的 `not` 状态
- [ ] `negateGroup(filter, groupId)` 切换 group 的 `not` 状态
- [ ] 序列化时正确处理 NOT 语义

**Priority**: P0

---

### US-6: Filter 验证

**Story**: As a 开发者, I want to 验证 filter 对象的合法性, so that 我可以在 UI 层展示错误提示或阻止提交。

**AC**:
- [ ] `validate(filter, schema)` 返回 `ValidationResult`，包含每个 rule/group 的错误信息
- [ ] 验证内容包括：
  - field 是否存在于 schema 中
  - operator 是否在该 field type 允许的操作符列表中
  - value 是否符合 field type 的要求（如 number 字段的值是否为数字）
  - value 是否缺失（required check）
- [ ] `ValidationResult` 按 rule/group 的 id 索引，便于 UI 层定位错误
- [ ] 验证是纯函数，不产生副作用，不阻止任何操作

**Priority**: P1

---

### US-7: JSON 序列化/反序列化

**Story**: As a 开发者, I want to 将 filter 序列化为 JSON 并从 JSON 反序列化, so that 我可以持久化存储和传输 filter。

**AC**:
- [ ] `toJSON(filter)` 将 filter 对象序列化为可存储的 JSON 结构
- [ ] `fromJSON(json)` 从 JSON 恢复 filter 对象（包含 id 重建）
- [ ] 序列化结果应稳定（相同输入产生相同输出）
- [ ] 从 `@x-filter/core` 主入口导出

**Priority**: P0

---

### US-8: SQL 序列化

**Story**: As a 开发者, I want to 将 filter 转换为 SQL WHERE 子句, so that 我可以在后端查询中使用 filter。

**AC**:
- [ ] `toSQL(filter, options?)` 生成 SQL WHERE 子句字符串
- [ ] 支持参数化查询（防 SQL 注入），返回 `{ sql: string, params: unknown[] }`
- [ ] 正确处理 AND/OR/NOT 逻辑和括号嵌套
- [ ] 正确处理各操作符的 SQL 映射（contains → LIKE '%...%'、between → BETWEEN、in → IN 等）
- [ ] 正确处理 NULL 检查（isEmpty → IS NULL）
- [ ] 从 `@x-filter/core/sql` 子路径导出
- [ ] IC 模式和标准模式均正确处理

**Priority**: P1

---

### US-9: 查找与遍历工具

**Story**: As a 开发者, I want to 在 filter 树中查找和遍历节点, so that 我可以实现 UI 交互和状态同步。

**AC**:
- [ ] `findById(filter, id)` 返回匹配的 rule 或 group（或 `undefined`）
- [ ] `findParent(filter, id)` 返回指定节点的父 group（或 `undefined`）
- [ ] `getPath(filter, id)` 返回从根到目标节点的路径数组
- [ ] `traverse(filter, callback)` 深度优先遍历所有节点
- [ ] `flattenRules(filter)` 返回所有 rule 的扁平数组

**Priority**: P1

---

### US-10: 操作符注册表

**Story**: As a 开发者, I want to 查询字段类型对应的操作符列表, so that UI 层可以动态渲染操作符选择器。

**AC**:
- [ ] `getOperators(fieldType)` 返回该字段类型的所有可用操作符
- [ ] 每个操作符包含 `name`（程序标识）、`label`（显示名称）、`arity`（'unary' | 'binary' | 'ternary'）
- [ ] `arity` 为 `'unary'` 时（如 isEmpty），UI 层无需渲染值输入控件
- [ ] `arity` 为 `'ternary'` 时（如 between），UI 层需渲染两个值输入控件
- [ ] 支持通过 `FieldSchema.operators` 覆盖默认操作符

**Priority**: P0

---

## 3. 详细规约

### 核心数据模型

```typescript
// ---- 字段类型 ----
type FieldType = 'text' | 'number' | 'date' | 'select' | 'multiSelect' | 'boolean';

// ---- 操作符 ----
interface OperatorDef {
  name: string;                          // 程序标识: 'equals', 'contains', 'gt', ...
  label: string;                         // 显示名称: 'equals', 'contains', '>', ...
  arity: 'unary' | 'binary' | 'ternary'; // 操作数数量
}

// ---- 字段 Schema ----
interface FieldSchema {
  name: string;                          // 字段标识
  label: string;                         // 显示名称
  type: FieldType;                       // 字段类型
  operators?: OperatorDef[];             // 覆盖默认操作符
  values?: Option[];                     // select/multiSelect 的选项
  defaultOperator?: string;              // 默认操作符
  defaultValue?: unknown;                // 默认值
}

interface Option {
  value: string;
  label: string;
}

// ---- 标准模式 ----
interface FilterRule {
  id: string;
  field: string;
  operator: string;
  value: unknown;
  not?: boolean;
}

interface FilterGroup {
  id: string;
  combinator: 'and' | 'or';
  not?: boolean;
  conditions: (FilterRule | FilterGroup)[];
}

// ---- IC 模式 ----
interface FilterGroupIC {
  id: string;
  not?: boolean;
  conditions: (FilterRule | FilterGroupIC | Combinator)[];
  // conditions 中奇数索引为 Combinator
}

type Combinator = 'and' | 'or';

// ---- 顶层类型 ----
type Filter = FilterGroup;
type FilterIC = FilterGroupIC;
type FilterAny = Filter | FilterIC;

// ---- 验证 ----
interface ValidationResult {
  valid: boolean;
  errors: Record<string, ValidationError[]>;  // key = rule/group id
}

interface ValidationError {
  type: 'invalidField' | 'invalidOperator' | 'invalidValue' | 'missingValue';
  message: string;
}

// ---- SQL 输出 ----
interface SQLResult {
  sql: string;
  params: unknown[];
}
```

### 内置字段类型与默认操作符

| 字段类型 | 默认操作符 |
|---------|-----------|
| `text` | equals, notEquals, contains, notContains, startsWith, endsWith, isEmpty, isNotEmpty |
| `number` | equals, notEquals, gt, gte, lt, lte, between, isEmpty, isNotEmpty |
| `date` | equals, notEquals, before, after, between, isEmpty, isNotEmpty |
| `select` | equals, notEquals, isEmpty, isNotEmpty |
| `multiSelect` | contains, notContains, isEmpty, isNotEmpty |
| `boolean` | equals |

### 操作符 Arity 映射

| Arity | 操作符 | 值输入 |
|-------|--------|-------|
| unary | isEmpty, isNotEmpty | 无 |
| binary | equals, contains, gt, lt, ... | 单值 |
| ternary | between | 双值 (min, max) |

### 约束/规则 (Business Rules)

- 所有 CRUD 函数为纯函数，返回新对象引用
- 根 group 不可删除
- 空 group 合法（`conditions: []`）
- IC 模式中 combinator 数量 = rule/group 数量 - 1
- 序列化空 filter 返回空字符串（SQL）或 `{}` (JSON)

### 边界/不在范围 (Out of Scope)

- **自定义字段类型注册** — 第二阶段
- **MongoDB / Elasticsearch 序列化** — 第二阶段
- **内存数据过滤（evaluate）** — 不做，Core 只构建结构
- **Undo/Redo** — 交给 React 层或应用层
- **拖拽排序** — UI 层能力，Core 提供 `moveRule` 即可
- **状态管理** — 交给消费方

### 错误/异常场景

- `removeGroup` 传入根 group id → 抛出错误或返回原 filter（不做操作）
- `addRule` 传入不存在的 groupId → 抛出错误
- `validate` 传入不在 schema 中的 field → 返回 `invalidField` 错误
- `toSQL` 传入空 filter → 返回 `{ sql: '', params: [] }`

---

## 4. 遗留问题

无。所有设计决策已确认。

---

# Part 2: Technical Plan

## 1. 计划申明

- **迭代性质**: 新功能（Core 包从占位代码到完整实现）
- **适用范围**: Library 包 (`packages/core`)
- **预估文件数**: ~15 个源文件 + ~10 个测试文件

## 2. 技术决策

### 技术栈

- **语言**: TypeScript 5.6+ (strict mode)
- **构建**: tsup (ESM + CJS + d.ts)
- **测试**: Jest
- **运行时依赖**: nanoid（ID 生成，考虑轻量替代方案）
- **无框架依赖**

### 边界和范围控制

- 不引入 fp-ts、ramda 等函数式库 — 用原生 TypeScript 实现 immutable 操作
- 不做性能优化（如 structural sharing）— 第一版追求正确性
- SQL 序列化器不做 SQL 注入防御之外的安全措施

## 3. 架构设计

### 目录结构

```
packages/core/src/
├── index.ts                   # 主入口: 导出 types, CRUD, validate, JSON
├── sql/
│   └── index.ts               # 子路径入口: @x-filter/core/sql
├── types.ts                   # 所有类型定义
├── operators.ts               # 内置操作符注册表
├── create.ts                  # createFilter, createRule, createGroup
├── mutations.ts               # addRule, removeRule, updateRule, addGroup, removeGroup, updateGroup
├── negate.ts                  # negateRule, negateGroup
├── traverse.ts                # findById, findParent, getPath, traverse, flattenRules
├── validate.ts                # validate
├── serialize-json.ts          # toJSON, fromJSON
├── ic.ts                      # IC 模式工具: isFilterGroupIC, convertToIC, convertFromIC
├── id.ts                      # ID 生成 (默认 nanoid, 可覆盖)
├── sql/
│   ├── index.ts               # toSQL 入口
│   ├── operators.ts           # 操作符 → SQL 映射
│   └── builder.ts             # SQL 构建逻辑
└── __tests__/
    ├── create.spec.ts
    ├── mutations.spec.ts
    ├── negate.spec.ts
    ├── traverse.spec.ts
    ├── validate.spec.ts
    ├── serialize-json.spec.ts
    ├── ic.spec.ts
    └── sql/
        └── to-sql.spec.ts
```

### 导出结构

```typescript
// @x-filter/core (主入口)
export type { Filter, FilterIC, FilterAny, FilterRule, FilterGroup, FilterGroupIC, ... } from './types';
export { createFilter, createRule, createGroup } from './create';
export { addRule, removeRule, updateRule, moveRule, addGroup, removeGroup, updateGroup } from './mutations';
export { negateRule, negateGroup } from './negate';
export { findById, findParent, getPath, traverse, flattenRules } from './traverse';
export { validate } from './validate';
export { toJSON, fromJSON } from './serialize-json';
export { getOperators, defaultOperators } from './operators';
export { isFilterGroupIC, convertToIC, convertFromIC } from './ic';

// @x-filter/core/sql (子路径)
export { toSQL } from './sql';
```

### package.json exports 配置

```json
{
  "exports": {
    ".": {
      "import": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
      "require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" }
    },
    "./sql": {
      "import": { "types": "./dist/sql/index.d.ts", "default": "./dist/sql/index.js" },
      "require": { "types": "./dist/sql/index.d.cts", "default": "./dist/sql/index.cjs" }
    }
  }
}
```

## 4. 非功能性设计

### 性能/规模

- 目标包体积: < 5KB minified + gzip（主入口）, SQL 序列化器额外 < 3KB
- CRUD 操作: 浅拷贝 + 路径更新（非深拷贝），保持合理性能
- 无运行时类型检查（信任 TypeScript 编译时检查）

### 安全与合规

- SQL 序列化默认使用参数化查询，防止 SQL 注入
- 不记录或传输任何用户数据

## 5. 实施与测试

### 实施顺序

1. **Phase 1**: types + operators + id + create（数据模型基础）
2. **Phase 2**: mutations（CRUD 操作）
3. **Phase 3**: negate + traverse（取反 + 遍历）
4. **Phase 4**: ic（IC 模式支持）
5. **Phase 5**: validate（验证）
6. **Phase 6**: serialize-json（JSON 序列化）
7. **Phase 7**: sql（SQL 序列化，子路径导出）

### 测试策略

- 每个模块配套单元测试
- 覆盖标准模式和 IC 模式
- 覆盖边界情况：空 filter、深层嵌套、NOT 取反、非法操作
- SQL 序列化需覆盖所有操作符映射
- 目标覆盖率 ≥ 95%
