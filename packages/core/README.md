# @x-filter/core

核心逻辑库，提供过滤器模型创建、变更、遍历与校验能力。

## 安装

```bash
pnpm add @x-filter/core
```

## 使用

```typescript
import { createFilter, addRule, validate } from '@x-filter/core';

const filter = createFilter({ idGenerator: () => 'root' });
const next = addRule(filter, 'root', {
  id: 'r1',
  field: 'age',
  operator: 'gt',
  value: 18,
});

const result = validate(next, [{ name: 'age', label: 'Age', type: 'number' }]);
console.log(result.valid); // true
```

## API

主要导出包含：
- `createFilter` / `createRule` / `createGroup`
- `addRule` / `updateRule` / `removeRule` / `moveRule`
- `addGroup` / `updateGroup` / `removeGroup`
- `validate`
- `traverse` / `findById` / `findParent` / `getPath` / `flattenRules`
- `toJSON` / `fromJSON`
