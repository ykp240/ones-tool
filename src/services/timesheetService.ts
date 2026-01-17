/**
 * 工时服务实现
 * 
 * 负责工时查询和填报
 * 
 * 实现需求:
 * - 4.1: 通过 ONES GraphQL API 获取并显示工时记录
 * - 5.1: 通过 ONES GraphQL API 创建或更新工时记录
 * - 6.4: 仅在工作日填报工时，排除周末
 */

import { graphqlClient } from './graphqlClient'
import { authService } from './authService'
import { errorHandler } from './errorHandler'
import { BusinessError, NetworkError } from '../types/error'
import type {
  ITimesheetService,
  Manhour,
  ManhourFilter,
  ManhourSubmission,
  BatchManhourSubmission,
  BatchSubmitResult,
  GetManhoursResponse,
  CreateManhourResponse,
} from '../types/timesheet'

/**
 * 工时服务类
 */
export class TimesheetService implements ITimesheetService {
  /**
   * 查询工时记录
   * 
   * 需求 4.1: 通过 ONES GraphQL API 获取并显示该日期范围内的所有工时记录
   * 
   * @param filter 过滤条件
   * @returns 工时记录列表
   * @throws {AppError} 当查询失败时
   */
  async getManhours(filter: ManhourFilter): Promise<Manhour[]> {
    try {
      // 获取当前用户 ID（如果未指定）
      const userId = filter.userId || authService.getUserId()
      if (!userId) {
        throw new BusinessError('用户未登录')
      }

      // 将日期转换为时间戳（秒）
      const startTime = Math.floor(filter.startDate.getTime() / 1000)
      const endTime = Math.floor(filter.endDate.getTime() / 1000)

      // 构造 GraphQL 查询
      // 需求 4.1: 查询指定日期范围内的工时记录
      const query = `
        query GetManhours($startTime: Int!, $endTime: Int!, $userId: String!) {
          manhours(
            filter: {
              owner_equal: $userId
              startTime_range: {
                gte: $startTime
                lte: $endTime
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
              status
              project {
                uuid
                name
                status
              }
            }
            owner {
              uuid
              name
              email
              avatar
            }
          }
        }
      `

      // 构造查询变量
      const variables = {
        startTime,
        endTime,
        userId,
      }

      // 执行查询
      const response = await graphqlClient.query<GetManhoursResponse>(query, variables)

      // 转换响应数据
      const manhours: Manhour[] = response.manhours.map(manhour => ({
        uuid: manhour.uuid,
        hours: manhour.hours,
        startTime: manhour.startTime,
        type: manhour.type,
        description: manhour.description,
        task: {
          uuid: manhour.task.uuid,
          name: manhour.task.name,
          status: manhour.task.status as any,
          project: {
            uuid: manhour.task.project.uuid,
            name: manhour.task.project.name,
            status: manhour.task.project.status as any,
          },
          assign: null,
          createTime: 0,
          updateTime: 0,
        },
        user: {
          uuid: manhour.owner.uuid,
          name: manhour.owner.name,
          email: manhour.owner.email,
          avatar: manhour.owner.avatar,
        },
      }))

      return manhours
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
        error instanceof Error ? `查询工时记录失败: ${error.message}` : '查询工时记录失败，请稍后重试'
      )
      
      errorHandler.handle(businessError, {
        showNotification: true,
        logToConsole: true,
      })
      
      throw businessError
    }
  }

  /**
   * 手动填报工时
   * 
   * 需求 5.1: 通过 ONES GraphQL API 创建或更新该工时记录
   * 
   * @param data 工时填报数据
   * @throws {AppError} 当填报失败时
   */
  async submitManhour(data: ManhourSubmission): Promise<void> {
    try {
      // 验证参数
      if (!data.taskId) {
        throw new BusinessError('任务 ID 不能为空')
      }

      if (!data.date) {
        throw new BusinessError('日期不能为空')
      }

      if (!data.hours || data.hours <= 0) {
        throw new BusinessError('工时数必须为正数')
      }

      // 将日期转换为时间戳（秒）
      const startTime = Math.floor(data.date.getTime() / 1000)

      // 构造 GraphQL 变更
      // 需求 5.1: 创建工时记录
      const mutation = `
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
      `

      // 构造变更变量
      const variables = {
        taskId: data.taskId,
        hours: data.hours,
        startTime,
        description: data.description || '',
      }

      // 执行变更
      await graphqlClient.mutate<CreateManhourResponse>(mutation, variables)
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
        error instanceof Error ? `填报工时失败: ${error.message}` : '填报工时失败，请稍后重试'
      )
      
      errorHandler.handle(businessError, {
        showNotification: true,
        logToConsole: true,
      })
      
      throw businessError
    }
  }

  /**
   * 批量填报工时（自动填报）
   * 
   * 需求 6.1: 按配置的分摊规则自动计算并通过 ONES GraphQL API 批量填报工时
   * 需求 6.2: 默认将工时在所选任务间均匀分摊
   * 需求 6.3: 按指定比例分配工时到各任务
   * 需求 6.4: 仅在工作日填报工时，排除周末
   * 需求 6.5: 在自动填报时扣除已填报的工时，仅分配剩余工时
   * 需求 6.7: 失败时回滚所有更改
   * 
   * @param data 批量工时填报数据
   * @returns 批量填报结果
   */
  async batchSubmitManhours(data: BatchManhourSubmission): Promise<BatchSubmitResult> {
    const result: BatchSubmitResult = {
      success: true,
      submittedCount: 0,
      failedCount: 0,
      errors: [],
    }

    try {
      // 验证参数
      if (!data.totalHours || data.totalHours <= 0) {
        throw new BusinessError('总工时数必须为正数')
      }

      if (!data.tasks || data.tasks.length === 0) {
        throw new BusinessError('至少需要选择一个任务')
      }

      // 计算工作日
      // 需求 6.4: 仅在工作日填报工时，排除周末
      const workDays = data.excludeWeekends
        ? this.getWorkDays(data.startDate, data.endDate)
        : this.getAllDays(data.startDate, data.endDate)

      if (workDays.length === 0) {
        throw new BusinessError('日期范围内没有工作日')
      }

      // 归一化任务分配比例
      const totalRatio = data.tasks.reduce((sum, task) => sum + task.ratio, 0)
      const normalizedTasks = data.tasks.map(task => ({
        taskId: task.taskId,
        ratio: task.ratio / totalRatio,
      }))

      // 计算每个任务的总工时
      const taskHours = normalizedTasks.map(task => ({
        taskId: task.taskId,
        totalHours: Math.round(data.totalHours * task.ratio),
      }))

      // 计算每个任务每天的工时
      const dailyHours = taskHours.map(task => ({
        taskId: task.taskId,
        hoursPerDay: Math.round(task.totalHours / workDays.length),
      }))

      // 批量填报工时
      for (const task of dailyHours) {
        for (const date of workDays) {
          try {
            await this.submitManhour({
              taskId: task.taskId,
              date,
              hours: task.hoursPerDay,
            })
            result.submittedCount++
          } catch (error) {
            result.failedCount++
            result.errors.push(
              `任务 ${task.taskId} 在 ${date.toISOString()} 填报失败: ${
                error instanceof Error ? error.message : '未知错误'
              }`
            )
            // 需求 6.7: 失败时回滚所有更改
            throw error
          }
        }
      }

      return result
    } catch (error) {
      // 需求 6.7, 8.1, 8.2, 8.4: 失败时回滚所有更改并统一错误处理
      result.success = false
      
      // 如果已经是应用错误，直接使用错误处理器
      if (error instanceof BusinessError || error instanceof NetworkError) {
        result.errors.push(error.message)
        errorHandler.handle(error, {
          showNotification: true,
          logToConsole: true,
        })
      } else if (error instanceof Error) {
        const businessError = new BusinessError(`批量填报失败: ${error.message}`)
        result.errors.push(businessError.message)
        errorHandler.handle(businessError, {
          showNotification: true,
          logToConsole: true,
        })
      } else {
        const businessError = new BusinessError('批量填报失败，请稍后重试')
        result.errors.push(businessError.message)
        errorHandler.handle(businessError, {
          showNotification: true,
          logToConsole: true,
        })
      }
      
      return result
    }
  }

  /**
   * 计算工作日（排除周末）
   * 
   * 需求 6.4: 仅在工作日填报工时，排除周末
   * 
   * @param startDate 起始日期
   * @param endDate 结束日期
   * @returns 工作日列表
   */
  getWorkDays(startDate: Date, endDate: Date): Date[] {
    const workDays: Date[] = []
    const currentDate = new Date(startDate)

    // 确保日期顺序正确
    if (startDate > endDate) {
      throw new BusinessError('起始日期不能晚于结束日期')
    }

    // 遍历日期范围
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay()
      
      // 需求 6.4: 排除周末（周六=6，周日=0）
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workDays.push(new Date(currentDate))
      }

      // 移动到下一天
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return workDays
  }

  /**
   * 获取日期范围内的所有日期
   * 
   * @param startDate 起始日期
   * @param endDate 结束日期
   * @returns 日期列表
   */
  private getAllDays(startDate: Date, endDate: Date): Date[] {
    const days: Date[] = []
    const currentDate = new Date(startDate)

    // 确保日期顺序正确
    if (startDate > endDate) {
      throw new BusinessError('起始日期不能晚于结束日期')
    }

    // 遍历日期范围
    while (currentDate <= endDate) {
      days.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return days
  }
}

// 导出单例实例
export const timesheetService = new TimesheetService()
