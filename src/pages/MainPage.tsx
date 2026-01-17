import { useNavigate, useLocation } from 'react-router-dom'
import { MainLayout, TaskQueryPanel, TaskOperationPanel, TimesheetQueryPanel, TimesheetSubmitPanel } from '../components'
import type { ModuleType } from '../components'

/**
 * 路由路径到模块类型的映射
 */
const pathToModule: Record<string, ModuleType> = {
  '/tasks/query': 'task-query',
  '/tasks/operation': 'task-operation',
  '/timesheet/query': 'timesheet-query',
  '/timesheet/submit': 'timesheet-submit',
}

/**
 * 模块类型到路由路径的映射
 */
const moduleToPath: Record<ModuleType, string> = {
  'task-query': '/tasks/query',
  'task-operation': '/tasks/operation',
  'timesheet-query': '/timesheet/query',
  'timesheet-submit': '/timesheet/submit',
}

/**
 * 主页面组件
 * 
 * 使用 MainLayout 组件提供统一的布局
 * 根据选中的模块显示不同的内容
 * 使用 React Router 进行模块切换
 * 
 * 需求: 7.1, 7.2, 7.3, 7.4
 */
export const MainPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  
  // 根据当前路径确定当前模块
  const currentModule = pathToModule[location.pathname] || 'task-query'

  /**
   * 处理模块切换
   * 需求: 7.3 - 实现模块切换逻辑
   */
  const handleModuleChange = (module: ModuleType) => {
    const path = moduleToPath[module]
    navigate(path)
  }

  /**
   * 根据当前模块渲染内容
   * 需求: 7.3 - 在主体区域显示对应模块的内容
   */
  const renderModuleContent = () => {
    switch (currentModule) {
      case 'task-query':
        return <TaskQueryPanel />
      case 'task-operation':
        return <TaskOperationPanel />
      case 'timesheet-query':
        return <TimesheetQueryPanel />
      case 'timesheet-submit':
        return <TimesheetSubmitPanel />
      default:
        return null
    }
  }

  return (
    <MainLayout currentModule={currentModule} onModuleChange={handleModuleChange}>
      {renderModuleContent()}
    </MainLayout>
  )
}
