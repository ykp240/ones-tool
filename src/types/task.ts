/**
 * 任务模块类型定义
 */

import type { User } from './auth'

/**
 * 任务状态枚举
 */
export enum TaskStatus {
  TODO = 'to_do',
  IN_PROGRESS = 'in_progress',
  DONE = 'done'
}

/**
 * 项目状态枚举
 */
export enum ProjectStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress'
}

/**
 * 项目信息
 */
export interface Project {
  uuid: string
  name: string
  status: ProjectStatus
}

/**
 * 任务信息
 */
export interface Task {
  uuid: string
  name: string
  status: TaskStatus
  project: Project
  assign: User | null
  createTime: number
  updateTime: number
}

/**
 * 任务查询过滤条件
 */
export interface TaskFilter {
  statuses?: TaskStatus[]
  projectStatuses?: ProjectStatus[]
}

/**
 * 任务服务接口
 */
export interface ITaskService {
  /**
   * 查询任务列表
   * @param filter 过滤条件
   * @returns 任务列表
   */
  getTasks(filter: TaskFilter): Promise<Task[]>

  /**
   * 更新任务状态
   * @param taskId 任务 ID
   * @param status 新状态
   */
  updateTaskStatus(taskId: string, status: TaskStatus): Promise<void>
}

/**
 * GraphQL 查询任务响应
 */
export interface GetTasksResponse {
  tasks: Array<{
    uuid: string
    name: string
    status: string
    project: {
      uuid: string
      name: string
      status: string
    }
    assign: {
      uuid: string
      name: string
      email: string
      avatar?: string
    } | null
    createTime: number
    updateTime: number
  }>
}

/**
 * GraphQL 更新任务状态响应
 */
export interface UpdateTaskStatusResponse {
  updateTask: {
    uuid: string
    status: string
  }
}
