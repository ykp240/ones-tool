import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, Alert, Typography } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { LoginRequest } from '../types'
import './LoginPage.css'

const { Title } = Typography

/**
 * 登录页面组件
 * 
 * 功能：
 * - 使用 Ant Design Form 组件
 * - 实现 email 和 password 输入框
 * - 设置 autocomplete="off" 禁用自动填充
 * - 设置 password 输入框类型为 password
 * - 实现登录按钮和加载状态
 * - 显示错误提示
 * - 登录成功后恢复会话过期前的页面状态
 * 
 * 需求: 1.1, 1.2, 1.4, 8.5, 9.1, 9.2
 */
export const LoginPage = () => {
  const [form] = Form.useForm<LoginRequest>()
  const { login, loading, error, isAuthenticated } = useAuth()
  const [localError, setLocalError] = useState<string | null>(null)
  const navigate = useNavigate()

  /**
   * 登录成功后处理重定向
   * 需求 8.5: 恢复会话过期前的页面状态
   */
  useEffect(() => {
    if (isAuthenticated) {
      // 检查是否有保存的重定向路径
      const redirectPath = sessionStorage.getItem('redirectAfterLogin')
      
      if (redirectPath) {
        // 清除保存的路径
        sessionStorage.removeItem('redirectAfterLogin')
        // 重定向到保存的页面
        navigate(redirectPath, { replace: true })
      } else {
        // 默认重定向到主页
        navigate('/', { replace: true })
      }
    }
  }, [isAuthenticated, navigate])

  /**
   * 处理表单提交
   */
  const handleSubmit = async (values: LoginRequest) => {
    try {
      setLocalError(null)
      await login(values.email, values.password)
      // 登录成功后，useEffect 会处理跳转
    } catch (err) {
      // 错误已经在 AuthContext 中处理，这里只是为了防止未捕获的异常
      const errorMessage = err instanceof Error ? err.message : '登录失败，请重试'
      setLocalError(errorMessage)
    }
  }

  /**
   * 处理表单提交失败（验证失败）
   */
  const handleSubmitFailed = () => {
    setLocalError('请填写完整的登录信息')
  }

  // 显示的错误信息（优先显示 AuthContext 的错误）
  const displayError = error || localError

  return (
    <div className="login-page">
      <Card className="login-card">
        <div className="login-header">
          <Title level={2}>ONES 工时填报系统</Title>
          <p className="login-subtitle">请使用 ONES 账号登录</p>
        </div>

        {displayError && (
          <Alert
            message="登录失败"
            description={displayError}
            type="error"
            showIcon
            closable
            onClose={() => setLocalError(null)}
            className="login-error"
          />
        )}

        <Form
          form={form}
          name="login"
          onFinish={handleSubmit}
          onFinishFailed={handleSubmitFailed}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱地址' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="邮箱地址"
              autoComplete="off"
              disabled={loading}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 1, message: '密码不能为空' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              type="password"
              placeholder="密码"
              autoComplete="off"
              disabled={loading}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              className="login-button"
            >
              {loading ? '登录中...' : '登录'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
