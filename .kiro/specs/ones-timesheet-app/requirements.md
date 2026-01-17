# 需求文档

## 简介

本文档描述了基于 ONES 系统 API 的工时填报网页应用的需求。该应用旨在为用户提供一个简洁、高效的界面来查询任务、管理任务状态、查询工时记录以及填报工时。应用将通过 ONES API 与后端系统集成，支持手动和自动两种工时填报方式。

## 术语表

- **ONES_System**: ONES 项目管理系统，提供 GraphQL API 接口供外部应用调用
- **User**: 使用本应用的 ONES 系统用户
- **Task**: ONES 系统中的任务项
- **Timesheet**: 工时记录，记录用户在特定任务上花费的时间
- **Work_Day**: 工作日，排除周末和节假日的日期
- **Task_Status**: 任务状态，包括未开始、进行中、已完成三种状态
- **Auto_Fill**: 自动填报功能，按配置规则自动分配工时到多个任务和日期
- **Manual_Fill**: 手动填报功能，用户逐一为任务和日期填写工时
- **Authentication_Module**: 身份验证模块，处理用户登录和会话管理
- **Task_Module**: 任务模块，处理任务查询和状态更新
- **Timesheet_Module**: 工时模块，处理工时查询和填报
- **Auth_Token**: 认证令牌，通过登录接口获取，用于后续 API 请求的身份验证
- **User_ID**: 用户唯一标识符（UUID），通过登录接口获取
- **Team_ID**: 团队标识符，用于 GraphQL API 请求路径
- **GraphQL_Query**: GraphQL 查询语句，用于从 ONES API 获取数据

## 需求

### 需求 1: 用户身份验证

**用户故事:** 作为用户，我希望能够使用 ONES 账号和密码登录应用，以便安全地访问我的任务和工时数据。

#### 验收标准

1. WHEN 用户在登录界面输入有效的 email 和密码并提交 THEN THE Authentication_Module SHALL 调用 ONES 登录 API（POST /project/api/project/auth/login）并获取 User_ID 和 Auth_Token
2. WHEN 用户输入无效的 email 或密码 THEN THE Authentication_Module SHALL 返回明确的错误提示信息
3. WHEN 用户成功登录 THEN THE Authentication_Module SHALL 存储 User_ID 和 Auth_Token，跳转到主界面并在右上角显示用户姓名
4. WHEN 登录表单被浏览器渲染 THEN THE Authentication_Module SHALL 禁用浏览器的自动填充密码功能
5. WHEN 用户会话过期或失效 THEN THE Authentication_Module SHALL 提示用户重新登录
6. WHEN 后续 API 请求被发起 THEN THE Authentication_Module SHALL 在请求头中包含 Ones-User-Id 和 Ones-Auth-Token

### 需求 2: 任务查询

**用户故事:** 作为用户，我希望能够查看我在进行中和未开始项目中的所有任务，以便了解我的工作内容。

#### 验收标准

1. WHEN 用户访问任务查询模块 THEN THE Task_Module SHALL 通过 ONES GraphQL API 查询并显示登录用户在进行中或未开始项目中的所有任务
2. WHEN 用户选择任务状态筛选条件（未开始/进行中/已完成） THEN THE Task_Module SHALL 仅显示符合所选状态的任务
3. WHEN 用户首次进入任务查询模块 THEN THE Task_Module SHALL 默认显示状态为"进行中"的任务
4. WHEN 用户同时选择多个状态筛选条件 THEN THE Task_Module SHALL 显示满足任意所选状态的任务
5. WHEN 任务列表为空 THEN THE Task_Module SHALL 显示友好的提示信息
6. WHEN 发起 GraphQL 查询 THEN THE Task_Module SHALL 在请求头中包含 Ones-User-Id 和 Ones-Auth-Token

### 需求 3: 任务状态管理

**用户故事:** 作为用户，我希望能够更改任务状态，以便反映任务的实际进展情况。

