# X-Filter

[![npm version](https://img.shields.io/npm/v/@x-filter/core.svg)](https://www.npmjs.com/package/@x-filter/core)
[![CI](https://img.shields.io/github/checks/quirk-lab/x-filter/main)](https://github.com/quirk-lab/x-filter/actions)
[![license](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)
[![docs](https://img.shields.io/badge/docs-x--filter.vercel.app-blue)](https://x-filter.vercel.app)

> 面向 React 的 Schema 驱动过滤器构建工具 — 无头核心、可组合 hooks、Ant Design 与 shadcn 双适配器。

[English](./README.md) | [文档](https://x-filter.vercel.app/zh) | [Playground](https://x-filter.vercel.app/zh/playground) | [更新日志](https://x-filter.vercel.app/zh/changelog)

## 特性

- **Schema 驱动：** 定义一次字段，操作符、值、校验全部从 schema 派生。
- **无头核心：** `@x-filter/core` 是纯 TypeScript，零运行时依赖 — 树模型、变更、校验、DSL、查询导出器。
- **可组合 hooks：** `@x-filter/react` 提供 `useFilterBuilder`、`useFilterViewModel`、`useFilterUrlSync`、`useFilterHistory`（撤销/重做）、`useFilterPresets`、`useFilterKeyboardNav` 等。
- **双 UI 适配器：** `@x-filter/antd` 和 `@x-filter/shadcn` — 共享同一 prop 契约，切换适配器无需改动 schema 或状态。
- **DSL 编辑器：** 单行 token 化 DSL 输入，支持自动补全、解析错误、与过滤树双向转换。
- **查询导出：** 同一份 `Filter` 可编译为 SQL（参数化）、JsonLogic、MongoDB 查询、Elasticsearch 查询 — 全部通过子路径导入。
- **IC 模式：** 可选的内联组合子树类型（`FilterGroupIC`），适用于 Notion 风格的构建器。
- **无障碍：** 每个构建器都是 ARIA `tree`，roving tabindex 实现纯键盘导航，开箱即用。
- **国际化：** 内置 `en-US`、`zh-CN`、`ja-JP` 语言包，传入 `labels` prop 即可。
- **响应式：** 移动优先布局，触摸友好拖拽（44px 目标、`TouchSensor` 延迟激活）。
- **克隆 / 锁定 / 预设：** 克隆规则、锁定分组禁止编辑、通过 `useFilterPresets` 保存/恢复过滤器预设。
- **导入：** 通过 `parseFilterInput` 和导入对话框解析 JSON 过滤器或 DSL 字符串。

## 包

| 包 | 描述 | 安装 |
| --- | --- | --- |
| [`@x-filter/core`](./packages/core) | 树模型、变更、校验、DSL、查询导出器 | `pnpm add @x-filter/core` |
| [`@x-filter/react`](./packages/react) | 无头 React hooks（状态、视图模型、URL 同步、历史、预设、键盘导航） | `pnpm add @x-filter/react` |
| [`@x-filter/shadcn`](./packages/shadcn) | shadcn/Tailwind UI 适配器，含 DnD、DSL 编辑器、导入对话框 | `pnpm add @x-filter/shadcn` |
| [`@x-filter/antd`](./packages/antd) | Ant Design UI 适配器，含 DnD、DSL 编辑器、导入对话框 | `pnpm add @x-filter/antd` |

UI 适配器依赖 `@x-filter/react`，后者依赖 `@x-filter/core`。安装匹配你设计系统的适配器即可，其余两个会自动安装。

## 快速开始

```bash
pnpm add @x-filter/core @x-filter/react @x-filter/antd
```

```tsx
import { useState } from 'react';
import type { FieldSchema, Filter } from '@x-filter/core';
import { AntdFilterBuilder } from '@x-filter/antd';

const schema: FieldSchema[] = [
  { name: 'status', label: '状态', type: 'select', values: [
    { value: 'open', label: '开启' },
    { value: 'closed', label: '关闭' },
  ]},
  { name: 'amount', label: '金额', type: 'number', defaultOperator: 'gt' },
];

const initialFilter: Filter = {
  id: 'root', combinator: 'and', children: [],
};

export function Filters() {
  const [filter, setFilter] = useState(initialFilter);
  return <AntdFilterBuilder schema={schema} value={filter} onChange={setFilter} />;
}
```

发送到 API 前先校验：

```ts
import { validate } from '@x-filter/core';

const result = validate(filter, schema);
if (!result.valid) {
  console.error(result.errors);
}
```

导出为 SQL、JsonLogic、MongoDB 或 Elasticsearch：

```ts
import { toSQL } from '@x-filter/core/sql';
import { toJsonLogic, toMongoQuery, toElasticQuery } from '@x-filter/core';

toSQL(filter);           // { sql: 'WHERE ...', params: [...] }
toJsonLogic(filter);     // { and: [{ in: [...] }, ...] }
toMongoQuery(filter);    // { $and: [{ status: { $in: [...] } }, ...] }
toElasticQuery(filter);  // { bool: { must: [...] } }
```

## 为什么选择 X-Filter？

**对比 React Query Builder：** X-Filter 内置 DSL 编辑器、IC（内联组合子）树模式、JsonLogic/MongoDB/Elasticsearch 导出器，以及无头 hooks 层 — 你可以构建完全自定义的适配器，而无需与框架搏斗。

**对比从零搭建：** 核心层处理树变更、校验、不可变更新、ID 生成、克隆/锁定、键盘导航和 URL 同步 — 你只需关注 UI，不用操心过滤器数据管道。

**适配器一致性：** `@x-filter/antd` 和 `@x-filter/shadcn` 共享同一 prop 契约（`schema`、`value`、`onChange`、`dsl`、`dnd`、`labels`、`readOnly`、`mode`）。改一个 import 就能切换适配器。

## 文档

- [快速开始](https://x-filter.vercel.app/zh/docs/getting-started)
- [适配器](https://x-filter.vercel.app/zh/docs/adapters)
- [DSL & SQL](https://x-filter.vercel.app/zh/docs/dsl-sql)
- [API 参考](https://x-filter.vercel.app/zh/docs/api)
- [部署](https://x-filter.vercel.app/zh/docs/deployment)
- [Playground](https://x-filter.vercel.app/zh/playground)
- [更新日志](https://x-filter.vercel.app/zh/changelog)

## 环境要求

- React 18+
- TypeScript 5.6+
- pnpm 9+（monorepo 开发）

## 贡献

请阅读 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解开发配置、代码规范、测试和 PR 流程。

## 许可证

[MIT](./LICENSE) © [quirk-lab](https://github.com/quirk-lab)
