/**
 * 任务查询面板组件
 * 
 * 功能：
 * - 使用 Ant Design Table 显示任务列表
 * - 实现状态筛选器（多选）
 * - 默认选中"进行中"状态
 * - 显示任务名称、状态、项目、负责人等信息
 * - 处理加载状态和错误状态
 * - 显示空状态提示
 * 
 * 需求: 2.1, 2.2, 2.3, 2.4, 2.5
 */

import { useState, useEffect } from 'react'
import { Table, Select, Space, Typography, Alert, Tag } from 'antd'
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
 * 任务查询面板组件
 */
export const TaskQueryPanel = () => {
  // 状态管理
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<TaskStatus[]>([TaskStatus.IN_PROGRESS]) // 需求 2.3: 默认选中"进行中"状态
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * 加载任务列表
   * 需求 2.1: 通过 ONES GraphQL API 查询并显示任务
   * 需求 2.2: 仅显示符合所选状态的任务
   * 需求 2.4: 显示满足任意所选状态的任务
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
      // 处理错误
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
   * 需求 2.2: 仅显示符合所选状态的任务
   * 需求 2.4: 显示满足任意所选状态的任务
   */
  const handleStatusChange = (values: TaskStatus[]) => {
    setSelectedStatuses(values)
  }

  /**
   * 表格列定义
   * 需求 2.1: 显示任务名称、状态、项目、负责人等信息
   */
  const columns: ColumnsType<Task> = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      width: '30%',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: '15%',
      render: (status: TaskStatus) => (
        <Tag color={statusColorMap[status]}>
          {statusTextMap[status]}
        </Tag>
      ),
    },
    {
      title: '项目',
      dataIndex: ['project', 'name'],
      key: 'project',
      width: '25%',
      ellipsis: true,
    },
    {
      title: '负责人',
      dataIndex: ['assign', 'name'],
      key: 'assign',
      width: '15%',
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
        <Title level={4}>任务查询</Title>

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
              : '暂无符合条件的任务', // 需求 2.5: 显示空状态提示
          }}
        />
      </Space>
    </div>
  )
}
