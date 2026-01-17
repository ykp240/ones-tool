/**
 * 类型定义导出
 */

export type {
  IGraphQLClient,
  GraphQLError,
  GraphQLResponse,
} from './graphql'

export type {
  User,
  AuthResponse,
  LoginRequest,
  OnesLoginResponse,
  IAuthService,
  StoredAuthInfo,
} from './auth'

export type {
  Task,
  Project,
  TaskFilter,
  ITaskService,
  GetTasksResponse,
  UpdateTaskStatusResponse,
} from './task'

export { TaskStatus, ProjectStatus } from './task'

export type {
  Manhour,
  ManhourFilter,
  ManhourSubmission,
  TaskAllocation,
  BatchManhourSubmission,
  BatchSubmitResult,
  ITimesheetService,
  GetManhoursResponse,
  CreateManhourResponse,
} from './timesheet'

export {
  ErrorCategory,
  AppError,
  NetworkError,
  AuthError,
  BusinessError,
  SystemError,
} from './error'

export type {
  ErrorHandlerOptions,
  RetryConfig,
} from './error'
