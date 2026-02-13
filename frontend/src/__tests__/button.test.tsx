import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'
import { ThemeProvider } from '@/hooks/use-theme'

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>)
}

describe('Button Component', () => {
  it('should render button with text', () => {
    renderWithTheme(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })

  it('should apply primary variant by default', () => {
    renderWithTheme(<Button>Primary</Button>)
    const button = screen.getByRole('button')
    expect(button.className).toContain('bg-gradient-green')
  })

  it('should apply secondary variant when specified', () => {
    renderWithTheme(<Button variant="secondary">Secondary</Button>)
    const button = screen.getByRole('button')
    expect(button.className).toContain('border-2')
  })

  it('should apply danger variant when specified', () => {
    renderWithTheme(<Button variant="danger">Delete</Button>)
    const button = screen.getByRole('button')
    expect(button.className).toContain('bg-red')
  })

  it('should apply small size when specified', () => {
    renderWithTheme(<Button size="sm">Small</Button>)
    const button = screen.getByRole('button')
    expect(button.className).toContain('px-3')
  })

  it('should apply medium size by default', () => {
    renderWithTheme(<Button size="md">Medium</Button>)
    const button = screen.getByRole('button')
    expect(button.className).toContain('px-4')
  })

  it('should apply large size when specified', () => {
    renderWithTheme(<Button size="lg">Large</Button>)
    const button = screen.getByRole('button')
    expect(button.className).toContain('px-6')
  })

  it('should be disabled when disabled prop is true', () => {
    renderWithTheme(<Button disabled>Disabled</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('should show loading state when loading prop is true', () => {
    renderWithTheme(<Button loading>Loading</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button.className).toContain('disabled:opacity-50')
  })

  it('should handle click events', () => {
    let clicked = false
    const handleClick = () => { clicked = true }
    renderWithTheme(<Button onClick={handleClick}>Click</Button>)
    screen.getByRole('button').click()
    expect(clicked).toBe(true)
  })

  it('should not handle click when disabled', () => {
    let clicked = false
    const handleClick = () => { clicked = true }
    renderWithTheme(<Button onClick={handleClick} disabled>Click</Button>)
    screen.getByRole('button').click()
    expect(clicked).toBe(false)
  })

  it('should render with left icon', () => {
    renderWithTheme(<Button leftIcon={<span data-testid="left-icon">L</span>}>With Icon</Button>)
    expect(screen.getByTestId('left-icon')).toBeInTheDocument()
  })

  it('should render with right icon', () => {
    renderWithTheme(<Button rightIcon={<span data-testid="right-icon">R</span>}>With Icon</Button>)
    expect(screen.getByTestId('right-icon')).toBeInTheDocument()
  })
})
