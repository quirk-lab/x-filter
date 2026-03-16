# X-Filter Monorepo

基于 pnpm Workspace 的 Monorepo 项目，包含多个可复用的库包和应用。

## 📦 包结构

```
packages/
├── utils/      # @x-filter/utils - 底层工具函数
├── core/       # @x-filter/core - 核心逻辑
├── react/      # @x-filter/react - React hooks
├── shadcn/     # @x-filter/shadcn - Shadcn UI 组件
└── antd/       # @x-filter/antd - Ant Design 组件

apps/
├── playground/ # 开发调试应用
└── web/        # 官网应用
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
- `pnpm lint` - 运行 Biome 代码检查
- `pnpm format` - 格式化代码
- `pnpm typecheck` - 类型检查
- `pnpm test` - 运行测试

## 📝 依赖关系

```
utils (无依赖)
  ↓
core (依赖 utils)
  ↓
react (依赖 core)
  ↓
shadcn/antd (依赖 react)
  ↓
apps (依赖 UI 包)
```

## 🔧 技术栈

- **包管理**: pnpm 9.x
- **构建工具**: tsup (库包), Vite (应用)
- **代码规范**: Biome
- **Git Hooks**: Husky
- **CI/CD**: GitHub Actions
- **语言**: TypeScript 5.6+

## 📖 文档

每个包都有自己的 README 文档，详细说明了使用方法和 API。

## 🤝 贡献

提交代码前会自动运行 Biome 检查和格式化。

## 📄 许可证

MIT
