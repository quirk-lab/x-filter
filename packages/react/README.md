# @x-filter/react

React hooks 库，提供基于 core 的 React 集成。

## 安装

```bash
pnpm add @x-filter/react react react-dom
```

## 使用

```tsx
import { useValidatedInput, useFilteredArray } from '@x-filter/react';

function MyComponent() {
  const { value, setValue, isValid } = useValidatedInput('');
  
  return (
    <div>
      <input value={value} onChange={(e) => setValue(e.target.value)} />
      <p>Valid: {isValid ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

## API

### `useValidatedInput(initialValue?: string)`

提供输入验证的 hook。

### `useFilteredArray<T>(array: (T | null | undefined)[])`

过滤数组中的 null/undefined 值的 hook。
