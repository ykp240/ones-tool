# 设计文档：ONES 工时填报网页应用

## 概述

本文档描述了基于 ONES 系统 GraphQL API 的工时填报网页应用的技术设计。该应用是一个单页面应用（SPA），使用现代前端技术栈构建，通过 ONES GraphQL API 与后端系统集成。

应用的核心功能包括：
- 用户身份验证和会话管理
- 任务查询和状态管理
- 工时记录查询
- 手动和自动工时填报

设计遵循模块化原则，将应用分为认证模块、任务模块、工时模块和 UI 模块，确保代码的可维护性和可扩展性。

## 架构

### 系统架构

应用采用三层架构：

1. **表示层（Presentation Layer）**
   - 用户界面组件
   - 路由管理
   - 状态管理

2. **业务逻辑层（Business Logic Layer）**
   - 认证服务
   - 任务服务
   - 工时服务
   - 数据验证和转换

3. **数据访问层（Data Access Layer）**
   - GraphQL 客户端
   - API 请求封装
   - 错误处理

### 技术栈

- **前端框架**: React 18+ with TypeScript
- **状态管理**: React Context API + Hooks
- **HTTP 客户端**: Axios
- **GraphQL 客户端**: graphql-request
- **UI 组件库**: Ant Design
- **路由**: React Router v6
- **日期处理**: date-fns
- **构建工具**: Vite

### 部署架构

```
[浏览器] <--HTTPS--> [静态资源服务器] <--HTTPS--> [ONES API 服务器]
```

应用作为静态资源部署，所有 API 请求直接从浏览器发送到 ONES 服务器。

## 组件和接口

### 1. 认证模块（Authentication Module）

#### AuthService

负责用户身份验证和会话管理。

```typescript
interface AuthService {
  // 用户登录
  login(email: string, password: string): Promise<AuthResponse>
  
  // 用户登出
  logout(): void
  
  // 获取当前用户信息
  getCurrentUser(): User | null
  
  // 检查是否已登录
  isAuthenticated(): boolean
  
  // 获取认证令牌
  getAuthToken(): string | null
  
  // 获取用户 ID
  getUserId(): string | null
}

interface AuthResponse {
  user: User
  token: string
  userId: string
}

interface User {
  uuid: string
  name: string
  email: string
  avatar?: string
}
```

#### AuthContext

提供全局认证状态。

```typescript
interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
  error: string | null
}
```

### 2. 任务模块（Task Module）

#### TaskService

负责任务查询和状态管理。

```typescript
interface TaskService {
  // 查询任务列表
  getTasks(filter: TaskFilter): Promise<Task[]>
  
  // 更新任务状态
  updateTaskStatus(taskId: string, status: TaskStatus): Promise<void>
}

interface TaskFilter {
  statuses?: TaskStatus[]
  projectStatuses?: ProjectStatus[]
}

enum TaskStatus {
  TODO = 'to_do',
  IN_PROGRESS = 'in_progress',
  DONE = 'done'
}

enum ProjectStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress'
}

interface Task {
  uuid: string
  name: string
  status: TaskStatus
  project: {
    uuid: string
    name: string
    status: ProjectStatus
  }
  assign: User | null
  createTime: number
  updateTime: number
}
```

### 3. 工时模块（Timesheet Module）

#### TimesheetService

负责工时查询和填报。

```typescript
interface TimesheetService {
  // 查询工时记录
  getManhours(filter: ManhourFilter): Promise<Manhour[]>
  
  // 手动填报工时
  submitManhour(data: ManhourSubmission): Promise<void>
  
  // 批量填报工时（自动填报）
  batchSubmitManhours(data: BatchManhourSubmission): Promise<BatchSubmitResult>
  
  // 计算工作日
  getWorkDays(startDate: Date, endDate: Date): Date[]
}

interface ManhourFilter {
  startDate: Date
  endDate: Date
  userId?: string
}

interface Manhour {
  uuid: string
  task: Task
  user: User
  hours: number
  startTime: number
  type: string
  description?: string
}

interface ManhourSubmission {
  taskId: string
  date: Date
  hours: number
  description?: string
}

interface BatchManhourSubmission {
  totalHours: number
  tasks: TaskAllocation[]
  startDate: Date
  endDate: Date
  excludeWeekends: boolean
}

interface TaskAllocation {
  taskId: string
  ratio: number  // 分摊比例，默认均分
}

interface BatchSubmitResult {
  success: boolean
  submittedCount: number
  failedCount: number
  errors: string[]
}
```

