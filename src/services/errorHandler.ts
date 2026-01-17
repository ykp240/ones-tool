/**
 * 错误处理服务
 * 
 * 实现统一的错误处理机制，包括网络错误、认证错误、业务错误和系统错误的处理
 * 需求: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */

import { message } from 'antd'
import axios, { AxiosError } from 'axios'
import {
  AppError,
  AuthError,
  BusinessError,
  ErrorCategory,
  ErrorHandlerOptions,
  NetworkError,
  RetryConfig,
  SystemError,
} from '../types/error'

/**
 * 网络错误处理器
 * 需求: 8.2
 */
export class NetworkErrorHandler {
  /**
   * 处理网络错误
   * 显示网络错误提示
   */
  handleNetworkError(error: NetworkError, options: ErrorHandlerOptions = {}): void {
    const { showNotification = true, logToConsole = true } = options

    if (logToConsole) {
      console.error('Network Error:', error)
    }

    if (showNotification) {
      // 需求 8.2: 显示网络错误提示并提供重试选项
      message.error({
        content: error.message || '网络连接失败，请检查网络连接后重试',
        duration: 5,
      })
    }
  }

  /**
   * 提供重试机制
   * 需求: 8.2, 8.3
   * 
   * @param request 要重试的请求函数
   * @param config 重试配置
   * @returns 请求结果
   */
  async retry<T>(
    request: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      initialDelay = 1000,
      maxDelay = 10000,
      backoffMultiplier = 2,
    } = config

    let lastError: Error | undefined
    let delay = initialDelay

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await request()
      } catch (error) {
        lastError = error as Error

        // 如果是最后一次尝试，直接抛出错误
        if (attempt === maxRetries) {
          break
        }

        // 如果不是网络错误，不重试
        if (!(error instanceof NetworkError) && !this.isNetworkError(error)) {
          throw error
        }

        // 等待后重试（指数退避）
        await this.sleep(delay)
        delay = Math.min(delay * backoffMultiplier, maxDelay)
      }
    }

    throw lastError
  }

  /**
   * 判断是否为网络错误
   */
  private isNetworkError(error: any): boolean {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError
      // 请求已发送但没有收到响应
      return !axiosError.response && !!axiosError.request
    }
    return false
  }

  /**
   * 延迟函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

/**
 * 认证错误处理器
 * 需求: 8.5, 8.6
 */
export class AuthErrorHandler {
  /**
   * 处理认证错误
   * 需求: 8.6
   */
  handleAuthError(error: AuthError, options: ErrorHandlerOptions = {}): void {
    const {
      showNotification = true,
      logToConsole = true,
      redirectToLogin = true,
      preserveState = true,
    } = options

    if (logToConsole) {
      console.error('Auth Error:', error)
    }

    if (showNotification) {
      if (error.statusCode === 401) {
        // 需求 8.5, 8.6: 会话过期提示
        message.warning({
          content: '登录已过期，请重新登录',
          duration: 3,
        })
      } else if (error.statusCode === 403) {
        message.error({
          content: '权限不足，无法执行此操作',
          duration: 3,
        })
      } else {
        message.error({
          content: error.message || '认证失败',
          duration: 3,
        })
      }
    }

    // 需求 8.6: 401 错误时重定向到登录页
    if (redirectToLogin && error.statusCode === 401) {
      this.redirectToLogin(preserveState)
    }
  }

  /**
   * 重定向到登录页
   * 需求: 8.5, 8.6
   * 
   * @param preserveState 是否保留当前页面状态
   */
  redirectToLogin(preserveState: boolean = true): void {
    // 需求 8.5: 保留当前页面状态
    if (preserveState) {
      const currentPath = window.location.pathname + window.location.search
      sessionStorage.setItem('redirectAfterLogin', currentPath)
    }

    // 需求 8.6: 清除本地认证信息
    // 注意：实际的清除操作应该由 AuthService 处理
    // 这里只是触发重定向
    window.location.href = '/login'
  }

  /**
   * 刷新令牌（预留接口）
   * 当前 ONES API 不支持令牌刷新，此方法为未来扩展预留
   */
  async refreshToken(): Promise<void> {
    // TODO: 实现令牌刷新逻辑（如果 ONES API 支持）
    throw new Error('Token refresh not implemented')
  }
}

/**
 * 业务错误处理器
 * 需求: 8.1
 */
export class BusinessErrorHandler {
  /**
   * 处理业务错误
   * 需求: 8.1
   */
  handleBusinessError(error: BusinessError, options: ErrorHandlerOptions = {}): void {
    const { showNotification = true, logToConsole = true } = options

    if (logToConsole) {
      console.error('Business Error:', error)
    }

    if (showNotification) {
      this.showErrorMessage(error.message)
    }
  }

