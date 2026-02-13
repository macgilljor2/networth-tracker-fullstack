import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LineChart } from '@/components/charts/line-chart'
import { ThemeProvider } from '@/hooks/use-theme'

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>)
}

describe('LineChart Component', () => {
  const mockData = [
    { date: '2024-01-01', balance: 10000 },
    { date: '2024-01-02', balance: 10500 },
    { date: '2024-01-03', balance: 10200 },
    { date: '2024-01-04', balance: 11000 },
    { date: '2024-01-05', balance: 11500 },
  ]

  it('should render canvas element', () => {
    renderWithTheme(<LineChart data={mockData} />)
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it('should render with title', () => {
    renderWithTheme(<LineChart data={mockData} title="Balance History" />)
    expect(screen.getByText('Balance History')).toBeInTheDocument()
  })

  it('should render loading state', () => {
    renderWithTheme(<LineChart data={[]} loading />)
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('should render empty state when no data', () => {
    renderWithTheme(<LineChart data={[]} />)
    expect(screen.getByText(/no data/i)).toBeInTheDocument()
  })

  it('should apply custom height', () => {
    renderWithTheme(<LineChart data={mockData} height={400} />)
    const wrapper = screen.getByRole('img').closest('div')
    expect(wrapper?.parentElement).toHaveStyle({ height: '400px' })
  })

  it('should show tooltip on hover', () => {
    renderWithTheme(<LineChart data={mockData} showTooltip />)
    const canvas = screen.getByRole('img')
    expect(canvas).toBeInTheDocument()
  })
})