### 4. GraphQL 客户端模块

#### GraphQLClient

封装 GraphQL API 调用。

```typescript
interface GraphQLClient {
  // 执行 GraphQL 查询
  query<T>(query: string, variables?: any): Promise<T>
  
  // 执行 GraphQL 变更
  mutate<T>(mutation: string, variables?: any): Promise<T>
  
  // 设置认证信息
  setAuth(userId: string, token: string): void
  
  // 清除认证信息
  clearAuth(): void
}
```

### 5. UI 组件

#### LoginPage

登录页面组件。

```typescript
interface LoginPageProps {}

interface LoginFormData {
  email: string
  password: string
}
```

#### MainLayout

主界面布局组件。

```typescript
interface MainLayoutProps {
  children: React.ReactNode
}
```

#### TaskQueryPanel

任务查询面板。

```typescript
interface TaskQueryPanelProps {}

interface TaskQueryState {
  tasks: Task[]
  selectedStatuses: TaskStatus[]
  loading: boolean
  error: string | null
}
```

#### TaskOperationPanel

任务操作面板。

```typescript
interface TaskOperationPanelProps {}
```

#### TimesheetQueryPanel

工时查询面板。

```typescript
interface TimesheetQueryPanelProps {}

interface TimesheetQueryState {
  manhours: Manhour[]
  startDate: Date
  endDate: Date
  loading: boolean
  error: string | null
}
```

#### TimesheetSubmitPanel

工时填报面板。

```typescript
interface TimesheetSubmitPanelProps {}

interface TimesheetSubmitState {
  mode: 'manual' | 'auto'
  selectedTasks: Task[]
  manualEntries: Map<string, Map<string, number>>  // taskId -> date -> hours
  autoConfig: {
    totalHours: number
    allocations: Map<string, number>  // taskId -> ratio
    startDate: Date
    endDate: Date
  }
}
```

## 数据模型

### 本地存储模型

应用使用 localStorage 存储以下数据：

```typescript
interface LocalStorage {
  // 认证信息
  auth: {
    userId: string
    token: string
    user: User
  } | null
  
  // 应用配置
  config: {
    apiBaseUrl: string
    teamId: string
  }
}
```

### GraphQL 查询示例

#### 查询任务列表

```graphql
query GetTasks($statusFilter: [String!], $projectStatusFilter: [String!]) {
  tasks(
    filter: {
      assign_in: [$currentUserId]
      status_in: $statusFilter
      project: {
        status_in: $projectStatusFilter
      }
    }
    orderBy: {
      createTime: DESC
    }
  ) {
    uuid
    name
    status
    project {
      uuid
      name
      status
    }
    assign {
      uuid
      name
      email
    }
    createTime
    updateTime
  }
}
```

#### 查询工时记录

```graphql
query GetManhours($startDate: Int!, $endDate: Int!, $userId: String!) {
  manhours(
    filter: {
      owner_equal: $userId
      startTime_range: {
        gte: $startDate
        lte: $endDate
      }
    }
    orderBy: {
      startTime: DESC
    }
  ) {
    uuid
    hours
    startTime
    type
    description
    task {
      uuid
      name
    }
    owner {
      uuid
      name
    }
  }
}
```

#### 创建工时记录

```graphql
mutation CreateManhour($taskId: String!, $hours: Int!, $startTime: Int!, $description: String) {
  addManhour(
    taskUUID: $taskId
    hours: $hours
    startTime: $startTime
    type: "recorded"
    description: $description
  ) {
    uuid
  }
}
```

## 正确性属性

*属性是一种特征或行为，应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的正式陈述。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*


### 属性 1: 有效登录成功

*对于任何*有效的 email 和 password 组合，登录操作应该成功并返回包含 User_ID 和 Auth_Token 的认证信息。

**验证需求: 1.1**

### 属性 2: 无效登录失败

*对于任何*无效的 email 或 password，登录操作应该失败并返回明确的错误提示信息。

**验证需求: 1.2**

### 属性 3: 登录后状态存储

*对于任何*成功的登录操作，系统应该在本地存储中保存 User_ID、Auth_Token 和用户信息，并在 UI 右上角显示用户姓名。

