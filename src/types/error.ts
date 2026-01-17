/**
 * 错误类型定义
 * 
 * 定义应用中使用的各种错误类型和接口
 */

/**
 * 错误类别枚举
 */
export enum ErrorCategory {
  NETWORK = 'network',
  AUTH = 'auth',
  BUSINESS = 'business',
  SYSTEM = 'system',
}

/**
 * 基础应用错误类
 */
export class AppError extends Error {
  category: ErrorCategory
  code?: string
  statusCode?: number
  details?: any

  constructor(
    message: string,
    category: ErrorCategory,
    code?: string,
    statusCode?: number,
    details?: any
  ) {
    super(message)
    this.name = 'AppError'
    this.category = category
    this.code = code
    this.statusCode = statusCode
    this.details = details
  }
}

/**
 * 网络错误
 * 需求: 8.2
 */
export class NetworkError extends AppError {
  constructor(message: string, code?: string, details?: any) {
    super(message, ErrorCategory.NETWORK, code, undefined, details)
    this.name = 'NetworkError'
  }
}

/**
 * 认证错误
 * 需求: 8.6
 */
export class AuthError extends AppError {
  constructor(message: string, statusCode?: number, details?: any) {
    super(message, ErrorCategory.AUTH, undefined, statusCode, details)
    this.name = 'AuthError'
  }
}

/**
 * 业务错误
 * 需求: 8.1
 */
export class BusinessError extends AppError {
  constructor(message: string, code?: string, statusCode?: number, details?: any) {
    super(message, ErrorCategory.BUSINESS, code, statusCode, details)
    this.name = 'BusinessError'
  }
}

/**
 * 系统错误
 * 需求: 8.4
 */
export class SystemError extends AppError {
  constructor(message: string, statusCode?: number, details?: any) {
    super(message, ErrorCategory.SYSTEM, undefined, statusCode, details)
    this.name = 'SystemError'
  }
}

/**
 * 错误处理选项
 */
export interface ErrorHandlerOptions {
  showNotification?: boolean
  logToConsole?: boolean
  redirectToLogin?: boolean
  preserveState?: boolean
}

/**
 * 重试配置
 */
export interface RetryConfig {
  maxRetries: number
  initialDelay: number
  maxDelay: number
  backoffMultiplier: number
}
