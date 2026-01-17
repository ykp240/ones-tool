/**
 * 工时填报面板组件
 * 
 * 功能：
 * - 使用 Ant Design Calendar 显示月视图
 * - 为每个日期显示输入框
 * - 实现任务选择器
 * - 实现工时输入和验证（正数）
 * - 实现提交功能
 * - 显示已填报的工时
 * - 支持手动/自动模式切换
 * 
 * 需求: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1
 */

import { useState, useEffect } from 'react'
import { 
  Calendar, 
  Select, 
  InputNumber, 
  Button, 
  Space, 
  Typography, 
  Alert, 
  Card,
  Badge,
  message,
  Spin,
  Modal,
  List,
  Segmented,
} from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { taskService, timesheetService } from '../services'
import { Task } from '../types/task'
import { Manhour } from '../types/timesheet'
import { TimesheetAutoFillPanel } from './TimesheetAutoFillPanel'

const { Title, Text } = Typography

/**
 * 填报模式
 */
type SubmitMode = 'manual' | 'auto'

/**
 * 日期工时数据
 */
interface DateHours {
  [taskId: string]: number
}

/**
 * 工时填报面板组件
 */
export const TimesheetSubmitPanel = () => {
  // 模式切换
  // 需求 13.3: 实现手动/自动模式切换
  const [mode, setMode] = useState<SubmitMode>('manual')
  
  // 状态管理
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs())
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())
  const [hours, setHours] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // 已填报的工时记录（按日期和任务组织）
  const [submittedManhours, setSubmittedManhours] = useState<Map<string, DateHours>>(new Map())
  
  // 当前选中日期的工时记录详情
  const [dateManhoursDetail, setDateManhoursDetail] = useState<Manhour[]>([])
  const [showDetailModal, setShowDetailModal] = useState(false)

  /**
   * 加载任务列表
   * 需求 5.1: 选择任务
   */
  const loadTasks = async () => {
    try {
      setLoading(true)
      setError(null)

      // 查询进行中的任务
      const result = await taskService.getTasks({
        statuses: ['in_progress' as any],
      })

      setTasks(result)
      
      // 默认选中第一个任务
      if (result.length > 0 && !selectedTask) {
        setSelectedTask(result[0].uuid)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载任务列表失败，请稍后重试'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 加载已填报的工时记录
   * 需求 5.5: 显示已填报的工时
   */
  const loadSubmittedManhours = async () => {
    try {
      // 查询当前月的工时记录
      const startDate = currentMonth.startOf('month').toDate()
      const endDate = currentMonth.endOf('month').toDate()

      const manhours = await timesheetService.getManhours({
        startDate,
        endDate,
      })

      // 按日期和任务组织工时数据
      const manhoursMap = new Map<string, DateHours>()
      
      manhours.forEach(manhour => {
        const dateKey = dayjs(manhour.startTime * 1000).format('YYYY-MM-DD')
        const taskId = manhour.task.uuid
        
        if (!manhoursMap.has(dateKey)) {
          manhoursMap.set(dateKey, {})
        }
        
        const dateHours = manhoursMap.get(dateKey)!
        dateHours[taskId] = (dateHours[taskId] || 0) + manhour.hours
      })

      setSubmittedManhours(manhoursMap)
    } catch (err) {
      console.error('加载已填报工时失败:', err)
    }
  }

  /**
   * 初始化：加载任务列表和已填报工时
   */
  useEffect(() => {
    loadTasks()
  }, [])

  /**
   * 当月份变化时重新加载已填报工时
   */
  useEffect(() => {
    loadSubmittedManhours()
  }, [currentMonth])

  /**
   * 处理任务选择
   * 需求 5.1: 实现任务选择器
   */
  const handleTaskChange = (taskId: string) => {
    setSelectedTask(taskId)
  }

  /**
   * 处理工时输入
   * 需求 5.2: 实现工时输入和验证（正数）
   */
  const handleHoursChange = (value: number | null) => {
    if (value !== null && value >= 0) {
      setHours(value)
    }
  }

  /**
   * 处理日期选择
   * 需求 5.5: 按月显示所有日期供用户逐一填报
   */
  const handleDateSelect = (date: Dayjs) => {
    setSelectedDate(date)
    
    // 获取该日期已填报的工时
    const dateKey = date.format('YYYY-MM-DD')
    const dateHours = submittedManhours.get(dateKey)
    
    if (dateHours && selectedTask && dateHours[selectedTask]) {
      setHours(dateHours[selectedTask])
    } else {
      setHours(0)
    }
  }

  /**
   * 处理月份变化
   * 需求 5.5: 按月显示所有日期
   */
  const handleMonthChange = (date: Dayjs) => {
    setCurrentMonth(date)
  }

  /**
   * 提交工时
   * 需求 5.1: 通过 ONES GraphQL API 创建或更新该工时记录
   * 需求 5.2: 验证工时数为正数
   * 需求 5.3: 工时填报成功后在界面上立即显示更新后的工时记录
   * 需求 5.4: 工时填报失败时显示错误信息并保持原有数据
   */
  const handleSubmit = async () => {
    try {
      // 验证
      if (!selectedTask) {
        message.error('请选择任务')
        return
      }

      // 需求 5.2: 验证工时数为正数
      if (hours <= 0) {
        message.error('工时数必须为正数')
        return
      }

      setSubmitting(true)
      setError(null)

      // 提交工时
      await timesheetService.submitManhour({
        taskId: selectedTask,
        date: selectedDate.toDate(),
        hours,
      })

      // 需求 5.3: 工时填报成功后在界面上立即显示更新后的工时记录
      message.success('工时填报成功')
      
      // 重新加载已填报工时
      await loadSubmittedManhours()
      
      // 清空输入
      setHours(0)
    } catch (err) {
      // 需求 5.4: 工时填报失败时显示错误信息并保持原有数据
      const errorMessage = err instanceof Error ? err.message : '工时填报失败，请稍后重试'
      setError(errorMessage)
      message.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  /**
   * 查看某日期的工时详情
   */
  const handleViewDateDetail = async (date: Dayjs) => {
    try {
      const startDate = date.startOf('day').toDate()
      const endDate = date.endOf('day').toDate()

      const manhours = await timesheetService.getManhours({
        startDate,
        endDate,
      })

      setDateManhoursDetail(manhours)
      setShowDetailModal(true)
    } catch (err) {
      message.error('加载工时详情失败')
    }
  }

  /**
   * 自定义日期单元格渲染
   * 需求 5.5: 显示已填报的工时
   */
  const dateCellRender = (date: Dayjs) => {
    const dateKey = date.format('YYYY-MM-DD')
    const dateHours = submittedManhours.get(dateKey)
    
    if (!dateHours) {
      return null
    }

    // 计算该日期的总工时
    const totalHours = Object.values(dateHours).reduce((sum, h) => sum + h, 0)
    
    if (totalHours === 0) {
      return null
    }

    return (
      <div 
        style={{ cursor: 'pointer' }}
        onClick={(e) => {
          e.stopPropagation()
          handleViewDateDetail(date)
        }}
      >
        <Badge 
          status="success" 
          text={`${totalHours.toFixed(1)}h`}
          style={{ fontSize: '12px' }}
        />
      </div>
    )
  }

  /**
   * 获取当前选中日期已填报的工时
   */
  const getSelectedDateHours = () => {
    const dateKey = selectedDate.format('YYYY-MM-DD')
    const dateHours = submittedManhours.get(dateKey)
    
    if (!dateHours) {
      return []
    }

    return Object.entries(dateHours).map(([taskId, hours]) => {
      const task = tasks.find(t => t.uuid === taskId)
      return {
        taskId,
        taskName: task?.name || '未知任务',
        hours,
      }
    })
  }

  const selectedDateHours = getSelectedDateHours()

  // 如果是自动填报模式，显示自动填报组件
  if (mode === 'auto') {
    return (
      <div>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 模式切换 */}
          <Card size="small">
            <Space>
              <Text strong>填报模式：</Text>
              <Segmented
                options={[
                  { label: '手动填报', value: 'manual' },
                  { label: '自动填报', value: 'auto' },
                ]}
                value={mode}
                onChange={(value) => setMode(value as SubmitMode)}
              />
            </Space>
          </Card>

          {/* 自动填报组件 */}
          <TimesheetAutoFillPanel />
        </Space>
      </div>
    )
  }

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 模式切换 */}
        <Card size="small">
          <Space>
            <Text strong>填报模式：</Text>
            <Segmented
              options={[
                { label: '手动填报', value: 'manual' },
                { label: '自动填报', value: 'auto' },
              ]}
              value={mode}
              onChange={(value) => setMode(value as SubmitMode)}
            />
          </Space>
        </Card>

        {/* 标题 */}
        <Title level={4}>工时填报 - 手动填报</Title>

        {/* 错误提示 */}
        {error && (
          <Alert
            message="操作失败"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
          />
        )}

        {/* 主要内容区域 */}
        <Spin spinning={loading}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* 任务选择器 */}
            <Card title="选择任务" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text>请选择要填报工时的任务：</Text>
                <Select
                  style={{ width: '100%' }}
                  placeholder="请选择任务"
                  value={selectedTask}
                  onChange={handleTaskChange}
                  options={tasks.map(task => ({
                    label: `${task.name} (${task.project.name})`,
                    value: task.uuid,
                  }))}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                />
              </Space>
            </Card>

            {/* 日历和工时输入 */}
            <Card title={`选择日期 - ${currentMonth.format('YYYY年MM月')}`} size="small">
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {/* 日历 */}
                <Calendar
                  fullscreen={false}
                  value={selectedDate}
                  onSelect={handleDateSelect}
                  onPanelChange={handleMonthChange}
                  cellRender={dateCellRender}
                />

                {/* 工时输入区域 */}
                <Card 
                  title={`填报工时 - ${selectedDate.format('YYYY年MM月DD日')}`}
                  size="small"
                  style={{ backgroundColor: '#f5f5f5' }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {/* 已填报工时显示 */}
                    {selectedDateHours.length > 0 && (
                      <div>
                        <Text strong>该日期已填报工时：</Text>
                        <List
                          size="small"
                          dataSource={selectedDateHours}
                          renderItem={item => (
                            <List.Item>
                              <Text>{item.taskName}: </Text>
                              <Text strong>{item.hours.toFixed(1)} 小时</Text>
                            </List.Item>
                          )}
                        />
                      </div>
                    )}

                    {/* 工时输入 */}
                    <Space>
                      <Text>工时数（小时）：</Text>
                      <InputNumber
                        min={0}
                        step={0.5}
                        precision={1}
                        value={hours}
                        onChange={handleHoursChange}
                        style={{ width: 150 }}
                        placeholder="请输入工时"
                      />
                      <Button
                        type="primary"
                        onClick={handleSubmit}
                        loading={submitting}
                        disabled={!selectedTask || hours <= 0}
                      >
                        提交工时
                      </Button>
                    </Space>

                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      提示：工时数必须为正数，可以使用小数（如 0.5 表示半小时）
                    </Text>
                  </Space>
                </Card>
              </Space>
            </Card>
          </Space>
        </Spin>
      </Space>

      {/* 工时详情模态框 */}
      <Modal
        title={`工时详情 - ${selectedDate.format('YYYY年MM月DD日')}`}
        open={showDetailModal}
        onCancel={() => setShowDetailModal(false)}
        footer={[
          <Button key="close" onClick={() => setShowDetailModal(false)}>
            关闭
          </Button>
        ]}
      >
        <List
          dataSource={dateManhoursDetail}
          renderItem={manhour => (
            <List.Item>
              <List.Item.Meta
                title={manhour.task.name}
                description={`项目: ${manhour.task.project.name}`}
              />
              <Text strong>{manhour.hours.toFixed(1)} 小时</Text>
            </List.Item>
          )}
          locale={{
            emptyText: '该日期暂无工时记录'
          }}
        />
      </Modal>
    </div>
  )
}