  /**
   * 显示错误消息
   * 需求: 8.1
   */
  showErrorMessage(errorMessage: string): void {
    message.error({
      content: errorMessage,
      duration: 5,
    })
  }
}

/**
 * 系统错误处理器
 * 需求: 8.4
 */
export class SystemErrorHandler {
  /**
   * 处理系统错误
   * 需求: 8.4
   */
  handleSystemError(error: SystemError, options: ErrorHandlerOptions = {}): void {
    const { showNotification = true, logToConsole = true } = options

    // 需求 8.4: 记录错误详情到控制台
    if (logToConsole) {
      this.logError(error)
    }

    if (showNotification) {
      // 需求 8.4: 显示通用错误信息
      message.error({
        content: error.message || '系统错误，请稍后重试',
        duration: 5,
      })
    }
  }

  /**
   * 记录错误日志
   * 需求: 8.4
   */
  logError(error: Error): void {
    console.error('System Error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error instanceof AppError && {
        category: error.category,
        code: error.code,
        statusCode: error.statusCode,
        details: error.details,
      }),
    })
  }

  /**
   * 显示通用错误页面（预留接口）
   */
  showErrorPage(): void {
    // TODO: 实现错误页面显示逻辑
    console.error('Critical error occurred')
  }
}

/**
 * 统一错误处理器
 * 
 * 根据错误类型分发到相应的处理器
 * 需求: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */
export class ErrorHandler {
  private networkHandler: NetworkErrorHandler
  private authHandler: AuthErrorHandler
  private businessHandler: BusinessErrorHandler
  private systemHandler: SystemErrorHandler

  constructor() {
    this.networkHandler = new NetworkErrorHandler()
    this.authHandler = new AuthErrorHandler()
    this.businessHandler = new BusinessErrorHandler()
    this.systemHandler = new SystemErrorHandler()
  }

  /**
   * 处理错误
   * 根据错误类型分发到相应的处理器
   * 需求: 8.1, 8.2, 8.4
   */
  handle(error: Error | AppError, options: ErrorHandlerOptions = {}): void {
    // 如果是 AppError，根据类别分发
    if (error instanceof AppError) {
      switch (error.category) {
        case ErrorCategory.NETWORK:
          this.networkHandler.handleNetworkError(error as NetworkError, options)
          break
        case ErrorCategory.AUTH:
          this.authHandler.handleAuthError(error as AuthError, options)
          break
        case ErrorCategory.BUSINESS:
          this.businessHandler.handleBusinessError(error as BusinessError, options)
          break
        case ErrorCategory.SYSTEM:
          this.systemHandler.handleSystemError(error as SystemError, options)
          break
        default:
          this.systemHandler.handleSystemError(
            new SystemError(error.message),
            options
          )
      }
    } else if (axios.isAxiosError(error)) {
      // 处理 Axios 错误
      this.handleAxiosError(error, options)
    } else {
      // 未知错误，作为系统错误处理
      this.systemHandler.handleSystemError(
        new SystemError(error.message || '未知错误'),
        options
      )
    }
  }

  /**
   * 处理 Axios 错误
   * 将 Axios 错误转换为应用错误类型
   */
  private handleAxiosError(error: AxiosError, options: ErrorHandlerOptions = {}): void {
    if (error.response) {
      // 服务器返回错误响应
      const status = error.response.status
      const message = (error.response.data as any)?.message || error.message

      if (status === 401) {
        // 认证错误
        this.authHandler.handleAuthError(new AuthError(message, status), options)
      } else if (status === 403) {
        // 权限错误
        this.authHandler.handleAuthError(
          new AuthError('权限不足', status),
          options
        )
      } else if (status >= 400 && status < 500) {
        // 业务错误
        this.businessHandler.handleBusinessError(
          new BusinessError(message, undefined, status),
          options
        )
      } else if (status >= 500) {
        // 系统错误
        this.systemHandler.handleSystemError(
          new SystemError('服务器错误，请稍后重试', status),
          options
        )
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应 - 网络错误
      this.networkHandler.handleNetworkError(
        new NetworkError('网络连接失败，请检查网络连接后重试'),
        options
      )
    } else {
      // 请求配置错误
      this.systemHandler.handleSystemError(
        new SystemError('请求配置错误'),
        options
      )
    }
  }

  /**
   * 获取网络错误处理器
   */
  getNetworkHandler(): NetworkErrorHandler {
    return this.networkHandler
  }

  /**
   * 获取认证错误处理器
   */
  getAuthHandler(): AuthErrorHandler {
    return this.authHandler
  }

  /**
   * 获取业务错误处理器
   */
  getBusinessHandler(): BusinessErrorHandler {
    return this.businessHandler
  }

  /**
   * 获取系统错误处理器
   */
  getSystemHandler(): SystemErrorHandler {
    return this.systemHandler
  }
}

// 导出单例实例
export const errorHandler = new ErrorHandler()
