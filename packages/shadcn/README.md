# @x-filter/shadcn

Shadcn UI 组件库，基于 @x-filter/react。

## 安装

```bash
pnpm add @x-filter/shadcn react react-dom
```

## 使用

```tsx
import { ValidatedInput } from '@x-filter/shadcn';

function App() {
  return (
    <ValidatedInput 
      placeholder="Enter text..."
      onChange={(value, isValid) => console.log({ value, isValid })}
    />
  );
}
```

## 组件

### `ValidatedInput`

带验证的输入组件。
