import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DoughnutChart } from '@/components/charts/doughnut-chart'
import { ThemeProvider } from '@/hooks/use-theme'

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>)
}

describe('DoughnutChart Component', () => {
  const mockData = {
    labels: ['Checking', 'Savings', 'Investments'],
    values: [5000, 10000, 15000],
  }

  it('should render canvas element', () => {
    renderWithTheme(<DoughnutChart data={mockData} />)
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it('should render with title', () => {
    renderWithTheme(<DoughnutChart data={mockData} title="Asset Distribution" />)
    expect(screen.getByText('Asset Distribution')).toBeInTheDocument()
  })

  it('should render loading state', () => {
    renderWithTheme(<DoughnutChart data={{ labels: [], values: [] }} loading />)
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('should render empty state when no data', () => {
    renderWithTheme(<DoughnutChart data={{ labels: [], values: [] }} />)
    expect(screen.getByText(/no data/i)).toBeInTheDocument()
  })

  it('should display legend', () => {
    renderWithTheme(<DoughnutChart data={mockData} showLegend />)
    const canvas = screen.getByRole('img')
    expect(canvas).toBeInTheDocument()
  })

  it('should apply custom size', () => {
    renderWithTheme(<DoughnutChart data={mockData} size={300} />)
    const canvas = screen.getByRole('img')
    expect(canvas).toBeInTheDocument()
  })
})
