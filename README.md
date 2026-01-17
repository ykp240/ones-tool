# ONES 工时填报网页应用

基于 ONES 系统 GraphQL API 的工时填报网页应用。

## 技术栈

- **前端框架**: React 18+ with TypeScript
- **状态管理**: React Context API + Hooks
- **HTTP 客户端**: Axios
- **GraphQL 客户端**: graphql-request
- **UI 组件库**: Ant Design
- **路由**: React Router v6
- **日期处理**: date-fns
- **构建工具**: Vite
- **测试框架**: Vitest + fast-check

## 项目结构

```
src/
├── components/     # UI 组件
├── services/       # 业务逻辑服务
├── contexts/       # React Context
├── types/          # TypeScript 类型定义
├── utils/          # 工具函数
├── App.tsx         # 应用根组件
├── main.tsx        # 应用入口
└── index.css       # 全局样式
```

## 开发

### 安装依赖

如果遇到 npm 缓存权限问题，请运行：

```bash
# 方法 1: 使用提供的安装脚本
./setup.sh

# 方法 2: 手动修复权限并安装
sudo chown -R $(whoami) "$HOME/.npm"
npm cache clean --force
npm install --legacy-peer-deps
```

如果没有权限问题，直接运行：

```bash
npm install --legacy-peer-deps
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 运行测试

```bash
npm test
```

### 代码检查

```bash
npm run lint
```

## 功能模块

- 用户身份验证和会话管理
- 任务查询和状态管理
- 工时记录查询
- 手动和自动工时填报

## 配置

应用需要配置 ONES API 的基础 URL 和团队 ID。请在 `src/config.ts` 中设置相关配置。
