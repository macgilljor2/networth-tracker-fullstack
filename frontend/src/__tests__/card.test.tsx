import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card } from '@/components/ui/card'
import { ThemeProvider } from '@/hooks/use-theme'

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>)
}

describe('Card Component', () => {
  it('should render card container', () => {
    renderWithTheme(<Card>Card content</Card>)
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  it('should render with title', () => {
    renderWithTheme(<Card title="Card Title">Content</Card>)
    expect(screen.getByText('Card Title')).toBeInTheDocument()
  })

  it('should apply default variant styles', () => {
    renderWithTheme(<Card>Content</Card>)
    const card = screen.getByText('Content').parentElement
    expect(card?.className).toContain('bg-white')
  })

  it('should apply account variant when specified', () => {
    renderWithTheme(<Card variant="account">Content</Card>)
    const card = screen.getByText('Content').parentElement
    expect(card?.className).toContain('hover:shadow-glow')
  })

  it('should apply group variant when specified', () => {
    renderWithTheme(<Card variant="group">Content</Card>)
    const card = screen.getByText('Content').parentElement
    expect(card?.className).toContain('border-l-4')
  })

  it('should apply custom className', () => {
    renderWithTheme(<Card className="custom-class">Content</Card>)
    const card = screen.getByText('Content').parentElement
    expect(card?.className).toContain('custom-class')
  })

  it('should be clickable when onClick is provided', () => {
    let clicked = false
    const handleClick = () => { clicked = true }
    renderWithTheme(<Card onClick={handleClick}>Click me</Card>)
    screen.getByText('Click me').click()
    expect(clicked).toBe(true)
  })

  it('should render header and content separately', () => {
    renderWithTheme(
      <Card
        header={<h1 data-testid="header">Header</h1>}
      >
        <p data-testid="content">Content</p>
      </Card>
    )
    expect(screen.getByTestId('header')).toBeInTheDocument()
    expect(screen.getByTestId('content')).toBeInTheDocument()
  })

  it('should render footer', () => {
    renderWithTheme(
      <Card
        footer={<button data-testid="footer">Footer</button>}
      >
        Content
      </Card>
    )
    expect(screen.getByTestId('footer')).toBeInTheDocument()
  })
})
