/**
 * 任务操作面板组件
 * 
 * 功能：
 * - 复用任务查询组件的任务列表
 * - 为每个任务添加状态下拉选择器
 * - 实现状态更新功能
 * - 显示更新成功/失败提示
 * - 处理网络错误
 * 
 * 需求: 3.1, 3.2, 3.3, 3.4
 */

import { useState, useEffect } from 'react'
import { Table, Select, Space, Typography, Alert, Tag, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { taskService } from '../services'
import { Task, TaskStatus } from '../types/task'

const { Title } = Typography

/**
 * 任务状态标签颜色映射
 */
const statusColorMap: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: 'default',
  [TaskStatus.IN_PROGRESS]: 'processing',
  [TaskStatus.DONE]: 'success',
}

/**
 * 任务状态显示文本映射
 */
const statusTextMap: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: '未开始',
  [TaskStatus.IN_PROGRESS]: '进行中',
  [TaskStatus.DONE]: '已完成',
}

/**
 * 任务操作面板组件
 */
export const TaskOperationPanel = () => {
  // 状态管理
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<TaskStatus[]>([TaskStatus.IN_PROGRESS]) // 默认选中"进行中"状态
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updatingTaskIds, setUpdatingTaskIds] = useState<Set<string>>(new Set()) // 跟踪正在更新的任务

  /**
   * 加载任务列表
   * 需求 3.1: 通过 ONES GraphQL API 查询任务
   */
  const loadTasks = async () => {
    try {
      setLoading(true)
      setError(null)

      // 查询任务
      const result = await taskService.getTasks({
        statuses: selectedStatuses.length > 0 ? selectedStatuses : undefined,
      })

      setTasks(result)
    } catch (err) {
      // 需求 3.4: 处理网络错误
      const errorMessage = err instanceof Error ? err.message : '加载任务失败，请稍后重试'
      setError(errorMessage)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  /**
   * 当筛选条件变化时重新加载任务
   */
  useEffect(() => {
    loadTasks()
  }, [selectedStatuses])

  /**
   * 处理状态筛选变化
   */
  const handleStatusChange = (values: TaskStatus[]) => {
    setSelectedStatuses(values)
  }

  /**
   * 处理任务状态更新
   * 需求 3.1: 通过 ONES GraphQL API 更新该任务的状态
   * 需求 3.2: 在界面上立即反映新的状态
   * 需求 3.3: 显示错误信息并保持原有状态
   * 需求 3.4: 显示网络错误提示并允许用户重试
   */
  const handleTaskStatusUpdate = async (taskId: string, newStatus: TaskStatus) => {
    // 找到当前任务
    const task = tasks.find(t => t.uuid === taskId)
    if (!task) {
      return
    }

    // 如果状态没有变化，不执行更新
    if (task.status === newStatus) {
      return
    }

    // 保存原始状态，用于失败时恢复
    const originalStatus = task.status

    try {
      // 标记任务为正在更新
      setUpdatingTaskIds(prev => new Set(prev).add(taskId))

      // 需求 3.2: 乐观更新 - 立即在界面上反映新的状态
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.uuid === taskId ? { ...t, status: newStatus } : t
        )
      )

      // 需求 3.1: 调用 API 更新任务状态
      await taskService.updateTaskStatus(taskId, newStatus)

      // 需求 3.2: 显示更新成功提示
      message.success(`任务状态已更新为"${statusTextMap[newStatus]}"`)
    } catch (err) {
      // 需求 3.3: 更新失败时恢复原有状态
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.uuid === taskId ? { ...t, status: originalStatus } : t
        )
      )

      // 需求 3.3, 3.4: 显示错误信息
      const errorMessage = err instanceof Error ? err.message : '更新任务状态失败'
      
      // 检查是否是网络错误
      if (err instanceof Error && (
        err.message.includes('网络') ||
        err.message.includes('network') ||
        err.message.includes('timeout') ||
        err.message.includes('连接')
      )) {
        // 需求 3.4: 显示网络错误提示并允许用户重试
        message.error({
          content: `${errorMessage}，请检查网络连接后重试`,
          duration: 5,
        })
      } else {
        message.error(errorMessage)
      }
    } finally {
      // 移除更新标记
      setUpdatingTaskIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(taskId)
        return newSet
      })
    }
  }

  /**
   * 表格列定义
   * 复用任务查询组件的任务列表，并添加状态操作列
   */
  const columns: ColumnsType<Task> = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      width: '25%',
      ellipsis: true,
    },
    {
      title: '当前状态',
      dataIndex: 'status',
      key: 'status',
      width: '12%',
      render: (status: TaskStatus) => (
        <Tag color={statusColorMap[status]}>
          {statusTextMap[status]}
        </Tag>
      ),
    },
    {
      title: '更改状态',
      key: 'statusOperation',
      width: '15%',
      render: (_, record) => (
        <Select
          style={{ width: '100%' }}
          value={record.status}
          onChange={(value) => handleTaskStatusUpdate(record.uuid, value)}
          loading={updatingTaskIds.has(record.uuid)}
          disabled={updatingTaskIds.has(record.uuid)}
          options={[
            { label: '未开始', value: TaskStatus.TODO },
            { label: '进行中', value: TaskStatus.IN_PROGRESS },
            { label: '已完成', value: TaskStatus.DONE },
          ]}
        />
      ),
    },
    {
      title: '项目',
      dataIndex: ['project', 'name'],
      key: 'project',
      width: '20%',
      ellipsis: true,
    },
    {
      title: '负责人',
      dataIndex: ['assign', 'name'],
      key: 'assign',
      width: '13%',
      render: (name: string | undefined) => name || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: '15%',
      render: (time: number) => new Date(time * 1000).toLocaleDateString('zh-CN'),
    },
  ]

  /**
   * 状态筛选选项
   */
  const statusOptions = [
    { label: '未开始', value: TaskStatus.TODO },
    { label: '进行中', value: TaskStatus.IN_PROGRESS },
    { label: '已完成', value: TaskStatus.DONE },
  ]

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 标题 */}
        <Title level={4}>任务操作</Title>

        {/* 筛选器 */}
        <Space>
          <span>任务状态：</span>
          <Select
            mode="multiple"
            style={{ minWidth: 300 }}
            placeholder="请选择任务状态"
            value={selectedStatuses}
            onChange={handleStatusChange}
            options={statusOptions}
            allowClear
          />
        </Space>

        {/* 错误提示 */}
        {error && (
          <Alert
            message="加载失败"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
          />
        )}

        {/* 任务列表表格 */}
        <Table
          columns={columns}
          dataSource={tasks}
          rowKey="uuid"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条任务`,
          }}
          locale={{
            emptyText: selectedStatuses.length === 0 
              ? '请选择任务状态进行查询' 
              : '暂无符合条件的任务',
          }}
        />
      </Space>
    </div>
  )
}
