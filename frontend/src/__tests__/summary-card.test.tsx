import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SummaryCard } from '@/components/dashboard/summary-card'
import { ThemeProvider } from '@/hooks/use-theme'

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>)
}

describe('SummaryCard Component', () => {
  it('should render title', () => {
    renderWithTheme(<SummaryCard title="Total Net Worth" value="$100,000" />)
    expect(screen.getByText('Total Net Worth')).toBeInTheDocument()
  })

  it('should render value', () => {
    renderWithTheme(<SummaryCard title="Total Net Worth" value="$100,000" />)
    expect(screen.getByText('$100,000')).toBeInTheDocument()
  })

  it('should render subtitle when provided', () => {
    renderWithTheme(<SummaryCard title="Total" value="$100,000" subtitle="+5% from last month" />)
    expect(screen.getByText('+5% from last month')).toBeInTheDocument()
  })

  it('should apply green tint variant', () => {
    renderWithTheme(<SummaryCard title="Total" value="$100,000" variant="green" />)
    const card = screen.getByText('$100,000').closest('.rounded-2xl')
    expect(card?.className).toContain('hover:shadow-glow')
  })

  it('should apply default variant', () => {
    renderWithTheme(<SummaryCard title="Total" value="$100,000" />)
    const card = screen.getByText('$100,000').closest('.rounded-2xl')
    expect(card?.className).toContain('glass-card')
  })

  it('should render loading state', () => {
    renderWithTheme(<SummaryCard title="Total" value="" loading />)
    const skeleton = document.querySelector('.animate-pulse')
    expect(skeleton).toBeInTheDocument()
  })
})
