/**
 * 服务模块导出
 */

export { GraphQLClient, graphqlClient } from './graphqlClient'
export type { IGraphQLClient } from '../types/graphql'

export { AuthService, authService } from './authService'
export type { IAuthService } from '../types/auth'

export { TaskService, taskService } from './taskService'
export type { ITaskService } from '../types/task'

export { TimesheetService, timesheetService } from './timesheetService'
export type { ITimesheetService } from '../types/timesheet'

export {
  ErrorHandler,
  NetworkErrorHandler,
  AuthErrorHandler,
  BusinessErrorHandler,
  SystemErrorHandler,
  errorHandler,
} from './errorHandler'
