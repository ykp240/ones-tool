/**
 * AuthContext 使用示例
 * 
 * 展示如何在组件中使用 AuthContext
 */

import React from 'react'
import { useAuth } from './AuthContext'
import { Button, Space, Typography, Alert } from 'antd'

const { Text } = Typography

/**
 * 认证状态显示组件示例
 */
export const AuthStatusExample: React.FC = () => {
  const { user, isAuthenticated, loading, error, login, logout } = useAuth()

  const handleLogin = async () => {
    try {
      await login('user@example.com', 'password')
    } catch (err) {
      // 错误已经在 context 中处理
      console.error('Login failed:', err)
    }
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Text strong>认证状态示例</Text>
      
      {error && <Alert message={error} type="error" />}
      
      {loading && <Text>加载中...</Text>}
      
      {isAuthenticated ? (
        <Space>
          <Text>已登录用户: {user?.name} ({user?.email})</Text>
          <Button onClick={handleLogout}>登出</Button>
        </Space>
      ) : (
        <Space>
          <Text>未登录</Text>
          <Button onClick={handleLogin} loading={loading}>
            登录
          </Button>
        </Space>
      )}
    </Space>
  )
}

/**
 * 受保护的组件示例
 * 只有登录用户才能看到内容
 */
export const ProtectedComponentExample: React.FC = () => {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Alert message="请先登录" type="warning" />
  }

  return (
    <div>
      <Text>欢迎, {user?.name}!</Text>
      <Text>这是受保护的内容，只有登录用户才能看到。</Text>
    </div>
  )
}
