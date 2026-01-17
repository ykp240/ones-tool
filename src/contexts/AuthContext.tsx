/**
 * 认证上下文
 * 
 * 提供全局认证状态和认证操作
 * 
 * 实现需求:
 * - 1.1: 用户登录
 * - 1.3: 存储和提供认证状态
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services/authService'
import type { User } from '../types/auth'

/**
 * 认证上下文类型
 */
export interface AuthContextType {
  /**
   * 当前用户信息
   */
  user: User | null

  /**
   * 是否已登录
   */
  isAuthenticated: boolean

  /**
   * 登录方法
   * @param email 用户邮箱
   * @param password 用户密码
   */
  login: (email: string, password: string) => Promise<void>

  /**
   * 登出方法
   */
  logout: () => void

  /**
   * 加载状态
   */
  loading: boolean

  /**
   * 错误信息
   */
  error: string | null
}

/**
 * 认证上下文
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * 认证提供者属性
 */
export interface AuthProviderProps {
  children: React.ReactNode
}

/**
 * 认证提供者组件
 * 
 * 需求 1.1: 实现登录逻辑
 * 需求 1.3: 提供全局认证状态
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * 初始化认证状态
   * 从本地存储恢复用户信息
   */
  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
    }
  }, [])

  /**
   * 监听登出事件
   */
  useEffect(() => {
    const handleLogout = () => {
      setUser(null)
      setError(null)
    }

    window.addEventListener('auth:logout', handleLogout)

    return () => {
      window.removeEventListener('auth:logout', handleLogout)
    }
  }, [])

  /**
   * 监听会话过期事件
   * 需求 1.5, 8.5, 8.6: 会话过期时提示用户重新登录并保留当前页面状态
   */
  useEffect(() => {
    const handleSessionExpired = () => {
      // 清除用户状态
      setUser(null)
      setError('登录已过期，请重新登录')
    }

    window.addEventListener('auth:expired', handleSessionExpired)

    return () => {
      window.removeEventListener('auth:expired', handleSessionExpired)
    }
  }, [])

  /**
   * 登录方法
   * 
   * 需求 1.1: 调用认证服务进行登录
   * 需求 1.3: 更新全局认证状态
   */
  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)

      // 调用认证服务登录
      const authResponse = await authService.login(email, password)

      // 更新用户状态
      setUser(authResponse.user)
    } catch (err) {
      // 设置错误信息
      const errorMessage = err instanceof Error ? err.message : '登录失败，请稍后重试'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * 登出方法
   * 
   * 需求 1.3: 清除全局认证状态
   */
  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
    setError(null)
  }, [])

  /**
   * 计算是否已登录
   */
  const isAuthenticated = user !== null && authService.isAuthenticated()

  const value: AuthContextType = {
    user,
    isAuthenticated,
    login,
    logout,
    loading,
    error,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * 使用认证上下文的 Hook
 * 
 * @returns 认证上下文
 * @throws {Error} 如果在 AuthProvider 外部使用
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
