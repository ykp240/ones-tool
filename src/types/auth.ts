/**
 * 认证模块类型定义
 */

/**
 * 用户信息
 */
export interface User {
  uuid: string
  name: string
  email: string
  avatar?: string
}

/**
 * 登录响应
 */
export interface AuthResponse {
  user: User
  token: string
  userId: string
}

/**
 * 登录请求参数
 */
export interface LoginRequest {
  email: string
  password: string
}

/**
 * ONES API 登录响应
 */
export interface OnesLoginResponse {
  user: {
    uuid: string
    name: string
    email: string
    avatar?: string
  }
  token: string
}

/**
 * 认证服务接口
 */
export interface IAuthService {
  /**
   * 用户登录
   * @param email 用户邮箱
   * @param password 用户密码
   * @returns 认证响应
   */
  login(email: string, password: string): Promise<AuthResponse>

  /**
   * 用户登出
   */
  logout(): void

  /**
   * 获取当前用户信息
   * @returns 当前用户，如果未登录则返回 null
   */
  getCurrentUser(): User | null

  /**
   * 检查是否已登录
   * @returns 是否已登录
   */
  isAuthenticated(): boolean

  /**
   * 获取认证令牌
   * @returns 认证令牌，如果未登录则返回 null
   */
  getAuthToken(): string | null

  /**
   * 获取用户 ID
   * @returns 用户 ID，如果未登录则返回 null
   */
  getUserId(): string | null
}

/**
 * 本地存储的认证信息
 */
export interface StoredAuthInfo {
  userId: string
  token: string
  user: User
}
