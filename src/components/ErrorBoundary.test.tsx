/**
 * Error Boundary 组件单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorBoundary } from './ErrorBoundary'
import { errorHandler } from '../services/errorHandler'

// Mock errorHandler
vi.mock('../services/errorHandler', () => ({
  errorHandler: {
    getSystemHandler: vi.fn(() => ({
      logError: vi.fn(),
    })),
  },
}))

// 创建一个会抛出错误的组件
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('测试错误')
  }
  return <div>正常内容</div>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 抑制 console.error 输出
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>测试内容</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('测试内容')).toBeInTheDocument()
  })

  it('should catch rendering errors and display error UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('页面出现错误')).toBeInTheDocument()
    expect(screen.getByText(/抱歉，页面渲染时发生了错误/)).toBeInTheDocument()
  })

  it('should log error when error is caught', () => {
    const logErrorMock = vi.fn()
    vi.mocked(errorHandler.getSystemHandler).mockReturnValue({
      logError: logErrorMock,
    } as any)

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(logErrorMock).toHaveBeenCalled()
    expect(logErrorMock).toHaveBeenCalledWith(expect.any(Error))
  })

  it('should call onError callback when provided', () => {
    const onErrorMock = vi.fn()

    render(
      <ErrorBoundary onError={onErrorMock}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(onErrorMock).toHaveBeenCalled()
    expect(onErrorMock).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    )
  })

  it('should render custom fallback UI when provided', () => {
    const fallback = <div>自定义错误页面</div>

    render(
      <ErrorBoundary fallback={fallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('自定义错误页面')).toBeInTheDocument()
  })

  it('should show error details when showErrorDetails is true', () => {
    render(
      <ErrorBoundary showErrorDetails={true}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('错误详情：')).toBeInTheDocument()
    expect(screen.getByText(/测试错误/)).toBeInTheDocument()
  })

  it('should not show error details when showErrorDetails is false', () => {
    render(
      <ErrorBoundary showErrorDetails={false}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.queryByText('错误详情：')).not.toBeInTheDocument()
  })

  it('should display reload and reset buttons', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByRole('button', { name: '刷新页面' })).toBeInTheDocument()
    expect(screen.getByText(/重\s*试/)).toBeInTheDocument()
  })

  it('should reload page when reload button is clicked', async () => {
    const user = userEvent.setup()
    const reloadMock = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    })

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    const reloadButton = screen.getByRole('button', { name: '刷新页面' })
    await user.click(reloadButton)

    expect(reloadMock).toHaveBeenCalled()
  })
})
