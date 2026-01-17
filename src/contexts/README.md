# 认证上下文 (AuthContext)

## 概述

AuthContext 提供全局的认证状态管理，包括用户登录、登出和认证状态查询功能。

## 功能

- ✅ 全局认证状态管理
- ✅ 用户登录和登出
- ✅ 自动从 localStorage 恢复认证状态
- ✅ 错误处理和加载状态
- ✅ 事件驱动的登出机制

## 使用方法

### 1. 在应用根组件中添加 AuthProvider

```tsx
import { AuthProvider } from './contexts/AuthContext'

function App() {
  return (
    <AuthProvider>
      {/* 你的应用组件 */}
    </AuthProvider>
  )
}
```

### 2. 在组件中使用 useAuth Hook

```tsx
import { useAuth } from './contexts/AuthContext'

function MyComponent() {
  const { user, isAuthenticated, login, logout, loading, error } = useAuth()

  // 使用认证状态和方法
  if (loading) {
    return <div>加载中...</div>
  }

  if (error) {
    return <div>错误: {error}</div>
  }

  if (!isAuthenticated) {
    return <button onClick={() => login('email', 'password')}>登录</button>
  }

  return (
    <div>
      <p>欢迎, {user?.name}!</p>
      <button onClick={logout}>登出</button>
    </div>
  )
}
```

## API

### AuthContextType

```typescript
interface AuthContextType {
  // 当前用户信息
  user: User | null
  
  // 是否已登录
  isAuthenticated: boolean
  
  // 登录方法
  login: (email: string, password: string) => Promise<void>
  
  // 登出方法
  logout: () => void
  
  // 加载状态
  loading: boolean
  
  // 错误信息
  error: string | null
}
```

### User 类型

```typescript
interface User {
  uuid: string
  name: string
  email: string
  avatar?: string
}
```

## 实现需求

- **需求 1.1**: 用户登录 - 调用 authService.login 进行身份验证
- **需求 1.3**: 存储和提供认证状态 - 使用 React Context 提供全局状态

## 特性

### 自动恢复认证状态

AuthProvider 在初始化时会自动从 localStorage 恢复用户信息：

```typescript
useEffect(() => {
  const currentUser = authService.getCurrentUser()
  if (currentUser) {
    setUser(currentUser)
  }
}, [])
```

### 事件驱动的登出

AuthProvider 监听 `auth:logout` 事件，支持从应用的任何地方触发登出：

```typescript
// 在任何地方触发登出
window.dispatchEvent(new CustomEvent('auth:logout'))
```

### 错误处理

登录失败时，错误信息会被存储在 context 中，并且会重新抛出错误以便调用者处理：

```typescript
try {
  await login(email, password)
} catch (err) {
  // 错误已经在 context.error 中
  console.error('Login failed:', err)
}
```

### 加载状态

登录过程中，`loading` 状态会自动更新：

```typescript
const { loading } = useAuth()

return <Button loading={loading}>登录</Button>
```

## 与 authService 的集成

AuthContext 依赖 authService 进行实际的认证操作：

- `login()` -> `authService.login()`
- `logout()` -> `authService.logout()`
- 初始化 -> `authService.getCurrentUser()`
- `isAuthenticated` -> `authService.isAuthenticated()`

## 测试

参见 `AuthContext.test.tsx` 和 `AuthContext.integration.test.tsx` 了解测试示例。

## 示例

参见 `AuthContext.example.tsx` 了解完整的使用示例。
