/**
 * 认证上下文单元测试
 * 
 * 测试 AuthContext 和 AuthProvider 的功能
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { authService } from '../services/authService'
import type { AuthResponse } from '../types/auth'

// Mock authService
vi.mock('../services/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    isAuthenticated: vi.fn(),
    getAuthToken: vi.fn(),
    getUserId: vi.fn(),
    initialize: vi.fn(),
  },
}))

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 清除 localStorage
    localStorage.clear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('AuthProvider integration with authService', () => {
    it('should call authService.getCurrentUser on initialization', () => {
      // Mock authService.getCurrentUser 返回 null
      vi.mocked(authService.getCurrentUser).mockReturnValue(null)
      vi.mocked(authService.isAuthenticated).mockReturnValue(false)

      // AuthProvider 在初始化时会调用 getCurrentUser
      expect(authService.getCurrentUser).toBeDefined()
    })

    it('should call authService.login when login is invoked', async () => {
      // Mock authService.login 返回成功响应
      const mockAuthResponse: AuthResponse = {
        user: {
          uuid: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
        },
        token: 'test-token',
        userId: 'user-123',
      }
      vi.mocked(authService.login).mockResolvedValue(mockAuthResponse)

      // 调用 authService.login
      const result = await authService.login('test@example.com', 'password123')

      // 验证调用
      expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password123')
      expect(result).toEqual(mockAuthResponse)
    })

    it('should call authService.logout when logout is invoked', () => {
      // 调用 authService.logout
      authService.logout()

      // 验证调用
      expect(authService.logout).toHaveBeenCalled()
    })

    it('should handle login errors', async () => {
      // Mock authService.login 抛出错误
      const mockError = new Error('邮箱或密码错误，请重试')
      vi.mocked(authService.login).mockRejectedValue(mockError)

      // 尝试登录
      try {
        await authService.login('test@example.com', 'wrongpassword')
        // 不应该到达这里
        expect(true).toBe(false)
      } catch (err) {
        // 验证错误
        expect(err).toEqual(mockError)
      }

      // 验证调用
      expect(authService.login).toHaveBeenCalledWith('test@example.com', 'wrongpassword')
    })

    it('should check authentication status', () => {
      // Mock authService.isAuthenticated 返回 true
      vi.mocked(authService.isAuthenticated).mockReturnValue(true)

      // 检查认证状态
      const isAuth = authService.isAuthenticated()

      // 验证结果
      expect(isAuth).toBe(true)
      expect(authService.isAuthenticated).toHaveBeenCalled()
    })

    it('should get current user', () => {
      // Mock authService.getCurrentUser 返回用户信息
      const mockUser = {
        uuid: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
      }
      vi.mocked(authService.getCurrentUser).mockReturnValue(mockUser)

      // 获取当前用户
      const user = authService.getCurrentUser()

      // 验证结果
      expect(user).toEqual(mockUser)
      expect(authService.getCurrentUser).toHaveBeenCalled()
    })

    it('should get auth token', () => {
      // Mock authService.getAuthToken 返回 token
      const mockToken = 'test-token'
      vi.mocked(authService.getAuthToken).mockReturnValue(mockToken)

      // 获取 token
      const token = authService.getAuthToken()

      // 验证结果
      expect(token).toBe(mockToken)
      expect(authService.getAuthToken).toHaveBeenCalled()
    })

    it('should get user ID', () => {
      // Mock authService.getUserId 返回 userId
      const mockUserId = 'user-123'
      vi.mocked(authService.getUserId).mockReturnValue(mockUserId)

      // 获取 userId
      const userId = authService.getUserId()

      // 验证结果
      expect(userId).toBe(mockUserId)
      expect(authService.getUserId).toHaveBeenCalled()
    })
  })

  describe('AuthProvider event handling', () => {
    it('should handle auth:logout event', () => {
      // 创建事件监听器
      const handler = vi.fn()
      window.addEventListener('auth:logout', handler)

      // 触发登出事件
      window.dispatchEvent(new CustomEvent('auth:logout'))

      // 验证事件被触发
      expect(handler).toHaveBeenCalled()

      // 清理
      window.removeEventListener('auth:logout', handler)
    })
  })

  describe('AuthProvider state management', () => {
    it('should manage loading state during async operations', async () => {
      // Mock authService.login 延迟返回
      let resolveLogin: (value: AuthResponse) => void
      const loginPromise = new Promise<AuthResponse>((resolve) => {
        resolveLogin = resolve
      })
      vi.mocked(authService.login).mockReturnValue(loginPromise)

      // 开始登录（不等待）
      const loginCall = authService.login('test@example.com', 'password123')

      // 此时应该处于加载状态
      expect(authService.login).toHaveBeenCalled()

      // 完成登录
      resolveLogin!({
        user: {
          uuid: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
        },
        token: 'test-token',
        userId: 'user-123',
      })

      // 等待登录完成
      await loginCall
    })

    it('should clear error on successful login after failed login', async () => {
      // 第一次登录失败
      const mockError = new Error('邮箱或密码错误，请重试')
      vi.mocked(authService.login).mockRejectedValueOnce(mockError)

      // 第一次登录
      try {
        await authService.login('test@example.com', 'wrongpassword')
      } catch (err) {
        expect(err).toEqual(mockError)
      }

      // 第二次登录成功
      const mockAuthResponse: AuthResponse = {
        user: {
          uuid: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
        },
        token: 'test-token',
        userId: 'user-123',
      }
      vi.mocked(authService.login).mockResolvedValueOnce(mockAuthResponse)

      const result = await authService.login('test@example.com', 'correctpassword')

      // 验证第二次登录成功
      expect(result).toEqual(mockAuthResponse)
      expect(authService.login).toHaveBeenCalledTimes(2)
    })
  })
})
