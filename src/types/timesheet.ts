/**
 * 工时模块类型定义
 */

import type { Task } from './task'
import type { User } from './auth'

/**
 * 工时记录
 */
export interface Manhour {
  uuid: string
  task: Task
  user: User
  hours: number
  startTime: number
  type: string
  description?: string
}

/**
 * 工时查询过滤条件
 */
export interface ManhourFilter {
  startDate: Date
  endDate: Date
  userId?: string
}

/**
 * 工时填报数据
 */
export interface ManhourSubmission {
  taskId: string
  date: Date
  hours: number
  description?: string
}

/**
 * 任务分配配置
 */
export interface TaskAllocation {
  taskId: string
  ratio: number  // 分摊比例，默认均分
}

/**
 * 批量工时填报数据
 */
export interface BatchManhourSubmission {
  totalHours: number
  tasks: TaskAllocation[]
  startDate: Date
  endDate: Date
  excludeWeekends: boolean
}

/**
 * 批量填报结果
 */
export interface BatchSubmitResult {
  success: boolean
  submittedCount: number
  failedCount: number
  errors: string[]
}

/**
 * 工时服务接口
 */
export interface ITimesheetService {
  /**
   * 查询工时记录
   * @param filter 过滤条件
   * @returns 工时记录列表
   */
  getManhours(filter: ManhourFilter): Promise<Manhour[]>

  /**
   * 手动填报工时
   * @param data 工时填报数据
   */
  submitManhour(data: ManhourSubmission): Promise<void>

  /**
   * 批量填报工时（自动填报）
   * @param data 批量工时填报数据
   * @returns 批量填报结果
   */
  batchSubmitManhours(data: BatchManhourSubmission): Promise<BatchSubmitResult>

  /**
   * 计算工作日
   * @param startDate 起始日期
   * @param endDate 结束日期
   * @returns 工作日列表
   */
  getWorkDays(startDate: Date, endDate: Date): Date[]
}

/**
 * GraphQL 查询工时记录响应
 */
export interface GetManhoursResponse {
  manhours: Array<{
    uuid: string
    hours: number
    startTime: number
    type: string
    description?: string
    task: {
      uuid: string
      name: string
      status: string
      project: {
        uuid: string
        name: string
        status: string
      }
    }
    owner: {
      uuid: string
      name: string
      email: string
      avatar?: string
    }
  }>
}

/**
 * GraphQL 创建工时记录响应
 */
export interface CreateManhourResponse {
  addManhour: {
    uuid: string
  }
}
