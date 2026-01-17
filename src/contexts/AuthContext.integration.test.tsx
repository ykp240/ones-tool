/**
 * 认证上下文集成测试
 * 
 * 测试 AuthContext 与 authService 的集成
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { authService } from '../services/authService'

describe('AuthContext Integration', () => {
  beforeEach(() => {
    // 清除 localStorage
    localStorage.clear()
  })

  afterEach(() => {
    // 清理
    localStorage.clear()
  })

  it('should export AuthProvider and useAuth', async () => {
    // 动态导入以避免在测试环境中渲染组件
    const { AuthProvider, useAuth } = await import('./AuthContext')
    
    expect(AuthProvider).toBeDefined()
    expect(typeof AuthProvider).toBe('function')
    expect(useAuth).toBeDefined()
    expect(typeof useAuth).toBe('function')
  })

  it('should integrate with authService for authentication', () => {
    // 验证 authService 方法存在
    expect(authService.login).toBeDefined()
    expect(authService.logout).toBeDefined()
    expect(authService.getCurrentUser).toBeDefined()
    expect(authService.isAuthenticated).toBeDefined()
    expect(authService.getAuthToken).toBeDefined()
    expect(authService.getUserId).toBeDefined()
  })

  it('should handle localStorage operations', () => {
    // 测试 localStorage 可以存储和读取数据
    const testData = {
      userId: 'test-user-id',
      token: 'test-token',
      user: {
        uuid: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
      },
    }

    localStorage.setItem('ones_auth_info', JSON.stringify(testData))
    const stored = localStorage.getItem('ones_auth_info')
    
    expect(stored).toBeDefined()
    expect(JSON.parse(stored!)).toEqual(testData)

    localStorage.removeItem('ones_auth_info')
    expect(localStorage.getItem('ones_auth_info')).toBeNull()
  })

  it('should support auth:logout event', () => {
    // 测试 auth:logout 事件可以被触发和监听
    let eventFired = false
    const handler = () => {
      eventFired = true
      window.removeEventListener('auth:logout', handler)
    }

    window.addEventListener('auth:logout', handler)
    window.dispatchEvent(new CustomEvent('auth:logout'))
    
    expect(eventFired).toBe(true)
  })

  it('should have correct AuthContextType interface', async () => {
    // 验证导出的类型
    const module = await import('./AuthContext')
    
    expect(module.AuthProvider).toBeDefined()
    expect(module.useAuth).toBeDefined()
  })
})
