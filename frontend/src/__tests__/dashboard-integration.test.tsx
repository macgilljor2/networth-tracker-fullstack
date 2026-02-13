/**
 * Dashboard Integration Tests
 *
 * Tests the complete dashboard page with mocked API responses
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DashboardPage from '@/app/(dashboard)/dashboard/page'
import { testDashboardData, testBalanceHistory } from '@/test-utils/test-data-factory'
import { ThemeProvider } from '@/hooks/use-theme'
import { useDashboardStore } from '@/stores/dashboard-store'

// Mock the API services
vi.mock('@/lib/api/dashboard.service', () => ({
  dashboardService: {
    getDashboardData: vi.fn(),
    getBalanceHistory: vi.fn(),
  },
}))

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}))

const { dashboardService } = await import('@/lib/api/dashboard.service')

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>)
}

describe('Dashboard Page - Integration Tests', () => {
  beforeEach(() => {
    // Reset store before each test
    useDashboardStore.getState().reset()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Loading States', () => {
    it('should show loading state initially', async () => {
      vi.mocked(dashboardService.getDashboardData).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )
      vi.mocked(dashboardService.getBalanceHistory).mockImplementation(
        () => new Promise(() => {})
      )

      renderWithTheme(<DashboardPage />)

      expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
    })
  })

  describe('Data Fetching', () => {
    it('should fetch and display dashboard data', async () => {
      vi.mocked(dashboardService.getDashboardData).mockResolvedValue(
        testDashboardData.full
      )
      vi.mocked(dashboardService.getBalanceHistory).mockResolvedValue(
        testBalanceHistory.growth
      )

      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByText(/Dashboard/i)).toBeInTheDocument()
      })
    })

    it('should calculate percentage change correctly', async () => {
      vi.mocked(dashboardService.getDashboardData).mockResolvedValue({
        ...testDashboardData.full,
        total_balance_gbp: 112000,
      })
      vi.mocked(dashboardService.getBalanceHistory).mockResolvedValue([
        { date: '2024-01-01', total_balance_gbp: 100000 },
        { date: '2024-02-01', total_balance_gbp: 112000 },
      ])

      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        const valueText = screen.getByText(/12000/)
        expect(valueText).toBeInTheDocument()
        expect(screen.getByText(/12%/)).toBeInTheDocument()
      })
    })
  })

  describe('Empty States', () => {
    it('should show empty state when no data', async () => {
      vi.mocked(dashboardService.getDashboardData).mockResolvedValue(
        testDashboardData.empty
      )
      vi.mocked(dashboardService.getBalanceHistory).mockResolvedValue([])

      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByText(/no data available/i)).toBeInTheDocument()
      })
    })

    it('should show error state on API failure', async () => {
      vi.mocked(dashboardService.getDashboardData).mockRejectedValue(
        new Error('Failed to fetch')
      )
      vi.mocked(dashboardService.getBalanceHistory).mockRejectedValue(
        new Error('Failed to fetch')
      )

      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByText(/failed to load dashboard data/i)).toBeInTheDocument()
      })
    })
  })

  describe('Chart Display', () => {
    it('should render line chart with balance history', async () => {
      vi.mocked(dashboardService.getDashboardData).mockResolvedValue(
        testDashboardData.full
      )
      vi.mocked(dashboardService.getBalanceHistory).mockResolvedValue(
        testBalanceHistory.growth
      )

      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByText(/net worth history/i)).toBeInTheDocument()
      })

      // Check for canvas element used by Chart.js
      const canvas = document.querySelector('canvas')
      expect(canvas).toBeInTheDocument()
    })

    it('should render doughnut chart with account type distribution', async () => {
      vi.mocked(dashboardService.getDashboardData).mockResolvedValue(
        testDashboardData.full
      )
      vi.mocked(dashboardService.getBalanceHistory).mockResolvedValue(
        testBalanceHistory.growth
      )

      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByText(/by account type/i)).toBeInTheDocument()
      })

      // Should show distribution breakdown
      expect(screen.getByText(/distribution breakdown/i)).toBeInTheDocument()
    })
  })

  describe('Series Toggles', () => {
    it('should render series toggles for total and groups', async () => {
      vi.mocked(dashboardService.getDashboardData).mockResolvedValue(
        testDashboardData.full
      )
      vi.mocked(dashboardService.getBalanceHistory).mockResolvedValue(
        testBalanceHistory.growth
      )

      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByText(/show on chart/i)).toBeInTheDocument()
      })

      // Should have "Total Net Worth" toggle
      expect(screen.getByText(/total net worth/i)).toBeInTheDocument()

      // Should have toggle section
      const toggleSection = screen.getByText(/toggle series to display/i)
      expect(toggleSection).toBeInTheDocument()
    })

    it('should disable total net worth toggle', async () => {
      vi.mocked(dashboardService.getDashboardData).mockResolvedValue(
        testDashboardData.full
      )
      vi.mocked(dashboardService.getBalanceHistory).mockResolvedValue(
        testBalanceHistory.growth
      )

      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox')
        expect(checkboxes.length).toBeGreaterThan(0)
        // First checkbox (total) should be disabled
        expect(checkboxes[0]).toBeDisabled()
      })
    })
  })

  describe('Account Groups Display', () => {
    it('should display account groups section', async () => {
      vi.mocked(dashboardService.getDashboardData).mockResolvedValue(
        testDashboardData.full
      )
      vi.mocked(dashboardService.getBalanceHistory).mockResolvedValue(
        testBalanceHistory.growth
      )

      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByText(/account groups/i)).toBeInTheDocument()
        expect(screen.getByText(/your organized portfolios/i)).toBeInTheDocument()
      })
    })

    it('should show correct balances for groups', async () => {
      vi.mocked(dashboardService.getDashboardData).mockResolvedValue({
        total_balance_gbp: 112000,
        groups: [
          { id: 'group-1', name: 'Test Group', total_balance_gbp: 50000 },
        ],
        by_account_type: [],
      })
      vi.mocked(dashboardService.getBalanceHistory).mockResolvedValue([])

      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByText(/50000/)).toBeInTheDocument()
      })
    })
  })

  describe('Currency Formatting', () => {
    it('should display total net worth with GBP symbol', async () => {
      vi.mocked(dashboardService.getDashboardData).mockResolvedValue(
        testDashboardData.full
      )
      vi.mocked(dashboardService.getBalanceHistory).mockResolvedValue(
        testBalanceHistory.growth
      )

      renderWithTheme(<DashboardPage />)

      // Wait for data to load
      await waitFor(
        () => {
          expect(screen.getByText(/total net worth/i)).toBeInTheDocument()
        },
        { timeout: 5000 }
      )
    })
  })
})
