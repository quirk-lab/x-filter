# @x-filter/utils

底层工具函数库，提供通用的辅助函数。

## 安装

```bash
pnpm add @x-filter/utils
```

## 使用

```typescript
import { isNil, isDefined } from '@x-filter/utils';

console.log(isNil(null)); // true
console.log(isDefined('hello')); // true
```

## API

### `isNil(value: unknown): boolean`

检查值是否为 `null` 或 `undefined`。

### `isDefined<T>(value: T | null | undefined): value is T`

检查值是否已定义（不是 `null` 或 `undefined`）。
