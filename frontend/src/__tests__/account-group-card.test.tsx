import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AccountGroupCard } from '@/components/dashboard/account-group-card'
import { ThemeProvider } from '@/hooks/use-theme'
import { testAccountGroups } from '@/test-utils/test-data-factory'

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>)
}

describe('AccountGroupCard Component', () => {
  it('should render group name', () => {
    renderWithTheme(<AccountGroupCard group={testAccountGroups.emergencyFund} />)
    expect(screen.getByText('Emergency Fund')).toBeInTheDocument()
  })

  it('should render total balance', () => {
    renderWithTheme(<AccountGroupCard group={testAccountGroups.emergencyFund} />)
    expect(screen.getByText(/25000.00/)).toBeInTheDocument()
  })

  it('should render balance history sparkline when enabled', () => {
    renderWithTheme(
      <AccountGroupCard
        group={testAccountGroups.emergencyFund}
        showSparkline
      />
    )
    // Sparkline uses canvas, not img in the current implementation
    const canvas = document.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
  })

  it('should not render sparkline when disabled', () => {
    renderWithTheme(
      <AccountGroupCard
        group={testAccountGroups.emergencyFund}
        showSparkline={false}
      />
    )
    const canvas = document.querySelector('canvas')
    expect(canvas).not.toBeInTheDocument()
  })

  it('should render loading state', () => {
    renderWithTheme(
      <AccountGroupCard
        group={testAccountGroups.emergencyFund}
        loading
      />
    )
    const skeleton = document.querySelector('.animate-pulse')
    expect(skeleton).toBeInTheDocument()
  })

  it('should render as link when href provided', () => {
    renderWithTheme(
      <AccountGroupCard
        group={testAccountGroups.emergencyFund}
        href="/groups/1"
      />
    )
    const link = screen.getByText('Emergency Fund').closest('a')
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/groups/1')
  })

  it('should handle onClick callback', () => {
    const handleClick = vi.fn()
    renderWithTheme(
      <AccountGroupCard
        group={testAccountGroups.emergencyFund}
        onClick={handleClick}
      />
    )
    const card = screen.getByText('Emergency Fund').closest('.glass-card')
    card?.click()
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should render empty group with zero balance', () => {
    renderWithTheme(<AccountGroupCard group={testAccountGroups.empty} />)
    expect(screen.getByText(/£0.00/)).toBeInTheDocument()
  })
})

