# GraphQL 客户端模块

## 概述

GraphQL 客户端模块封装了 `graphql-request` 库，提供统一的 GraphQL API 调用接口。该模块自动处理认证头的添加，并提供错误处理机制。

## 功能特性

### 1. 认证管理

- **setAuth(userId, token)**: 设置用户认证信息
- **clearAuth()**: 清除认证信息

### 2. GraphQL 操作

- **query<T>(query, variables)**: 执行 GraphQL 查询
- **mutate<T>(mutation, variables)**: 执行 GraphQL 变更

### 3. 自动认证头

所有请求自动包含以下认证头（如果已设置认证信息）：
- `Ones-User-Id`: 用户 ID
- `Ones-Auth-Token`: 认证令牌

### 4. 错误处理

- 自动处理 GraphQL 错误
- 检测 401 认证错误并触发会话过期事件
- 记录错误信息到控制台

## 使用方法

### 基本使用

```typescript
import { graphqlClient } from '@/services'

// 1. 设置认证信息（通常在登录后）
graphqlClient.setAuth('user-uuid', 'auth-token')

// 2. 执行查询
const result = await graphqlClient.query<QueryResult>(
  `query GetTasks { tasks { uuid name } }`,
  { /* variables */ }
)

// 3. 执行变更
const mutationResult = await graphqlClient.mutate<MutationResult>(
  `mutation UpdateTask($id: String!) { updateTask(id: $id) { uuid } }`,
  { id: 'task-id' }
)

// 4. 清除认证信息（通常在登出时）
graphqlClient.clearAuth()
```

### 类型安全

使用 TypeScript 泛型确保类型安全：

```typescript
interface Task {
  uuid: string
  name: string
  status: string
}

interface TasksResponse {
  tasks: Task[]
}

const result = await graphqlClient.query<TasksResponse>(
  `query GetTasks { tasks { uuid name status } }`
)

// result.tasks 是类型安全的
result.tasks.forEach(task => {
  console.log(task.name)
})
```

### 错误处理

```typescript
try {
  const result = await graphqlClient.query(query, variables)
  // 处理成功结果
} catch (error) {
  if (error instanceof ClientError) {
    // GraphQL 错误
    console.error('GraphQL Error:', error.response.errors)
  } else {
    // 网络错误
    console.error('Network Error:', error)
  }
}
```

### 会话过期处理

客户端会自动检测 401 错误并触发会话过期事件：

```typescript
// 在应用初始化时监听会话过期事件
window.addEventListener('auth:expired', () => {
  // 清除本地状态
  // 重定向到登录页
  console.log('会话已过期，请重新登录')
})
```

## 实现需求

该模块实现了以下需求：

- **需求 1.6**: 在请求头中包含 Ones-User-Id 和 Ones-Auth-Token
- **需求 10.8**: 使用正确的 GraphQL 端点格式
- **需求 10.9**: 在请求体中包含有效的 GraphQL 查询或变更语句

## 文件结构

```
src/services/
├── graphqlClient.ts          # GraphQL 客户端实现
├── graphqlClient.test.ts     # 单元测试
├── graphqlClient.example.ts  # 使用示例
├── index.ts                  # 模块导出
└── README.md                 # 本文档
```

## 配置

GraphQL 端点配置在 `src/config.ts` 中：

```typescript
export const config = {
  apiBaseUrl: 'https://your-ones-instance.com',
  teamId: 'your-team-id',
  get graphqlEndpoint() {
    return `${this.apiBaseUrl}/project/api/project/team/${this.teamId}/items/graphql`
  }
}
```

## 依赖

- `graphql-request`: GraphQL 客户端库
- `graphql`: GraphQL 核心库

## 测试

运行单元测试：

```bash
npm test src/services/graphqlClient.test.ts
```

## 注意事项

1. **认证信息**: 必须在发起请求前调用 `setAuth()` 设置认证信息
2. **单例模式**: 导出的 `graphqlClient` 是单例实例，在整个应用中共享
3. **错误处理**: 所有 API 调用都应该包含错误处理逻辑
4. **会话管理**: 监听 `auth:expired` 事件以处理会话过期
