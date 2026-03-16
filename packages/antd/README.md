# @x-filter/antd

Ant Design 组件库，基于 @x-filter/react。

## 安装

```bash
pnpm add @x-filter/antd react react-dom
```

## 使用

```tsx
import { FilteredList } from '@x-filter/antd';

function App() {
  const items = [1, null, 2, undefined, 3];
  
  return (
    <FilteredList
      items={items}
      renderItem={(item) => <span>{item}</span>}
    />
  );
}
```

## 组件

### `FilteredList<T>`

过滤并渲染列表的组件。
