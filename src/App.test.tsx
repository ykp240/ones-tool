import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

// Mock the AuthContext
vi.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
    login: vi.fn(),
    logout: vi.fn(),
    loading: false,
    error: null,
  }),
}))

// Mock the pages
vi.mock('./pages', () => ({
  LoginPage: () => <div data-testid="login-page">Login Page</div>,
  MainPage: () => <div data-testid="main-page">Main Page</div>,
}))

describe('App Routing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Protected Routes', () => {
    it('should redirect to login when accessing protected route without authentication', async () => {
      const { useAuth } = await import('./contexts/AuthContext')
      vi.mocked(useAuth).mockReturnValue({
        isAuthenticated: false,
        user: null,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false,
        error: null,
      })

      render(<App />)

      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeDefined()
      })
    })

    it('should allow access to protected routes when authenticated', async () => {
      const { useAuth } = await import('./contexts/AuthContext')
      vi.mocked(useAuth).mockReturnValue({
        isAuthenticated: true,
        user: { uuid: '1', name: 'Test User', email: 'test@example.com' },
        login: vi.fn(),
        logout: vi.fn(),
        loading: false,
        error: null,
      })

      render(<App />)

      await waitFor(() => {
        expect(screen.getByTestId('main-page')).toBeDefined()
      })
    })
  })

  describe('Public Routes', () => {
    it('should redirect to main page when accessing login while authenticated', async () => {
      const { useAuth } = await import('./contexts/AuthContext')
      vi.mocked(useAuth).mockReturnValue({
        isAuthenticated: true,
        user: { uuid: '1', name: 'Test User', email: 'test@example.com' },
        login: vi.fn(),
        logout: vi.fn(),
        loading: false,
        error: null,
      })

      // Start at /login
      render(
        <MemoryRouter initialEntries={['/login']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByTestId('main-page')).toBeDefined()
      })
    })
  })

  describe('Route Navigation', () => {
    it('should handle unknown routes by redirecting to main page', async () => {
      const { useAuth } = await import('./contexts/AuthContext')
      vi.mocked(useAuth).mockReturnValue({
        isAuthenticated: true,
        user: { uuid: '1', name: 'Test User', email: 'test@example.com' },
        login: vi.fn(),
        logout: vi.fn(),
        loading: false,
        error: null,
      })

      // Start at an unknown route
      render(
        <MemoryRouter initialEntries={['/unknown-route']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByTestId('main-page')).toBeDefined()
      })
    })
  })
})
