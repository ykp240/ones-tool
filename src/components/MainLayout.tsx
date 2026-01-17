import { useState } from 'react'
import { Layout, Menu, Typography, Dropdown, Space } from 'antd'
import { UserOutlined, LogoutOutlined, DownOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { useAuth } from '../contexts/AuthContext'

const { Header, Content } = Layout
const { Title } = Typography

/**
 * 模块类型
 */
export type ModuleType = 'task-query' | 'task-operation' | 'timesheet-query' | 'timesheet-submit'

/**
 * 主布局组件属性
 */
export interface MainLayoutProps {
  children: React.ReactNode
  currentModule?: ModuleType
  onModuleChange?: (module: ModuleType) => void
}

/**
 * 主布局组件
 * 
 * 功能：
 * - 使用 Ant Design Layout 组件
 * - 实现顶部导航栏，包含模块切换选项
 * - 在右上角显示用户姓名
 * - 实现主体内容区域
 * 
 * 需求: 7.1, 7.2, 7.4
 */
export const MainLayout = ({ children, currentModule = 'task-query', onModuleChange }: MainLayoutProps) => {
  const { user, logout } = useAuth()
  const [selectedModule, setSelectedModule] = useState<ModuleType>(currentModule)

  /**
   * 模块菜单项
   */
  const moduleMenuItems: MenuProps['items'] = [
    {
      key: 'task-query',
      label: '任务查询',
    },
    {
      key: 'task-operation',
      label: '任务操作',
    },
    {
      key: 'timesheet-query',
      label: '工时查询',
    },
    {
      key: 'timesheet-submit',
      label: '工时填报',
    },
  ]

  /**
   * 用户下拉菜单项
   */
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      onClick: logout,
    },
  ]

  /**
   * 处理模块切换
   */
  const handleModuleClick: MenuProps['onClick'] = ({ key }) => {
    const module = key as ModuleType
    setSelectedModule(module)
    onModuleChange?.(module)
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 顶部导航栏 */}
      <Header
        style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* 左侧：系统标题和模块切换 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
            ONES 工时填报系统
          </Title>
          
          {/* 模块切换菜单 */}
          <Menu
            mode="horizontal"
            selectedKeys={[selectedModule]}
            items={moduleMenuItems}
            onClick={handleModuleClick}
            style={{ 
              border: 'none',
              flex: 1,
              minWidth: 400,
            }}
          />
        </div>

        {/* 右侧：用户信息 */}
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Space style={{ cursor: 'pointer' }}>
            <UserOutlined />
            <span>{user?.name || '用户'}</span>
            <DownOutlined />
          </Space>
        </Dropdown>
      </Header>

      {/* 主体内容区域 */}
      <Content
        style={{
          padding: '24px',
          background: '#f0f2f5',
        }}
      >
        <div
          style={{
            background: '#fff',
            padding: '24px',
            minHeight: 'calc(100vh - 64px - 48px)',
            borderRadius: '8px',
          }}
        >
          {children}
        </div>
      </Content>
    </Layout>
  )
}
