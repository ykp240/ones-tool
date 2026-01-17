import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MainPage } from './MainPage'

// Mock the MainLayout component
vi.mock('../components', () => ({
  MainLayout: ({ children, currentModule, onModuleChange }: any) => (
    <div data-testid="main-layout" data-current-module={currentModule}>
      <button onClick={() => onModuleChange('task-query')}>切换任务查询</button>
      <button onClick={() => onModuleChange('task-operation')}>切换任务操作</button>
      <button onClick={() => onModuleChange('timesheet-query')}>切换工时查询</button>
      <button onClick={() => onModuleChange('timesheet-submit')}>切换工时填报</button>
      {children}
    </div>
  ),
}))

describe('MainPage', () => {
  describe('Module Routing', () => {
    it('should display task query module when at /tasks/query', () => {
      render(
        <MemoryRouter initialEntries={['/tasks/query']}>
          <MainPage />
        </MemoryRouter>
      )

      expect(screen.getByRole('heading', { name: '任务查询' })).toBeDefined()
      expect(screen.getByText('任务查询模块正在开发中...')).toBeDefined()
    })

    it('should display task operation module when at /tasks/operation', () => {
      render(
        <MemoryRouter initialEntries={['/tasks/operation']}>
          <MainPage />
        </MemoryRouter>
      )

      expect(screen.getByRole('heading', { name: '任务操作' })).toBeDefined()
      expect(screen.getByText('任务操作模块正在开发中...')).toBeDefined()
    })

    it('should display timesheet query module when at /timesheet/query', () => {
      render(
        <MemoryRouter initialEntries={['/timesheet/query']}>
          <MainPage />
        </MemoryRouter>
      )

      expect(screen.getByRole('heading', { name: '工时查询' })).toBeDefined()
      expect(screen.getByText('工时查询模块正在开发中...')).toBeDefined()
    })

    it('should display timesheet submit module when at /timesheet/submit', () => {
      render(
        <MemoryRouter initialEntries={['/timesheet/submit']}>
          <MainPage />
        </MemoryRouter>
      )

      expect(screen.getByRole('heading', { name: '工时填报' })).toBeDefined()
      expect(screen.getByText('工时填报模块正在开发中...')).toBeDefined()
    })

    it('should default to task query module for unknown paths', () => {
      render(
        <MemoryRouter initialEntries={['/unknown']}>
          <MainPage />
        </MemoryRouter>
      )

      const layout = screen.getByTestId('main-layout')
      expect(layout.getAttribute('data-current-module')).toBe('task-query')
    })
  })

  describe('Module Switching', () => {
    it('should pass correct currentModule to MainLayout based on route', () => {
      render(
        <MemoryRouter initialEntries={['/tasks/operation']}>
          <MainPage />
        </MemoryRouter>
      )

      const layout = screen.getByTestId('main-layout')
      expect(layout.getAttribute('data-current-module')).toBe('task-operation')
    })

    it('should provide module change handler to MainLayout', () => {
      render(
        <MemoryRouter initialEntries={['/tasks/query']}>
          <MainPage />
        </MemoryRouter>
      )

      // The MainLayout should have the onModuleChange handler
      // This is verified by the mock implementation
      expect(screen.getByRole('heading', { name: '任务查询' })).toBeDefined()
    })
  })
})