**验证需求: 1.3**

### 属性 4: 会话过期处理

*对于任何*会话过期或失效的情况，系统应该提示用户重新登录。

**验证需求: 1.5**

### 属性 5: API 请求认证头

*对于所有* API 请求（包括 GraphQL 查询和变更），请求头中都应该包含 Ones-User-Id 和 Ones-Auth-Token。

**验证需求: 1.6, 2.6, 3.5, 4.6, 5.6, 6.8**

### 属性 6: 任务查询过滤

*对于任何*任务状态筛选条件（单个或多个状态），返回的任务列表中的所有任务都应该匹配至少一个所选状态。

**验证需求: 2.2, 2.4**

### 属性 7: 任务状态更新

*对于任何*任务和任何有效的目标状态（未开始/进行中/已完成），状态更新操作应该成功，并且 UI 应该立即显示新状态。

**验证需求: 3.1, 3.2**

### 属性 8: 操作失败状态不变

*对于任何*失败的数据变更操作（任务状态更新、工时填报等），原有数据状态应该保持不变。

**验证需求: 3.3, 5.4**

### 属性 9: 日期范围工时查询

*对于任何*日期范围（起止日期），查询返回的所有工时记录的日期都应该在该范围内。

**验证需求: 4.1**

### 属性 10: 工时记录完整性

*对于任何*查询返回的工时记录，都应该包含任务名称、日期和工时数这些必需字段。

**验证需求: 4.2**

### 属性 11: 手动工时填报

*对于任何*有效的任务、日期和正数工时值，手动填报操作应该成功创建或更新工时记录。

**验证需求: 5.1**

### 属性 12: 工时数验证

*对于任何*非正数的工时值，系统应该拒绝填报并返回验证错误。

**验证需求: 5.2**

### 属性 13: 月视图日期完整性

*对于任何*选定的月份，手动填报界面应该显示该月的所有日期（1 日到月末）。

**验证需求: 5.5**

### 属性 14: 自动填报工时分配

*对于任何*任务分配配置（均分或自定义比例），自动填报应该按配置将总工时正确分配到各任务，且所有分配的工时之和应该等于总工时。

**验证需求: 6.1, 6.2, 6.3**

### 属性 15: 工作日过滤

*对于任何*日期范围，自动填报应该仅在工作日（周一到周五）填报工时，排除周末。

**验证需求: 6.4**

### 属性 16: 混合填报工时扣除

*对于任何*已手动填报部分工时的情况，自动填报应该计算剩余工时（总工时减去已填报工时），并仅分配剩余工时。

**验证需求: 6.5**

### 属性 17: 自动填报事务性

*对于任何*自动填报操作，如果过程中发生任何错误，系统应该回滚所有已提交的工时记录，确保数据一致性。

**验证需求: 6.7**

### 属性 18: 模块导航

*对于任何*模块切换操作（任务查询、任务操作、工时查询、工时填报），主体区域应该显示对应模块的内容。

**验证需求: 7.3**

### 属性 19: 用户信息显示

*对于任何*页面，右上角都应该显示当前登录用户的姓名。

**验证需求: 7.4**

### 属性 20: API 错误处理

*对于任何* API 错误响应，系统应该显示明确的错误提示信息，说明错误类型。

**验证需求: 8.1, 8.4**

### 属性 21: 会话过期状态保留

*对于任何*会话过期的情况，系统应该提示用户重新登录，同时保留当前页面的状态（如已填写的表单数据）。

**验证需求: 8.5**

### 属性 22: 登出数据清理

*对于任何*用户登出或会话过期的情况，系统应该清除本地存储中的所有敏感信息（User_ID、Auth_Token、用户信息）。

**验证需求: 9.5**

### 属性 23: GraphQL 端点格式

*对于所有* GraphQL API 请求，端点 URL 应该使用正确的格式：`/project/api/project/team/{Team_ID}/items/graphql`。

**验证需求: 10.8**

### 属性 24: GraphQL 请求格式

*对于所有* GraphQL 请求，请求体应该包含有效的 GraphQL 查询或变更语句。

**验证需求: 10.9**

### 属性 25: API 响应格式验证

*对于任何* API 响应，如果响应格式不符合预期的数据结构，系统应该检测并报告数据格式错误。

**验证需求: 10.7**

## 错误处理

### 错误分类

应用将错误分为以下几类：

