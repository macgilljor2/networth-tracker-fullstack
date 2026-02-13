import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AccountCard } from '@/components/accounts/account-card'
import { ThemeProvider } from '@/hooks/use-theme'

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>)
}

describe('AccountCard Component', () => {
  const mockAccount = {
    id: '1',
    name: 'Checking Account',
    account_type: 'checking',
    currency: 'USD',
    current_balance: 5000,
    balance_count: 10,
  }

  it('should render account name', () => {
    renderWithTheme(<AccountCard account={mockAccount} />)
    expect(screen.getByText('Checking Account')).toBeInTheDocument()
  })

  it('should render account type', () => {
    renderWithTheme(<AccountCard account={mockAccount} />)
    const badge = document.querySelector('.inline-flex')
    expect(badge?.textContent).toBe('checking')
  })

  it('should render current balance', () => {
    renderWithTheme(<AccountCard account={mockAccount} />)
    expect(screen.getByText(/\$5,000/)).toBeInTheDocument()
  })

  it('should render balance count', () => {
    renderWithTheme(<AccountCard account={mockAccount} />)
    expect(screen.getByText(/10 balances/i)).toBeInTheDocument()
  })

  it('should be clickable when href is provided', () => {
    renderWithTheme(<AccountCard account={mockAccount} href="/accounts/1" />)
    const link = screen.getByText('Checking Account').closest('a')
    expect(link).toHaveAttribute('href', '/accounts/1')
  })

  it('should render loading state', () => {
    renderWithTheme(<AccountCard account={mockAccount} loading />)
    const skeleton = document.querySelector('.animate-pulse')
    expect(skeleton).toBeInTheDocument()
  })
})
