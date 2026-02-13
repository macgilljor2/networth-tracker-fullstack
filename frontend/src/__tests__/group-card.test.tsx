import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GroupCard } from '@/components/groups/group-card'
import { ThemeProvider } from '@/hooks/use-theme'

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>)
}

describe('GroupCard Component', () => {
  const mockGroup = {
    id: '1',
    name: 'Emergency Fund',
    description: 'Savings for emergencies',
    _account_count: 3,
    _total_balance: 15000,
  }

  it('should render group name', () => {
    renderWithTheme(<GroupCard group={mockGroup} />)
    expect(screen.getByText('Emergency Fund')).toBeInTheDocument()
  })

  it('should render description when provided', () => {
    renderWithTheme(<GroupCard group={mockGroup} />)
    expect(screen.getByText('Savings for emergencies')).toBeInTheDocument()
  })

  it('should render account count', () => {
    renderWithTheme(<GroupCard group={mockGroup} />)
    expect(screen.getByText(/3 accounts/i)).toBeInTheDocument()
  })

  it('should render total balance', () => {
    renderWithTheme(<GroupCard group={mockGroup} />)
    expect(screen.getByText(/\$15,000/)).toBeInTheDocument()
  })

  it('should render sparkline chart when enabled', () => {
    renderWithTheme(<GroupCard group={mockGroup} showSparkline sparklineData={[1000, 2000, 3000, 4000, 5000]} />)
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it('should call onClick when clicked', () => {
    const handleClick = () => {}
    renderWithTheme(<GroupCard group={mockGroup} onClick={handleClick} />)
    const card = screen.getByText('Emergency Fund').closest('.cursor-pointer')
    expect(card).toBeInTheDocument()
  })
})
