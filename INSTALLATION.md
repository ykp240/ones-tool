# 安装指南

## 项目初始化完成状态

✅ 项目结构已创建
✅ 配置文件已设置（TypeScript, ESLint, Prettier, Vite）
✅ 基础目录结构已建立（src/components, src/services, src/contexts, src/types, src/utils）
✅ 依赖项已在 package.json 中定义

## 依赖安装

由于 npm 缓存权限问题，需要手动完成依赖安装。

### 方法 1: 使用安装脚本（推荐）

```bash
./setup.sh
```

此脚本会：
1. 修复 npm 缓存权限
2. 清理 npm 缓存
3. 安装所有项目依赖

### 方法 2: 手动安装

```bash
# 1. 修复 npm 缓存权限
sudo chown -R $(whoami) "$HOME/.npm"

# 2. 清理 npm 缓存
npm cache clean --force

# 3. 安装依赖
npm install --legacy-peer-deps
```

### 方法 3: 使用 yarn（如果已安装）

```bash
yarn install
```

## 验证安装

安装完成后，运行以下命令验证：

```bash
# 检查依赖是否正确安装
npm list --depth=0

# 启动开发服务器
npm run dev
```

如果开发服务器成功启动，您应该能在浏览器中访问 http://localhost:5173

## 已安装的依赖

### 生产依赖
- react: ^18.2.0
- react-dom: ^18.2.0
- react-router-dom: ^6.21.0
- antd: ^5.12.0
- axios: ^1.6.0
- graphql: ^16.8.0
- graphql-request: ^6.1.0
- date-fns: ^3.0.0

### 开发依赖
- @types/react: ^18.2.43
- @types/react-dom: ^18.2.17
- @typescript-eslint/eslint-plugin: ^6.14.0
- @typescript-eslint/parser: ^6.14.0
- @vitejs/plugin-react: ^4.2.1
- eslint: ^8.55.0
- eslint-plugin-react-hooks: ^4.6.0
- eslint-plugin-react-refresh: ^0.4.5
- typescript: ^5.2.2
- vite: ^5.0.8
- vitest: ^1.0.0
- @vitest/ui: ^1.0.0
- fast-check: ^3.15.0
- prettier: ^3.1.0

## 环境配置

在项目根目录创建 `.env` 文件（参考 `.env.example`）：

```bash
cp .env.example .env
```

然后编辑 `.env` 文件，填入您的 ONES 实例配置：

```
VITE_API_BASE_URL=https://your-ones-instance.com
VITE_TEAM_ID=your-team-id
```

## 下一步

依赖安装完成后，您可以：

1. 启动开发服务器：`npm run dev`
2. 运行代码检查：`npm run lint`
3. 运行测试：`npm test`
4. 构建生产版本：`npm run build`

## 故障排除

### 问题：npm 缓存权限错误

**错误信息：**
```
npm error code EACCES
npm error syscall mkdir
npm error path /Users/xxx/.npm/_cacache/...
```

**解决方案：**
```bash
sudo chown -R $(whoami) "$HOME/.npm"
npm cache clean --force
```

### 问题：依赖版本冲突

**错误信息：**
```
npm error ERESOLVE unable to resolve dependency tree
```

**解决方案：**
使用 `--legacy-peer-deps` 标志：
```bash
npm install --legacy-peer-deps
```

### 问题：TypeScript 编译错误

**解决方案：**
确保所有依赖都已正确安装，然后重启 TypeScript 服务器（在 VS Code 中按 Cmd+Shift+P，选择 "TypeScript: Restart TS Server"）

## 联系支持

如果遇到其他问题，请查看项目文档或联系开发团队。
