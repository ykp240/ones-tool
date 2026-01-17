/**
 * 错误处理服务单元测试
 * 
 * 测试各种错误处理器的功能
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { message } from 'antd'
import axios, { AxiosError } from 'axios'
import {
  ErrorHandler,
  NetworkErrorHandler,
  AuthErrorHandler,
  BusinessErrorHandler,
  SystemErrorHandler,
} from './errorHandler'
import {
  NetworkError,
  AuthError,
  BusinessError,
  SystemError,
} from '../types/error'

// Mock antd message
vi.mock('antd', () => ({
  message: {
    error: vi.fn(),
    warning: vi.fn(),
    success: vi.fn(),
  },
}))

describe('NetworkErrorHandler', () => {
  let handler: NetworkErrorHandler

  beforeEach(() => {
    handler = new NetworkErrorHandler()
    vi.clearAllMocks()
  })

  describe('handleNetworkError', () => {
    it('should display network error message', () => {
      const error = new NetworkError('网络连接失败')
      handler.handleNetworkError(error)

      expect(message.error).toHaveBeenCalledWith({
        content: '网络连接失败',
        duration: 5,
      })
    })

    it('should log error to console when logToConsole is true', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const error = new NetworkError('网络连接失败')
      
      handler.handleNetworkError(error, { logToConsole: true })

      expect(consoleSpy).toHaveBeenCalledWith('Network Error:', error)
      consoleSpy.mockRestore()
    })

    it('should not show notification when showNotification is false', () => {
      const error = new NetworkError('网络连接失败')
      handler.handleNetworkError(error, { showNotification: false })

      expect(message.error).not.toHaveBeenCalled()
    })
  })

  describe('retry', () => {
    it('should succeed on first attempt', async () => {
      const mockRequest = vi.fn().mockResolvedValue('success')
      
      const result = await handler.retry(mockRequest)

      expect(result).toBe('success')
      expect(mockRequest).toHaveBeenCalledTimes(1)
    })

    it('should retry on network error and eventually succeed', async () => {
      const mockRequest = vi
        .fn()
        .mockRejectedValueOnce(new NetworkError('网络错误'))
        .mockRejectedValueOnce(new NetworkError('网络错误'))
        .mockResolvedValue('success')

      const result = await handler.retry(mockRequest, {
        maxRetries: 3,
        initialDelay: 10,
      })

      expect(result).toBe('success')
      expect(mockRequest).toHaveBeenCalledTimes(3)
    })

    it('should throw error after max retries', async () => {
      const mockRequest = vi.fn().mockRejectedValue(new NetworkError('网络错误'))

      await expect(
        handler.retry(mockRequest, {
          maxRetries: 2,
          initialDelay: 10,
        })
      ).rejects.toThrow('网络错误')

      expect(mockRequest).toHaveBeenCalledTimes(3) // initial + 2 retries
    })

    it('should not retry on non-network errors', async () => {
      const mockRequest = vi.fn().mockRejectedValue(new BusinessError('业务错误'))

      await expect(
        handler.retry(mockRequest, {
          maxRetries: 3,
          initialDelay: 10,
        })
      ).rejects.toThrow('业务错误')

      expect(mockRequest).toHaveBeenCalledTimes(1) // no retries
    })

    it('should use exponential backoff', async () => {
      const delays: number[] = []
      const startTimes: number[] = []
      
      const mockRequest = vi.fn().mockImplementation(() => {
        startTimes.push(Date.now())
        return Promise.reject(new NetworkError('网络错误'))
      })

      try {
        await handler.retry(mockRequest, {
          maxRetries: 2,
          initialDelay: 50,
          backoffMultiplier: 2,
        })
      } catch (error) {
        // Expected to fail
      }

      // Calculate delays between attempts
      for (let i = 1; i < startTimes.length; i++) {
        delays.push(startTimes[i] - startTimes[i - 1])
      }

      // First delay should be around 50ms, second around 100ms
      expect(delays[0]).toBeGreaterThanOrEqual(40)
      expect(delays[0]).toBeLessThan(100)
      expect(delays[1]).toBeGreaterThanOrEqual(90)
      expect(delays[1]).toBeLessThan(150)
    })
  })
})

describe('AuthErrorHandler', () => {
  let handler: AuthErrorHandler

  beforeEach(() => {
    handler = new AuthErrorHandler()
    vi.clearAllMocks()
    delete (window as any).location
    ;(window as any).location = { href: '' }
  })

  afterEach(() => {
    sessionStorage.clear()
  })

  describe('handleAuthError', () => {
    it('should display session expired message for 401 error', () => {
      const error = new AuthError('会话过期', 401)
      handler.handleAuthError(error, { redirectToLogin: false })

      expect(message.warning).toHaveBeenCalledWith({
        content: '登录已过期，请重新登录',
        duration: 3,
      })
    })

    it('should display permission denied message for 403 error', () => {
      const error = new AuthError('权限不足', 403)
      handler.handleAuthError(error, { redirectToLogin: false })

      expect(message.error).toHaveBeenCalledWith({
        content: '权限不足，无法执行此操作',
        duration: 3,
      })
    })

    it('should redirect to login on 401 error', () => {
      const error = new AuthError('会话过期', 401)
      handler.handleAuthError(error, { redirectToLogin: true })

      expect(window.location.href).toBe('/login')
    })

    it('should preserve state when redirecting to login', () => {
      // Mock current location
      Object.defineProperty(window, 'location', {
        value: {
          pathname: '/tasks',
          search: '?status=in_progress',
          href: '',
        },
        writable: true,
      })

      const error = new AuthError('会话过期', 401)
      handler.handleAuthError(error, {
        redirectToLogin: true,
        preserveState: true,
      })

      expect(sessionStorage.getItem('redirectAfterLogin')).toBe(
        '/tasks?status=in_progress'
      )
    })

    it('should not preserve state when preserveState is false', () => {
      const error = new AuthError('会话过期', 401)
      handler.handleAuthError(error, {
        redirectToLogin: true,
        preserveState: false,
      })

      expect(sessionStorage.getItem('redirectAfterLogin')).toBeNull()
    })
  })

  describe('redirectToLogin', () => {
    it('should redirect to login page', () => {
      handler.redirectToLogin(false)
      expect(window.location.href).toBe('/login')
    })

    it('should save current path when preserveState is true', () => {
      Object.defineProperty(window, 'location', {
        value: {
          pathname: '/timesheet',
          search: '',
          href: '',
        },
        writable: true,
      })

      handler.redirectToLogin(true)
      expect(sessionStorage.getItem('redirectAfterLogin')).toBe('/timesheet')
    })
  })
})

describe('BusinessErrorHandler', () => {
  let handler: BusinessErrorHandler

  beforeEach(() => {
    handler = new BusinessErrorHandler()
    vi.clearAllMocks()
  })

  describe('handleBusinessError', () => {
    it('should display business error message', () => {
      const error = new BusinessError('数据验证失败')
      handler.handleBusinessError(error)

      expect(message.error).toHaveBeenCalledWith({
        content: '数据验证失败',
        duration: 5,
      })
    })

    it('should log error to console', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const error = new BusinessError('数据验证失败')
      
      handler.handleBusinessError(error)

      expect(consoleSpy).toHaveBeenCalledWith('Business Error:', error)
      consoleSpy.mockRestore()
    })
  })

  describe('showErrorMessage', () => {
    it('should display custom error message', () => {
      handler.showErrorMessage('自定义错误消息')

      expect(message.error).toHaveBeenCalledWith({
        content: '自定义错误消息',
        duration: 5,
      })
    })
  })
})

describe('SystemErrorHandler', () => {
  let handler: SystemErrorHandler

  beforeEach(() => {
    handler = new SystemErrorHandler()
    vi.clearAllMocks()
  })

  describe('handleSystemError', () => {
    it('should display system error message', () => {
      const error = new SystemError('服务器内部错误', 500)
      handler.handleSystemError(error)

      expect(message.error).toHaveBeenCalledWith({
        content: '服务器内部错误',
        duration: 5,
      })
    })

    it('should log error details', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const error = new SystemError('服务器内部错误', 500)
      
      handler.handleSystemError(error)

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('logError', () => {
    it('should log error with details', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const error = new SystemError('测试错误', 500)
      
      handler.logError(error)

      expect(consoleSpy).toHaveBeenCalledWith('System Error:', expect.objectContaining({
        name: 'SystemError',
        message: '测试错误',
      }))
      consoleSpy.mockRestore()
    })
  })
})

describe('ErrorHandler', () => {
  let handler: ErrorHandler

  beforeEach(() => {
    handler = new ErrorHandler()
    vi.clearAllMocks()
  })

  describe('handle', () => {
    it('should handle NetworkError', () => {
      const error = new NetworkError('网络连接失败')
      handler.handle(error)

      expect(message.error).toHaveBeenCalledWith({
        content: '网络连接失败',
        duration: 5,
      })
    })

    it('should handle AuthError', () => {
      const error = new AuthError('认证失败', 401)
      handler.handle(error, { redirectToLogin: false })

      expect(message.warning).toHaveBeenCalled()
    })

    it('should handle BusinessError', () => {
      const error = new BusinessError('业务错误')
      handler.handle(error)

      expect(message.error).toHaveBeenCalledWith({
        content: '业务错误',
        duration: 5,
      })
    })

    it('should handle SystemError', () => {
      const error = new SystemError('系统错误')
      handler.handle(error)

      expect(message.error).toHaveBeenCalledWith({
        content: '系统错误',
        duration: 5,
      })
    })

    it('should handle generic Error as SystemError', () => {
      const error = new Error('未知错误')
      handler.handle(error)

      expect(message.error).toHaveBeenCalled()
    })

    it('should handle Axios 401 error as AuthError', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 401,
          data: { message: '未授权' },
        },
        message: '未授权',
      } as AxiosError

      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true)
      handler.handle(axiosError, { redirectToLogin: false })

      expect(message.warning).toHaveBeenCalled()
    })

    it('should handle Axios 403 error as AuthError', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 403,
          data: {},
        },
        message: '权限不足',
      } as AxiosError

      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true)
      handler.handle(axiosError, { redirectToLogin: false })

      expect(message.error).toHaveBeenCalledWith({
        content: '权限不足，无法执行此操作',
        duration: 3,
      })
    })

    it('should handle Axios 400 error as BusinessError', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: { message: '请求参数错误' },
        },
        message: '请求参数错误',
      } as AxiosError

      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true)
      handler.handle(axiosError)

      expect(message.error).toHaveBeenCalledWith({
        content: '请求参数错误',
        duration: 5,
      })
    })

    it('should handle Axios 500 error as SystemError', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 500,
          data: {},
        },
        message: '服务器错误',
      } as AxiosError

      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true)
      handler.handle(axiosError)

      expect(message.error).toHaveBeenCalledWith({
        content: '服务器错误，请稍后重试',
        duration: 5,
      })
    })

    it('should handle Axios network error', () => {
      const axiosError = {
        isAxiosError: true,
        request: {},
        message: '网络错误',
      } as AxiosError

      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true)
      handler.handle(axiosError)

      expect(message.error).toHaveBeenCalledWith({
        content: '网络连接失败，请检查网络连接后重试',
        duration: 5,
      })
    })
  })

  describe('getters', () => {
    it('should return NetworkErrorHandler', () => {
      expect(handler.getNetworkHandler()).toBeInstanceOf(NetworkErrorHandler)
    })

    it('should return AuthErrorHandler', () => {
      expect(handler.getAuthHandler()).toBeInstanceOf(AuthErrorHandler)
    })

    it('should return BusinessErrorHandler', () => {
      expect(handler.getBusinessHandler()).toBeInstanceOf(BusinessErrorHandler)
    })

    it('should return SystemErrorHandler', () => {
      expect(handler.getSystemHandler()).toBeInstanceOf(SystemErrorHandler)
    })
  })
})
