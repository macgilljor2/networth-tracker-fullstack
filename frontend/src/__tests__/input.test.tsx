import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '@/components/ui/input'
import { ThemeProvider } from '@/hooks/use-theme'

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>)
}

describe('Input Component', () => {
  it('should render input element', () => {
    renderWithTheme(<Input />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('should render with label', () => {
    renderWithTheme(<Input label="Username" />)
    expect(screen.getByText('Username')).toBeInTheDocument()
    expect(screen.getByLabelText('Username')).toBeInTheDocument()
  })

  it('should render with helper text', () => {
    renderWithTheme(<Input helperText="Enter your username" />)
    expect(screen.getByText('Enter your username')).toBeInTheDocument()
  })

  it('should render with error state', () => {
    renderWithTheme(<Input error errorText="This field is required" />)
    expect(screen.getByText('This field is required')).toBeInTheDocument()
  })

  it('should apply error styling', () => {
    renderWithTheme(<Input error />)
    const input = screen.getByRole('textbox')
    expect(input.className).toContain('border-red-500')
  })

  it('should be disabled when disabled prop is true', () => {
    renderWithTheme(<Input disabled />)
    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
  })

  it('should handle user input', async () => {
    const user = userEvent.setup()
    renderWithTheme(<Input />)
    const input = screen.getByRole('textbox') as HTMLInputElement

    await user.type(input, 'test input')
    expect(input.value).toBe('test input')
  })

  it('should render with left icon', () => {
    renderWithTheme(<Input leftIcon={<span data-testid="left-icon">@</span>} />)
    expect(screen.getByTestId('left-icon')).toBeInTheDocument()
  })

  it('should render with right icon', () => {
    renderWithTheme(<Input rightIcon={<span data-testid="right-icon">$</span>} />)
    expect(screen.getByTestId('right-icon')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    renderWithTheme(<Input className="custom-class" />)
    const input = screen.getByRole('textbox')
    expect(input.className).toContain('custom-class')
  })

  it('should forward ref', () => {
    const ref = { current: null as HTMLInputElement | null }
    renderWithTheme(<Input ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })
})