#### 验收标准

1. WHEN 用户选择一个任务并更改其状态为未开始、进行中或已完成 THEN THE Task_Module SHALL 通过 ONES GraphQL API 更新该任务的状态
2. WHEN 任务状态更新成功 THEN THE Task_Module SHALL 在界面上立即反映新的状态
3. WHEN 任务状态更新失败 THEN THE Task_Module SHALL 显示错误信息并保持原有状态
4. WHEN 用户尝试更新任务状态但网络连接失败 THEN THE Task_Module SHALL 显示网络错误提示并允许用户重试
5. WHEN 发起状态更新请求 THEN THE Task_Module SHALL 在请求头中包含 Ones-User-Id 和 Ones-Auth-Token

### 需求 4: 工时查询

**用户故事:** 作为用户，我希望能够按日期范围查询已填报的工时记录，以便了解我的工作时间分配情况。

#### 验收标准

1. WHEN 用户在工时查询模块中选择起止日期 THEN THE Timesheet_Module SHALL 通过 ONES GraphQL API 获取并显示该日期范围内的所有工时记录
2. WHEN 用户查询工时记录 THEN THE Timesheet_Module SHALL 显示每条记录的任务名称、日期和工时数
3. WHEN 用户选择日期范围筛选 THEN THE Timesheet_Module SHALL 同时显示该日期范围内登录用户的任务及对应已填报的工时
4. WHEN 查询的日期范围内没有工时记录 THEN THE Timesheet_Module SHALL 显示友好的提示信息
5. WHEN 工时查询请求失败 THEN THE Timesheet_Module SHALL 显示错误信息并允许用户重试
6. WHEN 发起工时查询 THEN THE Timesheet_Module SHALL 在请求头中包含 Ones-User-Id 和 Ones-Auth-Token

### 需求 5: 手动工时填报

**用户故事:** 作为用户，我希望能够手动为每个任务的每一天填报工时，以便精确记录我的工作时间。

#### 验收标准

1. WHEN 用户在手动填报模式下选择一个任务和日期并输入工时数 THEN THE Timesheet_Module SHALL 通过 ONES GraphQL API 创建或更新该工时记录
2. WHEN 用户为某个任务的某一天填报工时 THEN THE Timesheet_Module SHALL 验证工时数为正数
3. WHEN 工时填报成功 THEN THE Timesheet_Module SHALL 在界面上立即显示更新后的工时记录
4. WHEN 工时填报失败 THEN THE Timesheet_Module SHALL 显示错误信息并保持原有数据
5. WHEN 用户手动填报工时 THEN THE Timesheet_Module SHALL 支持按月显示所有日期供用户逐一填报
6. WHEN 发起工时填报请求 THEN THE Timesheet_Module SHALL 在请求头中包含 Ones-User-Id 和 Ones-Auth-Token

### 需求 6: 自动工时填报

**用户故事:** 作为用户，我希望能够自动将工时按配置规则分配到多个任务和工作日，以便快速完成工时填报。

#### 验收标准

1. WHEN 用户在自动填报模式下输入总工时数、选择任务列表和日期范围 THEN THE Timesheet_Module SHALL 按配置的分摊规则自动计算并通过 ONES GraphQL API 批量填报工时
2. WHEN 用户未指定任务分摊比例 THEN THE Timesheet_Module SHALL 默认将工时在所选任务间均匀分摊
3. WHEN 用户指定了任务分摊比例 THEN THE Timesheet_Module SHALL 按指定比例分配工时到各任务
4. WHEN 自动填报工时时 THEN THE Timesheet_Module SHALL 仅在工作日填报工时，排除周末
5. WHEN 用户已手动填报部分任务的工时 THEN THE Timesheet_Module SHALL 在自动填报时扣除已填报的工时，仅分配剩余工时
6. WHEN 自动填报完成 THEN THE Timesheet_Module SHALL 显示填报结果摘要供用户确认
7. WHEN 自动填报过程中发生错误 THEN THE Timesheet_Module SHALL 回滚所有更改并显示错误信息
8. WHEN 发起批量工时填报 THEN THE Timesheet_Module SHALL 在请求头中包含 Ones-User-Id 和 Ones-Auth-Token

