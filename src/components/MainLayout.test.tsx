import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MainLayout } from './MainLayout'
import { AuthProvider } from '../contexts/AuthContext'

/**
 * 测试辅助函数：渲染带有 AuthProvider 的组件
 */
const renderWithAuth = (ui: React.ReactElement) => {
  return render(
    <AuthProvider>
      {ui}
    </AuthProvider>
  )
}

/**
 * MainLayout 组件单元测试
 * 
 * 需求: 7.1, 7.2, 7.4
 */
describe('MainLayout', () => {
  /**
   * 测试：应该渲染顶部导航栏
   * 需求: 7.1, 7.2
   */
  it('should render top navigation bar with module options', () => {
    renderWithAuth(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>
    )

    // 验证系统标题
    expect(screen.getByText('ONES 工时填报系统')).toBeInTheDocument()

    // 验证四个模块切换选项
    expect(screen.getByText('任务查询')).toBeInTheDocument()
    expect(screen.getByText('任务操作')).toBeInTheDocument()
    expect(screen.getByText('工时查询')).toBeInTheDocument()
    expect(screen.getByText('工时填报')).toBeInTheDocument()
  })

  /**
   * 测试：应该在右上角显示用户姓名
   * 需求: 7.4
   */
  it('should display user name in top right corner', () => {
    renderWithAuth(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>
    )

    // 验证用户信息显示（默认显示"用户"，因为没有登录）
    expect(screen.getByText('用户')).toBeInTheDocument()
  })

  /**
   * 测试：应该渲染主体内容区域
   * 需求: 7.1
   */
  it('should render main content area', () => {
    renderWithAuth(
      <MainLayout>
        <div data-testid="test-content">Test Content</div>
      </MainLayout>
    )

    // 验证子内容被渲染
    expect(screen.getByTestId('test-content')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  /**
   * 测试：应该支持模块切换
   * 需求: 7.2, 7.3
   */
  it('should support module switching', () => {
    const handleModuleChange = vi.fn()
    
    renderWithAuth(
      <MainLayout onModuleChange={handleModuleChange}>
        <div>Test Content</div>
      </MainLayout>
    )

    // 点击"任务操作"模块
    fireEvent.click(screen.getByText('任务操作'))
    
    // 验证回调被调用
    expect(handleModuleChange).toHaveBeenCalledWith('task-operation')
  })

  /**
   * 测试：应该高亮当前选中的模块
   * 需求: 7.2
   */
  it('should highlight current selected module', () => {
    renderWithAuth(
      <MainLayout currentModule="timesheet-query">
        <div>Test Content</div>
      </MainLayout>
    )

    // 验证"工时查询"模块被选中
    const timesheetQueryItem = screen.getByText('工时查询').closest('li')
    expect(timesheetQueryItem).toHaveClass('ant-menu-item-selected')
  })

  /**
   * 测试：应该显示用户下拉菜单
   * 需求: 7.4
   */
  it('should display user dropdown menu', () => {
    renderWithAuth(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>
    )

    // 验证用户图标存在
    const userIcon = document.querySelector('.anticon-user')
    expect(userIcon).toBeInTheDocument()
  })
})