1. **网络错误**
   - 连接失败
   - 请求超时
   - DNS 解析失败

2. **认证错误**
   - 登录失败（401）
   - 会话过期（401）
   - 权限不足（403）

3. **业务错误**
   - 数据验证失败（400）
   - 资源不存在（404）
   - 操作冲突（409）

4. **系统错误**
   - 服务器内部错误（500）
   - 服务不可用（503）
   - 未知错误

### 错误处理策略

#### 网络错误处理

```typescript
interface NetworkErrorHandler {
  // 处理网络错误
  handleNetworkError(error: NetworkError): void
  
  // 提供重试机制
  retry(request: () => Promise<any>, maxRetries: number): Promise<any>
}
```

- 显示网络错误提示
- 提供重试按钮
- 自动重试（最多 3 次，指数退避）

#### 认证错误处理

```typescript
interface AuthErrorHandler {
  // 处理认证错误
  handleAuthError(error: AuthError): void
  
  // 刷新令牌
  refreshToken(): Promise<void>
  
  // 重定向到登录页
  redirectToLogin(preserveState?: boolean): void
}
```

- 401 错误：清除本地认证信息，重定向到登录页
- 保留当前页面状态，登录后恢复
- 显示会话过期提示

#### 业务错误处理

```typescript
interface BusinessErrorHandler {
  // 处理业务错误
  handleBusinessError(error: BusinessError): void
  
  // 显示错误消息
  showErrorMessage(message: string): void
}
```

- 显示具体的错误消息
- 高亮显示错误字段（表单验证）
- 提供修正建议

#### 系统错误处理

```typescript
interface SystemErrorHandler {
  // 处理系统错误
  handleSystemError(error: SystemError): void
  
  // 记录错误日志
  logError(error: Error): void
  
  // 显示通用错误页面
  showErrorPage(): void
}
```

- 显示通用错误消息
- 记录错误详情到控制台
- 提供联系支持的方式

### 错误边界

使用 React Error Boundary 捕获组件渲染错误：

```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps> {
  // 捕获子组件错误
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void
  
  // 渲染错误 UI
  render(): React.ReactNode
}
```

## 测试策略

### 测试方法

应用采用双重测试方法：

1. **单元测试**：测试具体示例、边界情况和错误条件
2. **属性测试**：验证通用属性在所有输入下都成立

两种测试方法互补，共同确保全面覆盖。

### 单元测试

使用 Jest 和 React Testing Library 进行单元测试。

#### 测试范围

- **组件测试**：测试 UI 组件的渲染和交互
- **服务测试**：测试业务逻辑和 API 调用
- **工具函数测试**：测试纯函数和辅助函数

#### 测试示例

```typescript
// 登录组件测试
describe('LoginPage', () => {
  it('should render login form', () => {
    // 测试表单渲染
  })
  
  it('should show error message on invalid credentials', () => {
    // 测试错误提示
  })
  
  it('should disable autocomplete on password field', () => {
    // 测试 autocomplete 属性
  })
})

// 工时服务测试
describe('TimesheetService', () => {
  it('should calculate work days correctly', () => {
    // 测试工作日计算
  })
  
  it('should reject negative hours', () => {
    // 测试输入验证
  })
})
```

### 属性测试

使用 fast-check 进行属性测试。每个属性测试至少运行 100 次迭代。

#### 测试配置

```typescript
import fc from 'fast-check'

// 配置
const testConfig = {
  numRuns: 100,  // 最少 100 次迭代
  verbose: true
}
```

#### 属性测试示例

