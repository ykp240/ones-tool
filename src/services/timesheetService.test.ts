/**
 * 工时服务单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TimesheetService } from './timesheetService'
import { graphqlClient } from './graphqlClient'
import { authService } from './authService'

// Mock dependencies
vi.mock('./graphqlClient')
vi.mock('./authService')

describe('TimesheetService', () => {
  let service: TimesheetService

  beforeEach(() => {
    service = new TimesheetService()
    vi.clearAllMocks()
  })

  describe('getWorkDays', () => {
    it('should return only weekdays, excluding weekends', () => {
      // 2024-01-01 is Monday
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-07') // Sunday

      const workDays = service.getWorkDays(startDate, endDate)

      // Should have 5 work days (Mon-Fri)
      expect(workDays).toHaveLength(5)

      // Verify all days are weekdays
      workDays.forEach(day => {
        const dayOfWeek = day.getDay()
        expect(dayOfWeek).toBeGreaterThanOrEqual(1) // Monday
        expect(dayOfWeek).toBeLessThanOrEqual(5) // Friday
      })
    })

    it('should return empty array if start date is after end date', () => {
      const startDate = new Date('2024-01-07')
      const endDate = new Date('2024-01-01')

      expect(() => service.getWorkDays(startDate, endDate)).toThrow(
        '起始日期不能晚于结束日期'
      )
    })

    it('should handle single day range', () => {
      // Monday
      const date = new Date('2024-01-01')

      const workDays = service.getWorkDays(date, date)

      expect(workDays).toHaveLength(1)
      expect(workDays[0].getDay()).toBe(1) // Monday
    })

    it('should exclude weekend in single day range', () => {
      // Saturday
      const date = new Date('2024-01-06')

      const workDays = service.getWorkDays(date, date)

      expect(workDays).toHaveLength(0)
    })

    it('should handle multiple weeks', () => {
      // 2 weeks: 2024-01-01 (Mon) to 2024-01-14 (Sun)
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-14')

      const workDays = service.getWorkDays(startDate, endDate)

      // Should have 10 work days (5 days * 2 weeks)
      expect(workDays).toHaveLength(10)
    })
  })

  describe('getManhours', () => {
    it('should query manhours with correct parameters', async () => {
      const mockUserId = 'user-123'
      const mockResponse = {
        manhours: [
          {
            uuid: 'manhour-1',
            hours: 8,
            startTime: 1704067200, // 2024-01-01
            type: 'recorded',
            description: 'Test work',
            task: {
              uuid: 'task-1',
              name: 'Test Task',
              status: 'in_progress',
              project: {
                uuid: 'project-1',
                name: 'Test Project',
                status: 'in_progress',
              },
            },
            owner: {
              uuid: mockUserId,
              name: 'Test User',
              email: 'test@example.com',
            },
          },
        ],
      }

      vi.mocked(authService.getUserId).mockReturnValue(mockUserId)
      vi.mocked(graphqlClient.query).mockResolvedValue(mockResponse)

      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      const result = await service.getManhours({ startDate, endDate })

      expect(result).toHaveLength(1)
      expect(result[0].uuid).toBe('manhour-1')
      expect(result[0].hours).toBe(8)
      expect(result[0].task.name).toBe('Test Task')
      expect(graphqlClient.query).toHaveBeenCalledWith(
        expect.stringContaining('query GetManhours'),
        expect.objectContaining({
          userId: mockUserId,
          startTime: expect.any(Number),
          endTime: expect.any(Number),
        })
      )
    })

    it('should throw error if user is not logged in', async () => {
      vi.mocked(authService.getUserId).mockReturnValue(null)

      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      await expect(service.getManhours({ startDate, endDate })).rejects.toThrow(
        '用户未登录'
      )
    })
  })

  describe('submitManhour', () => {
    it('should submit manhour with correct parameters', async () => {
      const mockResponse = {
        addManhour: {
          uuid: 'manhour-1',
        },
      }

      vi.mocked(graphqlClient.mutate).mockResolvedValue(mockResponse)

      const data = {
        taskId: 'task-1',
        date: new Date('2024-01-01'),
        hours: 8,
        description: 'Test work',
      }

      await service.submitManhour(data)

      expect(graphqlClient.mutate).toHaveBeenCalledWith(
        expect.stringContaining('mutation CreateManhour'),
        expect.objectContaining({
          taskId: 'task-1',
          hours: 8,
          startTime: expect.any(Number),
          description: 'Test work',
        })
      )
    })

    it('should reject negative hours', async () => {
      const data = {
        taskId: 'task-1',
        date: new Date('2024-01-01'),
        hours: -5,
      }

      await expect(service.submitManhour(data)).rejects.toThrow(
        '工时数必须为正数'
      )
    })

    it('should reject zero hours', async () => {
      const data = {
        taskId: 'task-1',
        date: new Date('2024-01-01'),
        hours: 0,
      }

      await expect(service.submitManhour(data)).rejects.toThrow(
        '工时数必须为正数'
      )
    })

    it('should reject empty task ID', async () => {
      const data = {
        taskId: '',
        date: new Date('2024-01-01'),
        hours: 8,
      }

      await expect(service.submitManhour(data)).rejects.toThrow(
        '任务 ID 不能为空'
      )
    })
  })

  describe('batchSubmitManhours', () => {
    it('should distribute hours evenly across tasks and work days', async () => {
      const mockResponse = {
        addManhour: {
          uuid: 'manhour-1',
        },
      }

      vi.mocked(graphqlClient.mutate).mockResolvedValue(mockResponse)

      const data = {
        totalHours: 40,
        tasks: [
          { taskId: 'task-1', ratio: 1 },
          { taskId: 'task-2', ratio: 1 },
        ],
        startDate: new Date('2024-01-01'), // Monday
        endDate: new Date('2024-01-05'), // Friday
        excludeWeekends: true,
      }

      const result = await service.batchSubmitManhours(data)

      expect(result.success).toBe(true)
      expect(result.submittedCount).toBe(10) // 2 tasks * 5 days
      expect(result.failedCount).toBe(0)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject negative total hours', async () => {
      const data = {
        totalHours: -40,
        tasks: [{ taskId: 'task-1', ratio: 1 }],
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-05'),
        excludeWeekends: true,
      }

      const result = await service.batchSubmitManhours(data)

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should reject empty task list', async () => {
      const data = {
        totalHours: 40,
        tasks: [],
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-05'),
        excludeWeekends: true,
      }

      const result = await service.batchSubmitManhours(data)

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })
})
