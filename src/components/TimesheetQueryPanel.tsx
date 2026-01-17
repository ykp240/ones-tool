/**
 * 工时查询面板组件
 * 
 * 功能：
 * - 使用 Ant Design DatePicker 选择日期范围
 * - 使用 Ant Design Table 显示工时记录
 * - 显示任务名称、日期、工时数
 * - 同时显示任务列表和对应工时
 * - 处理加载状态和错误状态
 * - 显示空状态提示
 * 
 * 需求: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { useState, useEffect } from 'react'
import { DatePicker, Table, Space, Typography, Alert, Card, Row, Col } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { timesheetService } from '../services'
import { Manhour } from '../types/timesheet'

const { Title } = Typography
const { RangePicker } = DatePicker

/**
 * 工时查询面板组件
 */
export const TimesheetQueryPanel = () => {
  // 状态管理
  const [manhours, setManhours] = useState<Manhour[]>([])
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'), // 默认当月第一天
    dayjs().endOf('month'),   // 默认当月最后一天
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * 加载工时记录
   * 需求 4.1: 通过 ONES GraphQL API 获取并显示该日期范围内的所有工时记录
   * 需求 4.3: 同时显示该日期范围内登录用户的任务及对应已填报的工时
   */
  const loadManhours = async () => {
    try {
      setLoading(true)
      setError(null)

      // 查询工时记录
      const result = await timesheetService.getManhours({
        startDate: dateRange[0].toDate(),
        endDate: dateRange[1].toDate(),
      })

      setManhours(result)
    } catch (err) {
      // 需求 4.5: 工时查询请求失败时显示错误信息并允许用户重试
      const errorMessage = err instanceof Error ? err.message : '加载工时记录失败，请稍后重试'
      setError(errorMessage)
      setManhours([])
    } finally {
      setLoading(false)
    }
  }

  /**
   * 当日期范围变化时重新加载工时记录
   */
  useEffect(() => {
    loadManhours()
  }, [dateRange])

  /**
   * 处理日期范围变化
   * 需求 4.1: 用户在工时查询模块中选择起止日期
   */
  const handleDateRangeChange = (dates: null | [Dayjs | null, Dayjs | null]) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]])
    }
  }

  /**
   * 计算统计信息
   */
  const calculateStats = () => {
    // 按任务分组统计
    const taskStats = new Map<string, { taskName: string; totalHours: number; count: number }>()
    
    manhours.forEach(manhour => {
      const taskId = manhour.task.uuid
      const existing = taskStats.get(taskId)
      
      if (existing) {
        existing.totalHours += manhour.hours
        existing.count += 1
      } else {
        taskStats.set(taskId, {
          taskName: manhour.task.name,
          totalHours: manhour.hours,
          count: 1,
        })
      }
    })

    return {
      totalHours: manhours.reduce((sum, m) => sum + m.hours, 0),
      totalRecords: manhours.length,
      taskStats: Array.from(taskStats.values()),
    }
  }

  const stats = calculateStats()

  /**
   * 工时记录表格列定义
   * 需求 4.2: 显示每条记录的任务名称、日期和工时数
   */
  const manhourColumns: ColumnsType<Manhour> = [
    {
      title: '任务名称',
      dataIndex: ['task', 'name'],
      key: 'taskName',
      width: '30%',
      ellipsis: true,
    },
    {
      title: '项目',
      dataIndex: ['task', 'project', 'name'],
      key: 'projectName',
      width: '25%',
      ellipsis: true,
    },
    {
      title: '日期',
      dataIndex: 'startTime',
      key: 'date',
      width: '20%',
      render: (time: number) => dayjs(time * 1000).format('YYYY-MM-DD'),
      sorter: (a, b) => a.startTime - b.startTime,
    },
    {
      title: '工时数（小时）',
      dataIndex: 'hours',
      key: 'hours',
      width: '15%',
      render: (hours: number) => hours.toFixed(1),
      sorter: (a, b) => a.hours - b.hours,
    },
    {
      title: '备注',
      dataIndex: 'description',
      key: 'description',
      width: '10%',
      ellipsis: true,
      render: (description?: string) => description || '-',
    },
  ]

  /**
   * 任务统计表格列定义
   * 需求 4.3: 同时显示任务列表和对应工时
   */
  const taskStatsColumns: ColumnsType<{ taskName: string; totalHours: number; count: number }> = [
    {
      title: '任务名称',
      dataIndex: 'taskName',
      key: 'taskName',
      ellipsis: true,
    },
    {
      title: '总工时（小时）',
      dataIndex: 'totalHours',
      key: 'totalHours',
      render: (hours: number) => hours.toFixed(1),
      sorter: (a, b) => a.totalHours - b.totalHours,
    },
    {
      title: '记录数',
      dataIndex: 'count',
      key: 'count',
      sorter: (a, b) => a.count - b.count,
    },
  ]

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 标题 */}
        <Title level={4}>工时查询</Title>

        {/* 日期范围选择器 */}
        <Space>
          <span>日期范围：</span>
          <RangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
            format="YYYY-MM-DD"
            allowClear={false}
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
            action={
              <a onClick={loadManhours}>重试</a>
            }
          />
        )}

        {/* 统计信息 */}
        {!loading && !error && manhours.length > 0 && (
          <Row gutter={16}>
            <Col span={8}>
              <Card>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                    {stats.totalHours.toFixed(1)}
                  </div>
                  <div style={{ color: '#666' }}>总工时（小时）</div>
                </div>
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                    {stats.totalRecords}
                  </div>
                  <div style={{ color: '#666' }}>工时记录数</div>
                </div>
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>
                    {stats.taskStats.length}
                  </div>
                  <div style={{ color: '#666' }}>涉及任务数</div>
                </div>
              </Card>
            </Col>
          </Row>
        )}

        {/* 任务统计表格 */}
        {!loading && !error && manhours.length > 0 && (
          <div>
            <Title level={5}>任务工时统计</Title>
            <Table
              columns={taskStatsColumns}
              dataSource={stats.taskStats}
              rowKey="taskName"
              pagination={false}
              size="small"
            />
          </div>
        )}

        {/* 工时记录表格 */}
        <div>
          <Title level={5}>工时记录明细</Title>
          <Table
            columns={manhourColumns}
            dataSource={manhours}
            rowKey="uuid"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条工时记录`,
            }}
            locale={{
              emptyText: '该日期范围内暂无工时记录', // 需求 4.4: 显示友好的提示信息
            }}
          />
        </div>
      </Space>
    </div>
  )
}