### 需求 7: 用户界面布局

**用户故事:** 作为用户，我希望应用界面简洁清晰，以便快速找到所需功能并高效完成操作。

#### 验收标准

1. WHEN 用户成功登录 THEN THE System SHALL 显示主界面，包含顶部模块切换区域和主体内容区域
2. WHEN 用户查看主界面 THEN THE System SHALL 在顶部显示任务查询、任务操作、工时查询、工时填报四个模块切换选项
3. WHEN 用户点击模块切换选项 THEN THE System SHALL 在主体区域显示对应模块的内容
4. WHEN 用户查看任何页面 THEN THE System SHALL 在右上角显示当前登录用户的姓名
5. WHEN 用户与界面交互 THEN THE System SHALL 提供清晰的视觉反馈和操作提示

### 需求 8: 错误处理和恢复

**用户故事:** 作为用户，我希望在发生网络或连接错误时能够收到明确的提示，以便了解问题并采取相应措施。

#### 验收标准

1. WHEN 应用与 ONES GraphQL API 通信失败 THEN THE System SHALL 显示明确的错误提示信息，说明错误类型
2. WHEN 网络连接中断 THEN THE System SHALL 显示网络错误提示并提供重试选项
3. WHEN API 请求超时 THEN THE System SHALL 显示超时提示并允许用户重新发起请求
4. WHEN 发生未预期的错误 THEN THE System SHALL 显示通用错误信息并记录错误详情供调试
5. WHEN 用户会话过期（Auth_Token 失效） THEN THE System SHALL 提示用户重新登录而不丢失当前页面状态
6. WHEN API 返回 401 未授权错误 THEN THE System SHALL 清除本地认证信息并引导用户重新登录

### 需求 9: 数据安全

**用户故事:** 作为用户，我希望我的账号密码信息得到安全保护，以便防止未授权访问。

#### 验收标准

1. WHEN 登录表单被渲染 THEN THE Authentication_Module SHALL 设置 autocomplete="off" 属性以禁用浏览器自动填充
2. WHEN 用户输入密码 THEN THE Authentication_Module SHALL 使用密码输入框类型隐藏输入内容
3. WHEN 用户凭据被传输到 ONES API THEN THE Authentication_Module SHALL 使用 HTTPS 协议加密传输
4. WHEN 用户会话被创建 THEN THE Authentication_Module SHALL 使用安全的会话令牌机制
5. WHEN 用户退出登录或会话过期 THEN THE Authentication_Module SHALL 清除所有本地存储的敏感信息

### 需求 10: ONES GraphQL API 集成

**用户故事:** 作为系统，我需要与 ONES GraphQL API 正确集成，以便获取和更新任务及工时数据。

#### 验收标准

1. THE System SHALL 使用 ONES REST API（POST /project/api/project/auth/login）进行用户身份验证
2. THE System SHALL 使用 ONES GraphQL API 查询用户的任务列表
3. THE System SHALL 使用 ONES GraphQL API 更新任务状态
4. THE System SHALL 使用 ONES GraphQL API 查询工时记录
5. THE System SHALL 使用 ONES GraphQL API 创建和更新工时记录
6. WHEN 调用 ONES API THEN THE System SHALL 正确处理 API 返回的错误代码和错误信息
7. WHEN API 响应格式发生变化 THEN THE System SHALL 能够检测并报告数据格式错误
8. WHEN 调用 GraphQL API THEN THE System SHALL 使用正确的端点格式（/project/api/project/team/{Team_ID}/items/graphql）
9. WHEN 构造 GraphQL 请求 THEN THE System SHALL 在请求体中包含有效的 GraphQL 查询或变更语句
