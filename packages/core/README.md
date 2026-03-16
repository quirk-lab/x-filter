# @x-filter/core

核心逻辑库，提供过滤和验证功能。

## 安装

```bash
pnpm add @x-filter/core
```

## 使用

```typescript
import { filterDefined, validateInput } from '@x-filter/core';

const array = [1, null, 2, undefined, 3];
console.log(filterDefined(array)); // [1, 2, 3]

console.log(validateInput('hello')); // true
console.log(validateInput('')); // false
```

## API

### `filterDefined<T>(array: (T | null | undefined)[]): T[]`

过滤数组中的 `null` 和 `undefined` 值。

### `validateInput(input: unknown): boolean`

验证输入是否为非空字符串。
