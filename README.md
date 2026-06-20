# X-Filter Monorepo

基于 pnpm Workspace 的 Monorepo 项目，包含多个可复用的库包和应用。

## 📦 包结构

```
packages/
├── core/       # @x-filter/core - 核心逻辑
├── react/      # @x-filter/react - React hooks
├── shadcn/     # @x-filter/shadcn - Shadcn UI 组件
└── antd/       # @x-filter/antd - Ant Design 组件

apps/
├── playground/ # 开发调试应用
└── web/        # 静态文档官网和交互 demo
```

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 构建所有包

```bash
pnpm build
```

### 启动开发环境

```bash
pnpm dev
```

这将启动 playground 应用，访问 http://localhost:5173

### 启动文档官网

```bash
pnpm --filter @x-filter/web dev
```

文档官网使用 Next.js 静态导出、Nextra MDX 编译和显式双语路由。英文为默认路由，中文在 `/zh` 下。

### 开发单个包

```bash
# 进入包目录
cd packages/core

# 启动 watch 模式
pnpm dev
```

## 🛠️ 开发命令

- `pnpm build` - 构建所有包
- `pnpm dev` - 启动 playground 开发服务器
- `pnpm --filter @x-filter/web dev` - 启动文档官网
- `pnpm --filter @x-filter/web... build` - 构建静态官网及其依赖到 `apps/web/out`
- `pnpm lint` - 运行 Biome 代码检查
- `pnpm format` - 格式化代码
- `pnpm typecheck` - 类型检查
- `pnpm test` - 运行测试

## 📝 依赖关系

```
core (无内部依赖)
  ↓
react (依赖 core)
  ↓
shadcn/antd (依赖 react)
  ↓
apps (依赖 UI 包)
```

## 🔧 技术栈

- **包管理**: pnpm 9.x
- **构建工具**: tsup (库包), Vite (playground), Next.js/Nextra (web)
- **代码规范**: Biome
- **Git Hooks**: Husky
- **CI/CD**: GitHub Actions
- **语言**: TypeScript 5.6+

## 🔗 URL 同步 (useFilterUrlSync)

`@x-filter/react` 提供 `useFilterUrlSync`，可把筛选条件持久化到页面 URL，实现「带参链接 → 自动还原筛选」的分享体验。Playground 的 **URL Sync Demo** 区块与 Storybook 的 **Hooks/URL Sync** story 均有可交互演示。

```tsx
import { useFilterUrlSync } from '@x-filter/react';

function Demo() {
  const { getFilterFromUrl, setFilterToUrl, error } = useFilterUrlSync({ mode: 'dsl' });
  const [filter, setFilter] = useState(() => getFilterFromUrl() ?? createInitialFilter());

  const onChange = (next) => {
    setFilter(next);
    setFilterToUrl(next); // 写入 ?filter=... (history.replaceState)
  };
  // ...
}
```

**DSL mode vs JSON mode 取舍：**

| mode | URL 形态 | 适用场景 |
| --- | --- | --- |
| `'dsl'`（默认） | `?filter=status:equals:open AND priority:gt:2` | 链接简洁、人类可读、可手写；推荐用于分享 |
| `'json'` | `?filter=%7B%22combinator%22...%7D` | 需无损保留全部结构/边界字段、不依赖 DSL 解析时 |

可选项：`paramName`（默认 `filter`）、`getSearchParams` / `setSearchParams`（自定义适配器，便于 Next.js router 或 SSR 测试注入）。解析失败时 `error` 会返回错误信息而非抛出。

## 🌐 国际化 (i18n)

`@x-filter/react` 内置多语言文案包，直接传给 `labels` prop 即可，无需逐条翻译：

```tsx
import { zhCN, enUS, jaJP, locales } from '@x-filter/react';
import { ShadcnFilterBuilder } from '@x-filter/shadcn';

<ShadcnFilterBuilder schema={schema} labels={zhCN} />;

// 或用 locale 注册表做语言切换
const [code, setCode] = useState<'en-US' | 'zh-CN' | 'ja-JP'>('zh-CN');
<ShadcnFilterBuilder schema={schema} labels={locales[code]} />;
```

内置 `en-US`、`zh-CN`、`ja-JP`，均为完整 `FilterBuilderLabels`（编译期 `Required` 校验，保证 key 齐全）。仍可只覆盖部分 key：`labels={{ ...zhCN, addRule: '新增条件' }}`。

## 📖 文档

每个包都有自己的 README 文档，详细说明了使用方法和 API。

## 🤝 贡献

提交代码前会自动运行 Biome 检查和格式化。

## 📄 许可证

MIT
