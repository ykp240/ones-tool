/**
 * 工时自动填报组件
 * 
 * 功能：
 * - 实现总工时输入
 * - 实现任务选择器（多选）
 * - 实现日期范围选择器
 * - 实现分摊比例配置（可选）
 * - 默认均分选项
 * - 显示已手动填报的工时
 * - 计算剩余工时
 * - 实现批量提交功能
 * - 显示填报结果摘要
 * 
 * 需求: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */

import { useState, useEffect } from 'react'
import {
  Card,
  InputNumber,
  Select,
  DatePicker,
  Button,
  Space,
  Typography,
  Alert,
  Table,
  Spin,
  message,
  Modal,
  List,
  Divider,
  Switch,
  Row,
  Col,
  Statistic,
} from 'antd'
import type { Dayjs } from 'dayjs'
import { taskService, timesheetService } from '../services'
import { Task } from '../types/task'
import { TaskAllocation, BatchSubmitResult } from '../types/timesheet'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

/**
 * 任务分配配置（带比例）
 */
interface TaskAllocationConfig extends TaskAllocation {
  taskName: string
  projectName: string
}

/**
 * 工时自动填报组件
 */
export const TimesheetAutoFillPanel = () => {
  // 状态管理
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  const [totalHours, setTotalHours] = useState<number>(0)
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null)
  const [useCustomRatio, setUseCustomRatio] = useState(false)
  const [taskAllocations, setTaskAllocations] = useState<Map<string, number>>(new Map())
  const [excludeWeekends, setExcludeWeekends] = useState(true)
  
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // 已填报的工时
  const [submittedHours, setSubmittedHours] = useState<number>(0)
  const [loadingSubmittedHours, setLoadingSubmittedHours] = useState(false)
  
  // 提交结果
  const [submitResult, setSubmitResult] = useState<BatchSubmitResult | null>(null)
  const [showResultModal, setShowResultModal] = useState(false)

  /**
   * 加载任务列表
   * 需求 6.1: 选择任务列表
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载任务列表失败，请稍后重试'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 加载已填报的工时
   * 需求 6.5: 显示已手动填报的工时
   */
  const loadSubmittedHours = async () => {
    if (!dateRange || selectedTaskIds.length === 0) {
      setSubmittedHours(0)
      return
    }

    try {
      setLoadingSubmittedHours(true)

      const [startDate, endDate] = dateRange
      const manhours = await timesheetService.getManhours({
        startDate: startDate.toDate(),
        endDate: endDate.toDate(),
      })

      // 计算选中任务在该日期范围内已填报的总工时
      const total = manhours
        .filter(manhour => selectedTaskIds.includes(manhour.task.uuid))
        .reduce((sum, manhour) => sum + manhour.hours, 0)

      setSubmittedHours(total)
    } catch (err) {
      console.error('加载已填报工时失败:', err)
      setSubmittedHours(0)
    } finally {
      setLoadingSubmittedHours(false)
    }
  }

  /**
   * 初始化：加载任务列表
   */
  useEffect(() => {
    loadTasks()
  }, [])

  /**
   * 当日期范围或选中任务变化时，重新加载已填报工时
   * 需求 6.5: 在自动填报时扣除已填报的工时
   */
  useEffect(() => {
    loadSubmittedHours()
  }, [dateRange, selectedTaskIds])

  /**
   * 处理任务选择
   * 需求 6.1: 实现任务选择器（多选）
   */
  const handleTaskSelect = (taskIds: string[]) => {
    setSelectedTaskIds(taskIds)
    
    // 如果使用自定义比例，初始化新任务的比例为 1
    if (useCustomRatio) {
      const newAllocations = new Map(taskAllocations)
      taskIds.forEach(taskId => {
        if (!newAllocations.has(taskId)) {
          newAllocations.set(taskId, 1)
        }
      })
      // 移除未选中任务的比例
      Array.from(newAllocations.keys()).forEach(taskId => {
        if (!taskIds.includes(taskId)) {
          newAllocations.delete(taskId)
        }
      })
      setTaskAllocations(newAllocations)
    }
  }

  /**
   * 处理总工时输入
   * 需求 6.1: 实现总工时输入
   */
  const handleTotalHoursChange = (value: number | null) => {
    if (value !== null && value >= 0) {
      setTotalHours(value)
    }
  }

  /**
   * 处理日期范围选择
   * 需求 6.1: 实现日期范围选择器
   */
  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]])
    } else {
      setDateRange(null)
    }
  }

  /**
   * 处理自定义比例开关
   * 需求 6.3: 实现分摊比例配置（可选）
   */
  const handleCustomRatioToggle = (checked: boolean) => {
    setUseCustomRatio(checked)
    
    if (checked) {
      // 初始化所有选中任务的比例为 1（均分）
      const newAllocations = new Map<string, number>()
      selectedTaskIds.forEach(taskId => {
        newAllocations.set(taskId, 1)
      })
      setTaskAllocations(newAllocations)
    } else {
      // 清空自定义比例
      setTaskAllocations(new Map())
    }
  }

  /**
   * 处理任务比例变化
   * 需求 6.3: 按指定比例分配工时到各任务
   */
  const handleRatioChange = (taskId: string, ratio: number | null) => {
    if (ratio !== null && ratio >= 0) {
      const newAllocations = new Map(taskAllocations)
      newAllocations.set(taskId, ratio)
      setTaskAllocations(newAllocations)
    }
  }

  /**
   * 计算剩余工时
   * 需求 6.5: 计算剩余工时
   */
  const getRemainingHours = (): number => {
    return Math.max(0, totalHours - submittedHours)
  }

  /**
   * 计算工作日数量
   * 需求 6.4: 仅在工作日填报工时，排除周末
   */
  const getWorkDaysCount = (): number => {
    if (!dateRange) {
      return 0
    }

    const [startDate, endDate] = dateRange
    
    if (excludeWeekends) {
      const workDays = timesheetService.getWorkDays(
        startDate.toDate(),
        endDate.toDate()
      )
      return workDays.length
    } else {
      // 计算总天数
      return endDate.diff(startDate, 'day') + 1
    }
  }

  /**
   * 获取任务分配配置
   * 需求 6.2: 默认均分选项
   * 需求 6.3: 按指定比例分配工时
   */
  const getTaskAllocations = (): TaskAllocationConfig[] => {
    if (selectedTaskIds.length === 0) {
      return []
    }

    return selectedTaskIds.map(taskId => {
      const task = tasks.find(t => t.uuid === taskId)
      const ratio = useCustomRatio ? (taskAllocations.get(taskId) || 1) : 1
      
      return {
        taskId,
        taskName: task?.name || '未知任务',
        projectName: task?.project.name || '未知项目',
        ratio,
      }
    })
  }

  /**
   * 计算每个任务的分配工时
   */
  const calculateTaskHours = (): Map<string, number> => {
    const allocations = getTaskAllocations()
    const remainingHours = getRemainingHours()
    
    if (allocations.length === 0) {
      return new Map()
    }

    // 计算总比例
    const totalRatio = allocations.reduce((sum, alloc) => sum + alloc.ratio, 0)
    
    // 计算每个任务的工时
    const taskHours = new Map<string, number>()
    allocations.forEach(alloc => {
      const hours = (remainingHours * alloc.ratio) / totalRatio
      taskHours.set(alloc.taskId, hours)
    })

    return taskHours
  }

  /**
   * 验证输入
   */
  const validateInput = (): string | null => {
    if (totalHours <= 0) {
      return '总工时数必须为正数'
    }

    if (selectedTaskIds.length === 0) {
      return '请至少选择一个任务'
    }

    if (!dateRange) {
      return '请选择日期范围'
    }

    const remainingHours = getRemainingHours()
    if (remainingHours <= 0) {
      return '剩余工时为 0，无需填报'
    }

    const workDaysCount = getWorkDaysCount()
    if (workDaysCount === 0) {
      return '日期范围内没有可填报的日期'
    }

    if (useCustomRatio) {
      const allocations = getTaskAllocations()
      const totalRatio = allocations.reduce((sum, alloc) => sum + alloc.ratio, 0)
      if (totalRatio <= 0) {
        return '任务分摊比例总和必须大于 0'
      }
    }

    return null
  }

  /**
   * 提交批量填报
   * 需求 6.1: 按配置的分摊规则自动计算并通过 ONES GraphQL API 批量填报工时
   * 需求 6.6: 显示填报结果摘要
   */
  const handleSubmit = async () => {
    try {
      // 验证输入
      const validationError = validateInput()
      if (validationError) {
        message.error(validationError)
        return
      }

      setSubmitting(true)
      setError(null)

      // 构造批量填报数据
      const allocations = getTaskAllocations()
      const [startDate, endDate] = dateRange!

      const batchData = {
        totalHours: getRemainingHours(),
        tasks: allocations.map(alloc => ({
          taskId: alloc.taskId,
          ratio: alloc.ratio,
        })),
        startDate: startDate.toDate(),
        endDate: endDate.toDate(),
        excludeWeekends,
      }

      // 执行批量填报
      const result = await timesheetService.batchSubmitManhours(batchData)

      // 保存结果
      setSubmitResult(result)
      
      // 需求 6.6: 显示填报结果摘要
      if (result.success) {
        message.success(`工时填报成功！共填报 ${result.submittedCount} 条记录`)
        setShowResultModal(true)
        
        // 重新加载已填报工时
        await loadSubmittedHours()
        
        // 清空输入
        setTotalHours(0)
        setSelectedTaskIds([])
        setDateRange(null)
        setTaskAllocations(new Map())
      } else {
        message.error('工时填报失败，请查看详情')
        setShowResultModal(true)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '工时填报失败，请稍后重试'
      setError(errorMessage)
      message.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  // 计算任务分配工时
  const taskHours = calculateTaskHours()
  const allocations = getTaskAllocations()
  const remainingHours = getRemainingHours()
  const workDaysCount = getWorkDaysCount()

  // 表格列定义
  const columns = [
    {
      title: '任务名称',
      dataIndex: 'taskName',
      key: 'taskName',
    },
    {
      title: '项目',
      dataIndex: 'projectName',
      key: 'projectName',
    },
    {
      title: '分摊比例',
      dataIndex: 'ratio',
      key: 'ratio',
      render: (ratio: number, record: TaskAllocationConfig) => {
        if (useCustomRatio) {
          return (
            <InputNumber
              min={0}
              step={0.1}
              precision={1}
              value={ratio}
              onChange={(value) => handleRatioChange(record.taskId, value)}
              style={{ width: 100 }}
            />
          )
        } else {
          const totalRatio = allocations.reduce((sum, alloc) => sum + alloc.ratio, 0)
          const percentage = totalRatio > 0 ? (ratio / totalRatio * 100).toFixed(1) : '0.0'
          return `${percentage}%`
        }
      },
    },
    {
      title: '分配工时',
      key: 'allocatedHours',
      render: (_: any, record: TaskAllocationConfig) => {
        const hours = taskHours.get(record.taskId) || 0
        return `${hours.toFixed(1)} 小时`
      },
    },
  ]

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 标题 */}
        <Title level={4}>工时填报 - 自动填报</Title>

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
            {/* 基本配置 */}
            <Card title="基本配置" size="small">
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {/* 总工时输入 */}
                <Row gutter={16}>
                  <Col span={12}>
                    <Space>
                      <Text strong>总工时数（小时）：</Text>
                      <InputNumber
                        min={0}
                        step={1}
                        precision={1}
                        value={totalHours}
                        onChange={handleTotalHoursChange}
                        style={{ width: 150 }}
                        placeholder="请输入总工时"
                      />
                    </Space>
                  </Col>
                  <Col span={12}>
                    <Space>
                      <Text strong>排除周末：</Text>
                      <Switch
                        checked={excludeWeekends}
                        onChange={setExcludeWeekends}
                        checkedChildren="是"
                        unCheckedChildren="否"
                      />
                    </Space>
                  </Col>
                </Row>

                {/* 日期范围选择 */}
                <Space>
                  <Text strong>日期范围：</Text>
                  <RangePicker
                    value={dateRange}
                    onChange={handleDateRangeChange}
                    format="YYYY-MM-DD"
                    placeholder={['开始日期', '结束日期']}
                  />
                  {workDaysCount > 0 && (
                    <Text type="secondary">
                      （共 {workDaysCount} 天）
                    </Text>
                  )}
                </Space>

                {/* 任务选择 */}
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text strong>选择任务（可多选）：</Text>
                  <Select
                    mode="multiple"
                    style={{ width: '100%' }}
                    placeholder="请选择要填报工时的任务"
                    value={selectedTaskIds}
                    onChange={handleTaskSelect}
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
              </Space>
            </Card>

            {/* 工时统计 */}
            {selectedTaskIds.length > 0 && dateRange && (
              <Card title="工时统计" size="small">
                <Row gutter={16}>
                  <Col span={8}>
                    <Statistic
                      title="总工时"
                      value={totalHours}
                      suffix="小时"
                      precision={1}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="已填报工时"
                      value={submittedHours}
                      suffix="小时"
                      precision={1}
                      loading={loadingSubmittedHours}
                      valueStyle={{ color: '#cf1322' }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="剩余工时"
                      value={remainingHours}
                      suffix="小时"
                      precision={1}
                      valueStyle={{ color: '#3f8600' }}
                    />
                  </Col>
                </Row>
              </Card>
            )}

            {/* 任务分配配置 */}
            {selectedTaskIds.length > 0 && (
              <Card 
                title="任务分配配置"
                size="small"
                extra={
                  <Space>
                    <Text>自定义比例：</Text>
                    <Switch
                      checked={useCustomRatio}
                      onChange={handleCustomRatioToggle}
                      checkedChildren="开"
                      unCheckedChildren="关"
                    />
                  </Space>
                }
              >
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  {!useCustomRatio && (
                    <Alert
                      message="默认均分模式"
                      description="工时将在所选任务间均匀分配"
                      type="info"
                      showIcon
                    />
                  )}

                  <Table
                    dataSource={allocations}
                    columns={columns}
                    rowKey="taskId"
                    pagination={false}
                    size="small"
                  />
                </Space>
              </Card>
            )}

            {/* 提交按钮 */}
            <Card size="small">
              <Space>
                <Button
                  type="primary"
                  size="large"
                  onClick={handleSubmit}
                  loading={submitting}
                  disabled={!dateRange || selectedTaskIds.length === 0 || totalHours <= 0}
                >
                  批量提交工时
                </Button>
                <Text type="secondary">
                  提示：将自动分配剩余工时到选中的任务和日期
                </Text>
              </Space>
            </Card>
          </Space>
        </Spin>
      </Space>

      {/* 填报结果模态框 */}
      <Modal
        title="填报结果摘要"
        open={showResultModal}
        onCancel={() => setShowResultModal(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setShowResultModal(false)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        {submitResult && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {/* 结果统计 */}
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="成功填报"
                  value={submitResult.submittedCount}
                  suffix="条"
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="失败"
                  value={submitResult.failedCount}
                  suffix="条"
                  valueStyle={{ color: '#cf1322' }}
                />
              </Col>
            </Row>

            <Divider />

            {/* 错误信息 */}
            {submitResult.errors.length > 0 && (
              <div>
                <Text strong>错误详情：</Text>
                <List
                  size="small"
                  dataSource={submitResult.errors}
                  renderItem={error => (
                    <List.Item>
                      <Text type="danger">{error}</Text>
                    </List.Item>
                  )}
                />
              </div>
            )}

            {/* 成功提示 */}
            {submitResult.success && submitResult.errors.length === 0 && (
              <Alert
                message="填报成功"
                description="所有工时记录已成功提交"
                type="success"
                showIcon
              />
            )}
          </Space>
        )}
      </Modal>
    </div>
  )
}
