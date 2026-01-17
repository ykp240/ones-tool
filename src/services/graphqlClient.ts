/**
 * GraphQL 客户端实现
 * 
 * 封装 graphql-request 库，提供统一的 GraphQL API 调用接口
 * 自动添加认证头，处理错误响应
 */

import { GraphQLClient as GQLClient, ClientError } from 'graphql-request'
import { config } from '../config'
import type { IGraphQLClient } from '../types/graphql'
import { NetworkError, AuthError, BusinessError, SystemError } from '../types/error'

/**
 * GraphQL 客户端类
 * 
 * 实现需求:
 * - 1.6: 在请求头中包含 Ones-User-Id 和 Ones-Auth-Token
 * - 10.8: 使用正确的端点格式
 * - 10.9: 在请求体中包含有效的 GraphQL 查询或变更语句
 */
export class GraphQLClient implements IGraphQLClient {
  private client: GQLClient
  private userId: string | null = null
  private authToken: string | null = null

  constructor() {
    // 初始化 GraphQL 客户端，使用配置的端点
    this.client = new GQLClient(config.graphqlEndpoint)
  }

  /**
   * 设置认证信息
   * 
   * @param userId 用户 ID
   * @param token 认证令牌
   */
  setAuth(userId: string, token: string): void {
    this.userId = userId
    this.authToken = token
  }

  /**
   * 清除认证信息
   */
  clearAuth(): void {
    this.userId = null
    this.authToken = null
  }

  /**
   * 获取请求头
   * 自动添加认证头（如果已设置）
   * 
   * @returns 请求头对象
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // 如果已设置认证信息，添加认证头
    // 需求 1.6: 在请求头中包含 Ones-User-Id 和 Ones-Auth-Token
    if (this.userId && this.authToken) {
      headers['Ones-User-Id'] = this.userId
      headers['Ones-Auth-Token'] = this.authToken
    }

    return headers
  }

  /**
   * 执行 GraphQL 查询
   * 
   * @param query GraphQL 查询语句
   * @param variables 查询变量
   * @returns 查询结果
   * @throws {AppError} 当 GraphQL 请求失败时
   */
  async query<T>(query: string, variables?: Record<string, any>): Promise<T> {
    try {
      // 设置请求头
      const headers = this.getHeaders()

      // 执行查询
      // 需求 10.9: 在请求体中包含有效的 GraphQL 查询语句
      const data = await this.client.request<T>(query, variables, headers)

      return data
    } catch (error) {
      // 处理 GraphQL 错误
      // 需求 8.1, 8.2, 8.4: 统一错误处理
      this.handleError(error)
      throw this.convertToAppError(error)
    }
  }

  /**
   * 执行 GraphQL 变更
   * 
   * @param mutation GraphQL 变更语句
   * @param variables 变更变量
   * @returns 变更结果
   * @throws {AppError} 当 GraphQL 请求失败时
   */
  async mutate<T>(mutation: string, variables?: Record<string, any>): Promise<T> {
    try {
      // 设置请求头
      const headers = this.getHeaders()

      // 执行变更
      // 需求 10.9: 在请求体中包含有效的 GraphQL 变更语句
      const data = await this.client.request<T>(mutation, variables, headers)

      return data
    } catch (error) {
      // 处理 GraphQL 错误
      // 需求 8.1, 8.2, 8.4: 统一错误处理
      this.handleError(error)
      throw this.convertToAppError(error)
    }
  }

  /**
   * 处理 GraphQL 错误
   * 
   * @param error 错误对象
   */
  private handleError(error: unknown): void {
    if (error instanceof ClientError) {
      // GraphQL 错误
      const { response, request } = error

      // 记录错误信息
      console.error('GraphQL Error:', {
        query: request.query,
        variables: request.variables,
        errors: response.errors,
        status: response.status,
      })

      // 检查是否是认证错误
      // 需求 8.5, 8.6: 401 错误时清除认证信息并引导用户重新登录
      if (response.status === 401) {
        // 会话过期，清除认证信息
        this.clearAuth()
        
        // 触发会话过期事件（可以被其他模块监听）
        // 需求 1.5, 8.5: 提示用户重新登录并保留当前页面状态
        window.dispatchEvent(new CustomEvent('auth:expired'))
      }
    } else {
      // 其他错误（网络错误等）
      console.error('Network Error:', error)
    }
  }

  /**
   * 将错误转换为应用错误类型
   * 需求 8.1, 8.2, 8.4, 8.6: 统一错误处理
   * 
   * @param error 原始错误
   * @returns 应用错误
   */
  private convertToAppError(error: unknown): Error {
    if (error instanceof ClientError) {
      const { response } = error
      const status = response.status
      const message = response.errors?.[0]?.message || error.message

      // 根据状态码分类错误
      if (status === 401) {
        // 需求 8.6: 认证错误
        return new AuthError(message || '认证失败，请重新登录', status)
      } else if (status === 403) {
        // 权限错误
        return new AuthError('权限不足，无法执行此操作', status)
      } else if (status >= 400 && status < 500) {
        // 需求 8.1: 业务错误
        return new BusinessError(message || '请求参数错误', undefined, status)
      } else if (status >= 500) {
        // 需求 8.4: 系统错误
        return new SystemError('服务器错误，请稍后重试', status)
      }
    }

    // 需求 8.2: 网络错误
    if (error instanceof Error) {
      // 检查是否是网络错误
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return new NetworkError('网络连接失败，请检查网络连接后重试')
      }
    }

    // 未知错误
    return new SystemError('未知错误，请稍后重试')
  }
}

// 导出单例实例
export const graphqlClient = new GraphQLClient()