```typescript
// 属性 5: API 请求认证头
describe('Property 5: API Request Authentication Headers', () => {
  it('Feature: ones-timesheet-app, Property 5: For all API requests, headers should include Ones-User-Id and Ones-Auth-Token', () => {
    fc.assert(
      fc.property(
        fc.string(),  // 任意 API 端点
        fc.record({   // 任意请求参数
          query: fc.string(),
          variables: fc.anything()
        }),
        async (endpoint, params) => {
          // 设置认证信息
          const userId = 'test-user-id'
          const token = 'test-token'
          client.setAuth(userId, token)
          
          // 发起请求
          const request = await client.query(params.query, params.variables)
          
          // 验证请求头
          expect(request.headers['Ones-User-Id']).toBe(userId)
          expect(request.headers['Ones-Auth-Token']).toBe(token)
        }
      ),
      testConfig
    )
  })
})

// 属性 6: 任务查询过滤
describe('Property 6: Task Query Filtering', () => {
  it('Feature: ones-timesheet-app, Property 6: For any task status filter, all returned tasks should match at least one selected status', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom('to_do', 'in_progress', 'done'), { minLength: 1 }),  // 任意状态组合
        async (selectedStatuses) => {
          // 查询任务
          const tasks = await taskService.getTasks({ statuses: selectedStatuses })
          
          // 验证所有任务都匹配至少一个状态
          tasks.forEach(task => {
            expect(selectedStatuses).toContain(task.status)
          })
        }
      ),
      testConfig
    )
  })
})

// 属性 12: 工时数验证
describe('Property 12: Hours Validation', () => {
  it('Feature: ones-timesheet-app, Property 12: For any non-positive hours value, system should reject submission', () => {
    fc.assert(
      fc.property(
        fc.string(),  // 任意任务 ID
        fc.date(),    // 任意日期
        fc.integer({ max: 0 }),  // 非正数工时
        async (taskId, date, hours) => {
          // 尝试填报
          await expect(
            timesheetService.submitManhour({ taskId, date, hours })
          ).rejects.toThrow()  // 应该抛出验证错误
        }
      ),
      testConfig
    )
  })
})

// 属性 14: 自动填报工时分配
describe('Property 14: Auto-fill Hours Allocation', () => {
  it('Feature: ones-timesheet-app, Property 14: For any allocation config, distributed hours should sum to total hours', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),  // 任意总工时
        fc.array(
          fc.record({
            taskId: fc.string(),
            ratio: fc.float({ min: 0, max: 1 })
          }),
          { minLength: 1, maxLength: 10 }
        ),  // 任意任务分配
        fc.date(),  // 起始日期
        fc.date(),  // 结束日期
        async (totalHours, allocations, startDate, endDate) => {
          // 归一化比例
          const totalRatio = allocations.reduce((sum, a) => sum + a.ratio, 0)
          const normalizedAllocations = allocations.map(a => ({
            ...a,
            ratio: a.ratio / totalRatio
          }))
          
          // 执行自动填报
          const result = await timesheetService.batchSubmitManhours({
            totalHours,
            tasks: normalizedAllocations,
            startDate,
            endDate,
            excludeWeekends: true
          })
          
          // 查询填报的工时
          const manhours = await timesheetService.getManhours({
            startDate,
            endDate
          })
          
          // 验证总和
          const sum = manhours.reduce((total, m) => total + m.hours, 0)
          expect(sum).toBe(totalHours)
        }
      ),
      testConfig
    )
  })
})

// 属性 15: 工作日过滤
describe('Property 15: Work Days Filtering', () => {
  it('Feature: ones-timesheet-app, Property 15: For any date range, auto-fill should only submit on weekdays', () => {
    fc.assert(
      fc.property(
        fc.date(),  // 起始日期
        fc.date(),  // 结束日期
        async (startDate, endDate) => {
          // 确保日期顺序
          if (startDate > endDate) {
            [startDate, endDate] = [endDate, startDate]
          }
          
          // 执行自动填报
          await timesheetService.batchSubmitManhours({
            totalHours: 40,
            tasks: [{ taskId: 'test-task', ratio: 1 }],
            startDate,
            endDate,
            excludeWeekends: true
          })
          
          // 查询填报的工时
          const manhours = await timesheetService.getManhours({
            startDate,
            endDate
          })
          
          // 验证所有工时都在工作日
          manhours.forEach(m => {
            const date = new Date(m.startTime * 1000)
            const dayOfWeek = date.getDay()
            expect(dayOfWeek).toBeGreaterThanOrEqual(1)  // 周一
            expect(dayOfWeek).toBeLessThanOrEqual(5)     // 周五
          })
        }
      ),
      testConfig
    )
  })
})
```

### 集成测试

测试多个模块之间的交互：

- 登录流程端到端测试
- 任务查询和状态更新流程测试
- 工时填报完整流程测试

### 测试覆盖率目标

- 代码覆盖率：≥ 80%
- 分支覆盖率：≥ 75%
- 属性测试：所有 25 个属性都有对应的测试

### 持续集成

- 每次提交自动运行所有测试
- 测试失败阻止合并
- 生成测试报告和覆盖率报告
