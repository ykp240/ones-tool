/**
 * Error Boundary 组件
 * 
 * 捕获 React 组件树中的 JavaScript 错误，记录错误并显示降级 UI
 * 需求: 8.4
 */

import { Component, ErrorInfo, ReactNode } from 'react'
import { Button, Result } from 'antd'
import { errorHandler } from '../services/errorHandler'

/**
 * Error Boundary 属性
 */
export interface ErrorBoundaryProps {
  /**
   * 子组件
   */
  children: ReactNode
  
  /**
   * 自定义降级 UI（可选）
   */
  fallback?: ReactNode
  
  /**
   * 错误回调（可选）
   */
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  
  /**
   * 是否显示错误详情（开发模式）
   */
  showErrorDetails?: boolean
}

/**
 * Error Boundary 状态
 */
interface ErrorBoundaryState {
  /**
   * 是否发生错误
   */
  hasError: boolean
  
  /**
   * 错误对象
   */
  error: Error | null
  
  /**
   * 错误信息
   */
  errorInfo: ErrorInfo | null
}

/**
 * Error Boundary 组件
 * 
 * 功能：
 * - 实现 React Error Boundary
 * - 捕获组件渲染错误
 * - 显示错误 UI
 * - 记录错误日志
 * 
 * 需求: 8.4
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  /**
   * 从错误中恢复时调用
   * 需求: 8.4
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // 更新状态以显示降级 UI
    return {
      hasError: true,
      error,
    }
  }

  /**
   * 捕获子组件错误
   * 需求: 8.4
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 需求 8.4: 记录错误日志
    errorHandler.getSystemHandler().logError(error)
    
    // 记录组件堆栈信息
    console.error('Error Boundary caught an error:', {
      error,
      errorInfo,
      componentStack: errorInfo.componentStack,
    })

    // 更新状态以包含错误信息
    this.setState({
      errorInfo,
    })

    // 调用自定义错误回调
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  /**
   * 重置错误状态
   */
  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  /**
   * 刷新页面
   */
  handleReload = (): void => {
    window.location.reload()
  }

  /**
   * 渲染错误 UI
   * 需求: 8.4
   */
  renderErrorUI(): ReactNode {
    const { fallback, showErrorDetails = false } = this.props
    const { error, errorInfo } = this.state

    // 如果提供了自定义降级 UI，使用它
    if (fallback) {
      return fallback
    }

    // 默认错误 UI
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          padding: '24px',
          background: '#f0f2f5',
        }}
      >
        <Result
          status="error"
          title="页面出现错误"
          subTitle="抱歉，页面渲染时发生了错误。您可以尝试刷新页面或返回上一页。"
          extra={[
            <Button type="primary" key="reload" onClick={this.handleReload}>
              刷新页面
            </Button>,
            <Button key="reset" onClick={this.handleReset}>
              重试
            </Button>,
          ]}
        >
          {/* 开发模式下显示错误详情 */}
          {showErrorDetails && error && (
            <div
              style={{
                marginTop: '24px',
                padding: '16px',
                background: '#fff',
                border: '1px solid #d9d9d9',
                borderRadius: '4px',
                textAlign: 'left',
              }}
            >
              <h4>错误详情：</h4>
              <pre
                style={{
                  fontSize: '12px',
                  color: '#ff4d4f',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {error.toString()}
              </pre>
              
              {errorInfo && (
                <>
                  <h4 style={{ marginTop: '16px' }}>组件堆栈：</h4>
                  <pre
                    style={{
                      fontSize: '12px',
                      color: '#666',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      maxHeight: '300px',
                      overflow: 'auto',
                    }}
                  >
                    {errorInfo.componentStack}
                  </pre>
                </>
              )}
            </div>
          )}
        </Result>
      </div>
    )
  }

  /**
   * 渲染组件
   */
  render(): ReactNode {
    const { hasError } = this.state
    const { children } = this.props

    // 如果发生错误，显示错误 UI
    if (hasError) {
      return this.renderErrorUI()
    }

    // 正常渲染子组件
    return children
  }
}
