/**
 * 任务服务实现
 * 
 * 负责任务查询和状态管理
 * 
 * 实现需求:
 * - 2.1: 通过 ONES GraphQL API 查询任务
 * - 2.2: 支持任务状态筛选
 * - 2.4: 支持多个状态筛选条件
 * - 3.1: 通过 ONES GraphQL API 更新任务状态
 */

import { graphqlClient } from './graphqlClient'
import { authService } from './authService'
import { errorHandler } from './errorHandler'
import { BusinessError, NetworkError } from '../types/error'
import type {
  ITaskService,
  Task,
  TaskFilter,
  TaskStatus,
  GetTasksResponse,
  UpdateTaskStatusResponse,
} from '../types/task'

/**
 * 任务服务类
 */
export class TaskService implements ITaskService {
  /**
   * 查询任务列表
   * 
   * 需求 2.1: 通过 ONES GraphQL API 查询并显示登录用户在进行中或未开始项目中的所有任务
   * 需求 2.2: 仅显示符合所选状态的任务
   * 需求 2.4: 显示满足任意所选状态的任务
   * 
   * @param filter 过滤条件
   * @returns 任务列表
   * @throws {AppError} 当查询失败时
   */
  async getTasks(filter: TaskFilter = {}): Promise<Task[]> {
    try {
      // 获取当前用户 ID
      const userId = authService.getUserId()
      if (!userId) {
        throw new BusinessError('用户未登录')
      }

      // 构造 GraphQL 查询
      // 需求 2.1: 查询登录用户的任务
      const query = `
        query GetTasks($userId: String!, $statusFilter: [String!], $projectStatusFilter: [String!]) {
          tasks(
            filter: {
              assign_in: [$userId]
              ${filter.statuses && filter.statuses.length > 0 ? 'status_in: $statusFilter' : ''}
              ${filter.projectStatuses && filter.projectStatuses.length > 0 ? `
              project: {
                status_in: $projectStatusFilter
              }
              ` : ''}
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
              avatar
            }
            createTime
            updateTime
          }
        }
      `

      // 构造查询变量
      const variables: Record<string, any> = {
        userId,
      }

      // 需求 2.2, 2.4: 支持状态筛选
      if (filter.statuses && filter.statuses.length > 0) {
        variables.statusFilter = filter.statuses
      }

      if (filter.projectStatuses && filter.projectStatuses.length > 0) {
        variables.projectStatusFilter = filter.projectStatuses
      }

      // 执行查询
      const response = await graphqlClient.query<GetTasksResponse>(query, variables)

      // 转换响应数据
      const tasks: Task[] = response.tasks.map(task => ({
        uuid: task.uuid,
        name: task.name,
        status: task.status as TaskStatus,
        project: {
          uuid: task.project.uuid,
          name: task.project.name,
          status: task.project.status as any,
        },
        assign: task.assign ? {
          uuid: task.assign.uuid,
          name: task.assign.name,
          email: task.assign.email,
          avatar: task.assign.avatar,
        } : null,
        createTime: task.createTime,
        updateTime: task.updateTime,
      }))

      return tasks
    } catch (error) {
      // 需求 8.1, 8.2, 8.4: 统一错误处理
      // 如果已经是应用错误，直接使用错误处理器
      if (error instanceof BusinessError || error instanceof NetworkError) {
        errorHandler.handle(error, {
          showNotification: true,
          logToConsole: true,
        })
        throw error
      }
      
      // 转换为业务错误
      const businessError = new BusinessError(
        error instanceof Error ? `查询任务失败: ${error.message}` : '查询任务失败，请稍后重试'
      )
      
      errorHandler.handle(businessError, {
        showNotification: true,
        logToConsole: true,
      })
      
      throw businessError
    }
  }

  /**
   * 更新任务状态
   * 
   * 需求 3.1: 通过 ONES GraphQL API 更新该任务的状态
   * 
   * @param taskId 任务 ID
   * @param status 新状态
   * @throws {AppError} 当更新失败时
   */
  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
    try {
      // 验证参数
      if (!taskId) {
        throw new BusinessError('任务 ID 不能为空')
      }

      if (!status) {
        throw new BusinessError('任务状态不能为空')
      }

      // 构造 GraphQL 变更
      // 需求 3.1: 更新任务状态
      const mutation = `
        mutation UpdateTaskStatus($taskId: String!, $status: String!) {
          updateTask(
            uuid: $taskId
            status: $status
          ) {
            uuid
            status
          }
        }
      `

      // 构造变更变量
      const variables = {
        taskId,
        status,
      }

      // 执行变更
      await graphqlClient.mutate<UpdateTaskStatusResponse>(mutation, variables)
    } catch (error) {
      // 需求 8.1, 8.2, 8.4: 统一错误处理
      // 如果已经是应用错误，直接使用错误处理器
      if (error instanceof BusinessError || error instanceof NetworkError) {
        errorHandler.handle(error, {
          showNotification: true,
          logToConsole: true,
        })
        throw error
      }
      
      // 转换为业务错误
      const businessError = new BusinessError(
        error instanceof Error ? `更新任务状态失败: ${error.message}` : '更新任务状态失败，请稍后重试'
      )
      
      errorHandler.handle(businessError, {
        showNotification: true,
        logToConsole: true,
      })
      
      throw businessError
    }
  }
}

// 导出单例实例
export const taskService = new TaskService()
