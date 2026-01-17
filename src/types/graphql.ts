/**
 * GraphQL 客户端类型定义
 */

/**
 * GraphQL 客户端接口
 */
export interface IGraphQLClient {
  /**
   * 执行 GraphQL 查询
   * @param query GraphQL 查询语句
   * @param variables 查询变量
   * @returns 查询结果
   */
  query<T>(query: string, variables?: Record<string, any>): Promise<T>

  /**
   * 执行 GraphQL 变更
   * @param mutation GraphQL 变更语句
   * @param variables 变更变量
   * @returns 变更结果
   */
  mutate<T>(mutation: string, variables?: Record<string, any>): Promise<T>

  /**
   * 设置认证信息
   * @param userId 用户 ID
   * @param token 认证令牌
   */
  setAuth(userId: string, token: string): void

  /**
   * 清除认证信息
   */
  clearAuth(): void
}

/**
 * GraphQL 错误
 */
export interface GraphQLError {
  message: string
  locations?: Array<{
    line: number
    column: number
  }>
  path?: string[]
  extensions?: Record<string, any>
}

/**
 * GraphQL 响应
 */
export interface GraphQLResponse<T> {
  data?: T
  errors?: GraphQLError[]
}
