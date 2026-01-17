/**
 * 登录页面组件单元测试
 * 
 * 测试需求:
 * - 1.1: 用户登录
 * - 1.2: 错误提示
 * - 1.4: 禁用自动填充
 * - 9.1: autocomplete="off"
 * - 9.2: password 输入框类型
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'
import { LoginPage } from './LoginPage'
import * as authServiceModule from '../services/authService'

// Mock authService
vi.mock('../services/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(() => null),
    isAuthenticated: vi.fn(() => false),
    getAuthToken: vi.fn(() => null),
    getUserId: vi.fn(() => null),
  },
}))

/**
 * 渲染登录页面的辅助函数
 */
const renderLoginPage = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * 测试需求 1.1, 1.4: 登录表单渲染
   */
  it('should render login form with email and password fields', () => {
    renderLoginPage()

    // 验证标题
    expect(screen.getByText('ONES 工时填报系统')).toBeInTheDocument()
    expect(screen.getByText('请使用 ONES 账号登录')).toBeInTheDocument()

    // 验证输入框
    expect(screen.getByPlaceholderText('邮箱地址')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('密码')).toBeInTheDocument()

    // 验证登录按钮
    expect(screen.getByRole('button', { name: /登录/ })).toBeInTheDocument()
  })

  /**
   * 测试需求 9.1: autocomplete="off" 属性
   */
  it('should disable autocomplete on form and input fields', () => {
    renderLoginPage()

    // 验证表单的 autocomplete 属性
    const form = screen.getByRole('button', { name: /登录/ }).closest('form')
    expect(form).toHaveAttribute('autocomplete', 'off')

    // 验证邮箱输入框的 autocomplete 属性
    const emailInput = screen.getByPlaceholderText('邮箱地址')
    expect(emailInput).toHaveAttribute('autocomplete', 'off')

    // 验证密码输入框的 autocomplete 属性
    const passwordInput = screen.getByPlaceholderText('密码')
    expect(passwordInput).toHaveAttribute('autocomplete', 'off')
  })

  /**
   * 测试需求 9.2: password 输入框类型
   */
  it('should use password type for password field', () => {
    renderLoginPage()

    const passwordInput = screen.getByPlaceholderText('密码')
    
    // Ant Design 的 Input.Password 会渲染为 type="password"
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  /**
   * 测试需求 1.1: 成功登录
   */
  it('should call login service when form is submitted with valid credentials', async () => {
    const user = userEvent.setup()
    const mockLogin = vi.mocked(authServiceModule.authService.login)
    mockLogin.mockResolvedValue({
      user: {
        uuid: 'test-uuid',
        name: 'Test User',
        email: 'test@example.com',
      },
      token: 'test-token',
      userId: 'test-user-id',
    })

    renderLoginPage()

    // 填写表单
    const emailInput = screen.getByPlaceholderText('邮箱地址')
    const passwordInput = screen.getByPlaceholderText('密码')
    const submitButton = screen.getByRole('button', { name: /登录/ })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    // 验证调用了登录服务
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  /**
   * 测试需求 1.2: 显示错误提示
   */
  it('should display error message when login fails', async () => {
    const user = userEvent.setup()
    const mockLogin = vi.mocked(authServiceModule.authService.login)
    mockLogin.mockRejectedValue(new Error('Invalid credentials'))

    renderLoginPage()

    // 填写表单
    const emailInput = screen.getByPlaceholderText('邮箱地址')
    const passwordInput = screen.getByPlaceholderText('密码')
    const submitButton = screen.getByRole('button', { name: /登录/ })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    // 验证显示错误信息
    await waitFor(() => {
      expect(screen.getByText('登录失败')).toBeInTheDocument()
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  /**
   * 测试需求 1.1: 登录按钮加载状态
   */
  it('should show loading state on login button during submission', async () => {
    const user = userEvent.setup()
    const mockLogin = vi.mocked(authServiceModule.authService.login)
    
    // 模拟延迟的登录请求
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    renderLoginPage()

    // 填写表单
    const emailInput = screen.getByPlaceholderText('邮箱地址')
    const passwordInput = screen.getByPlaceholderText('密码')
    const submitButton = screen.getByRole('button', { name: /登录/ })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    // 验证按钮显示加载状态
    await waitFor(() => {
      expect(screen.getByText('登录中...')).toBeInTheDocument()
    })
  })

  /**
   * 测试需求 1.4: 表单验证
   */
  it('should validate email format', async () => {
    const user = userEvent.setup()
    renderLoginPage()

    // 填写无效的邮箱
    const emailInput = screen.getByPlaceholderText('邮箱地址')
    const passwordInput = screen.getByPlaceholderText('密码')
    const submitButton = screen.getByRole('button', { name: /登录/ })

    await user.type(emailInput, 'invalid-email')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    // 验证显示邮箱格式错误
    await waitFor(() => {
      expect(screen.getByText('请输入有效的邮箱地址')).toBeInTheDocument()
    })
  })

  /**
   * 测试需求 1.4: 必填字段验证
   */
  it('should require email and password fields', async () => {
    const user = userEvent.setup()
    renderLoginPage()

    // 不填写任何内容，直接提交
    const submitButton = screen.getByRole('button', { name: /登录/ })
    await user.click(submitButton)

    // 验证显示必填提示
    await waitFor(() => {
      expect(screen.getByText('请输入邮箱地址')).toBeInTheDocument()
      expect(screen.getByText('请输入密码')).toBeInTheDocument()
    })
  })

  /**
   * 测试需求 1.1: 禁用状态下不能输入
   */
  it('should disable inputs during login', async () => {
    const user = userEvent.setup()
    const mockLogin = vi.mocked(authServiceModule.authService.login)
    
    // 模拟延迟的登录请求
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    renderLoginPage()

    // 填写表单
    const emailInput = screen.getByPlaceholderText('邮箱地址')
    const passwordInput = screen.getByPlaceholderText('密码')
    const submitButton = screen.getByRole('button', { name: /登录/ })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    // 验证输入框被禁用
    await waitFor(() => {
      expect(emailInput).toBeDisabled()
      expect(passwordInput).toBeDisabled()
    })
  })
})
