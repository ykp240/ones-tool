/**
 * 认证服务实现
 * 
 * 负责用户身份验证和会话管理
 * 
 * 实现需求:
 * - 1.1: 调用 ONES 登录 API 并获取 User_ID 和 Auth_Token
 * - 1.2: 返回明确的错误提示信息
 * - 1.3: 存储 User_ID 和 Auth_Token
 * - 1.5: 处理会话过期
 * - 9.5: 清除本地存储的敏感信息
 */

import axios, { AxiosError } from 'axios'
import { config } from '../config'
import { graphqlClient } from './graphqlClient'
import { errorHandler } from './errorHandler'
import { NetworkError, AuthError, BusinessError } from '../types/error'
import type {
  IAuthService,
  User,
  AuthResponse,
  OnesLoginResponse,
  StoredAuthInfo,
} from '../types/auth'

/**
 * 本地存储键名
 */
const STORAGE_KEY = 'ones_auth_info'

/**
 * 认证服务类
 */
export class AuthService implements IAuthService {
  /**
   * 用户登录
   * 
   * 需求 1.1: 调用 ONES 登录 API（POST /project/api/project/auth/login）
   * 并获取 User_ID 和 Auth_Token
   * 
   * 需求 1.2: 返回明确的错误提示信息
   * 
   * @param email 用户邮箱
   * @param password 用户密码
   * @returns 认证响应
   * @throws {AppError} 当登录失败时
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      // 调用 ONES 登录 API
      // 需求 1.1: POST /project/api/project/auth/login
      const response = await axios.post<OnesLoginResponse>(
        config.loginEndpoint,
        {
          email,
          password,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      const { user, token } = response.data

      // 构造认证响应
      const authResponse: AuthResponse = {
        user: {
          uuid: user.uuid,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
        },
        token,
        userId: user.uuid,
      }

      // 需求 1.3: 存储 User_ID 和 Auth_Token
      this.storeAuthInfo(authResponse)

      // 设置 GraphQL 客户端的认证信息
      // 需求 1.6: 后续 API 请求将包含认证头
      graphqlClient.setAuth(authResponse.userId, authResponse.token)

      return authResponse
    } catch (error) {
      // 需求 1.2, 8.1, 8.2, 8.6: 统一错误处理
      const appError = this.convertLoginError(error)
      
      // 使用错误处理器显示错误
      errorHandler.handle(appError, {
        showNotification: true,
        logToConsole: true,
      })
      
      throw appError
    }
  }

  /**
   * 将登录错误转换为应用错误类型
   * 需求 1.2, 8.1, 8.2, 8.6: 返回明确的错误提示信息
   * 
   * @param error 原始错误
   * @returns 应用错误
   */
  private convertLoginError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message?: string }>
      
      if (axiosError.response) {
        // 服务器返回错误响应
        const status = axiosError.response.status
        const message = axiosError.response.data?.message

        if (status === 401) {
          // 需求 8.6: 认证错误
          return new AuthError(message || '邮箱或密码错误，请重试', status)
        } else if (status === 400) {
          // 需求 8.1: 业务错误
          return new BusinessError(message || '请求参数错误，请检查邮箱和密码格式', undefined, status)
        } else if (status >= 500) {
          // 需求 8.4: 系统错误
          return new BusinessError('服务器错误，请稍后重试', undefined, status)
        } else {
          return new BusinessError(message || `登录失败（错误码：${status}）`, undefined, status)
        }
      } else if (axiosError.request) {
        // 需求 8.2: 网络错误
        return new NetworkError('网络连接失败，请检查网络连接后重试')
      } else {
        // 请求配置错误
        return new BusinessError('登录请求配置错误')
      }
    }

    // 其他未知错误
    return new BusinessError('登录失败，请稍后重试')
  }

  /**
   * 用户登出
   * 
   * 需求 9.5: 清除所有本地存储的敏感信息
   */
  logout(): void {
    // 需求 9.5: 清除本地存储的敏感信息
    this.clearAuthInfo()

    // 清除 GraphQL 客户端的认证信息
    graphqlClient.clearAuth()

    // 触发登出事件（可以被其他模块监听）
    window.dispatchEvent(new CustomEvent('auth:logout'))
  }

  /**
   * 获取当前用户信息
   * 
   * @returns 当前用户，如果未登录则返回 null
   */
  getCurrentUser(): User | null {
    const authInfo = this.getStoredAuthInfo()
    return authInfo ? authInfo.user : null
  }

  /**
   * 检查是否已登录
   * 
   * @returns 是否已登录
   */
  isAuthenticated(): boolean {
    const authInfo = this.getStoredAuthInfo()
    return authInfo !== null && !!authInfo.userId && !!authInfo.token
  }

  /**
   * 获取认证令牌
   * 
   * @returns 认证令牌，如果未登录则返回 null
   */
  getAuthToken(): string | null {
    const authInfo = this.getStoredAuthInfo()
    return authInfo ? authInfo.token : null
  }

  /**
   * 获取用户 ID
   * 
   * @returns 用户 ID，如果未登录则返回 null
   */
  getUserId(): string | null {
    const authInfo = this.getStoredAuthInfo()
    return authInfo ? authInfo.userId : null
  }

  /**
   * 存储认证信息到本地存储
   * 
   * 需求 1.3: 存储 User_ID 和 Auth_Token
   * 
   * @param authResponse 认证响应
   */
  private storeAuthInfo(authResponse: AuthResponse): void {
    const authInfo: StoredAuthInfo = {
      userId: authResponse.userId,
      token: authResponse.token,
      user: authResponse.user,
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authInfo))
    } catch (error) {
      console.error('Failed to store auth info:', error)
      throw new Error('无法保存登录信息，请检查浏览器设置')
    }
  }

  /**
   * 从本地存储获取认证信息
   * 
   * @returns 存储的认证信息，如果不存在则返回 null
   */
  private getStoredAuthInfo(): StoredAuthInfo | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        return null
      }

      const authInfo = JSON.parse(stored) as StoredAuthInfo

      // 验证数据完整性
      if (!authInfo.userId || !authInfo.token || !authInfo.user) {
        // 数据不完整，清除
        this.clearAuthInfo()
        return null
      }

      return authInfo
    } catch (error) {
      console.error('Failed to parse stored auth info:', error)
      // 解析失败，清除损坏的数据
      this.clearAuthInfo()
      return null
    }
  }

  /**
   * 清除本地存储的认证信息
   * 
   * 需求 9.5: 清除所有本地存储的敏感信息
   */
  private clearAuthInfo(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear auth info:', error)
    }
  }

  /**
   * 初始化认证服务
   * 
   * 从本地存储恢复认证信息（如果存在）
   */
  initialize(): void {
    const authInfo = this.getStoredAuthInfo()
    if (authInfo) {
      // 恢复 GraphQL 客户端的认证信息
      graphqlClient.setAuth(authInfo.userId, authInfo.token)
    }

    // 监听会话过期事件
    // 需求 1.5, 8.5, 8.6: 会话过期时提示用户重新登录并保留当前页面状态
    window.addEventListener('auth:expired', () => {
      // 清除本地认证信息
      this.logout()
      
      // 使用错误处理器重定向到登录页，并保留当前页面状态
      // 需求 8.5: 保留当前页面状态
      errorHandler.getAuthHandler().redirectToLogin(true)
    })
  }
}

// 导出单例实例
export const authService = new AuthService()

// 初始化认证服务
authService.initialize()
