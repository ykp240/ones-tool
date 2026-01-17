import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LoginPage, MainPage } from './pages'
import { ErrorBoundary } from './components'

/**
 * 受保护的路由组件
 * 需要用户登录才能访问
 * 
 * 需求: 7.3 - 实现受保护路由，确保只有登录用户才能访问应用功能
 */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

/**
 * 公共路由组件
 * 已登录用户访问时重定向到主页
 */
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth()
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }
  
  return <>{children}</>
}

/**
 * 应用路由配置
 * 
 * 路由结构：
 * - /login: 登录页面（公共路由）
 * - /: 主页面，默认重定向到任务查询
 * - /tasks/query: 任务查询模块
 * - /tasks/operation: 任务操作模块
 * - /timesheet/query: 工时查询模块
 * - /timesheet/submit: 工时填报模块
 * 
 * 需求: 7.3 - 实现模块切换逻辑，通过路由管理不同模块的显示
 */
const AppRoutes = () => {
  return (
    <Routes>
      {/* 登录页面 - 公共路由 */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      
      {/* 主页面 - 受保护路由 */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainPage />
          </ProtectedRoute>
        }
      >
        {/* 任务查询模块 */}
        <Route path="tasks/query" element={null} />
        
        {/* 任务操作模块 */}
        <Route path="tasks/operation" element={null} />
        
        {/* 工时查询模块 */}
        <Route path="timesheet/query" element={null} />
        
        {/* 工时填报模块 */}
        <Route path="timesheet/submit" element={null} />
        
        {/* 默认重定向到任务查询 */}
        <Route index element={<Navigate to="/tasks/query" replace />} />
      </Route>
      
      {/* 未匹配的路由重定向到主页 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

/**
 * 应用根组件
 * 
 * 需求: 8.4 - 使用 Error Boundary 捕获组件渲染错误
 */
function App() {
  return (
    <ErrorBoundary
      showErrorDetails={import.meta.env.DEV}
      onError={(error, errorInfo) => {
        // 在生产环境中，可以将错误发送到错误追踪服务
        console.error('Application Error:', error, errorInfo)
      }}
    >
      <ConfigProvider locale={zhCN}>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ConfigProvider>
    </ErrorBoundary>
  )
}

export default App
