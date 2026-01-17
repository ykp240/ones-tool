# AuthService 实现说明

## 概述

AuthService 是认证模块的核心服务，负责用户身份验证和会话管理。

## 实现的功能

### 1. 用户登录 (login)
- 调用 ONES 登录 API (`POST /project/api/project/auth/login`)
- 获取用户信息、User_ID 和 Auth_Token
- 存储认证信息到 localStorage
- 设置 GraphQL 客户端的认证头
- 提供明确的错误提示信息

**需求覆盖**: 1.1, 1.2, 1.3, 1.6

### 2. 用户登出 (logout)
- 清除 localStorage 中的认证信息
- 清除 GraphQL 客户端的认证头
- 触发登出事件

**需求覆盖**: 9.5

### 3. 获取当前用户 (getCurrentUser)
- 从 localStorage 读取用户信息
- 返回 User 对象或 null

### 4. 检查登录状态 (isAuthenticated)
- 验证 localStorage 中是否存在有效的认证信息
- 返回 boolean

### 5. 获取认证令牌 (getAuthToken)
- 从 localStorage 读取 Auth_Token
- 返回 token 或 null

### 6. 获取用户 ID (getUserId)
- 从 localStorage 读取 User_ID
- 返回 userId 或 null

### 7. 会话管理 (initialize)
- 应用启动时从 localStorage 恢复认证信息
- 监听会话过期事件 (`auth:expired`)
- 自动登出过期会话

**需求覆盖**: 1.5

## 错误处理

AuthService 提供详细的错误处理：

- **401 错误**: "邮箱或密码错误，请重试"
- **400 错误**: "请求参数错误，请检查邮箱和密码格式"
- **500+ 错误**: "服务器错误，请稍后重试"
- **网络错误**: "网络连接失败，请检查网络连接后重试"

## 数据存储

认证信息存储在 localStorage 中，键名为 `ones_auth_info`，包含：

```typescript
{
  userId: string
  token: string
  user: {
    uuid: string
    name: string
    email: string
    avatar?: string
  }
}
```

## 事件

AuthService 触发以下自定义事件：

- `auth:logout`: 用户登出时触发
- `auth:expired`: 会话过期时触发（由 GraphQLClient 触发）

## 使用示例

```typescript
import { authService } from './services'

// 登录
try {
  const response = await authService.login('user@example.com', 'password')
  console.log('登录成功:', response.user.name)
} catch (error) {
  console.error('登录失败:', error.message)
}

// 检查登录状态
if (authService.isAuthenticated()) {
  const user = authService.getCurrentUser()
  console.log('当前用户:', user?.name)
}

// 登出
authService.logout()
```

## 依赖

- axios: HTTP 客户端，用于调用 ONES 登录 API
- graphqlClient: GraphQL 客户端，用于设置认证头

## 测试

需要编写以下测试（任务 3.3）：

- 测试有效登录
- 测试无效登录
- 测试登出清理
- 测试会话恢复
- 测试错误处理

## 注意事项

1. **安全性**: 
   - 认证信息存储在 localStorage 中，不是最安全的方式，但符合需求
   - 生产环境应考虑使用 httpOnly cookies

2. **会话过期**:
   - GraphQLClient 检测到 401 错误时会触发 `auth:expired` 事件
   - AuthService 监听该事件并自动登出

3. **初始化**:
   - AuthService 在模块加载时自动初始化
   - 会从 localStorage 恢复认证信息（如果存在）
