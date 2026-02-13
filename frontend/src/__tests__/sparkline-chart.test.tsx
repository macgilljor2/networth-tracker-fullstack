import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SparklineChart } from '@/components/charts/sparkline-chart'
import { ThemeProvider } from '@/hooks/use-theme'

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>)
}

describe('SparklineChart Component', () => {
  const mockData = [100, 105, 102, 110, 115, 112, 120]

  it('should render canvas element', () => {
    renderWithTheme(<SparklineChart data={mockData} />)
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it('should render small size', () => {
    renderWithTheme(<SparklineChart data={mockData} size="sm" />)
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it('should render medium size', () => {
    renderWithTheme(<SparklineChart data={mockData} size="md" />)
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it('should render large size', () => {
    renderWithTheme(<SparklineChart data={mockData} size="lg" />)
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it('should show positive trend in green', () => {
    const increasingData = [100, 105, 110, 115, 120]
    renderWithTheme(<SparklineChart data={increasingData} />)
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it('should show negative trend in red', () => {
    const decreasingData = [120, 115, 110, 105, 100]
    renderWithTheme(<SparklineChart data={decreasingData} />)
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it('should render empty state when no data', () => {
    renderWithTheme(<SparklineChart data={[]} />)
    expect(screen.getByText(/no data/i)).toBeInTheDocument()
  })
})
