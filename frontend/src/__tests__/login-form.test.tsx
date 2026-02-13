import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '@/components/forms/login-form'
import { ThemeProvider } from '@/hooks/use-theme'

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>)
}

describe('LoginForm Component', () => {
  it('should render email input', () => {
    renderWithTheme(<LoginForm onSubmit={vi.fn()} />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })

  it('should render password input', () => {
    renderWithTheme(<LoginForm onSubmit={vi.fn()} />)
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('should render submit button', () => {
    renderWithTheme(<LoginForm onSubmit={vi.fn()} />)
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })

  it('should render register link', () => {
    renderWithTheme(<LoginForm onSubmit={vi.fn()} />)
    expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument()
  })

  it('should call onSubmit with email and password', async () => {
    const user = userEvent.setup()
    const handleSubmit = vi.fn()
    renderWithTheme(<LoginForm onSubmit={handleSubmit} />)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /login/i }))

    expect(handleSubmit).toHaveBeenCalled()
    const submittedData = handleSubmit.mock.calls[0][0]
    expect(submittedData.email).toBe('test@example.com')
    expect(submittedData.password).toBe('password123')
  })

  it('should show validation errors for empty fields', async () => {
    const user = userEvent.setup()
    renderWithTheme(<LoginForm onSubmit={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /login/i }))

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument()
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument()
  })

  it('should show error message when provided', () => {
    renderWithTheme(<LoginForm onSubmit={vi.fn()} error="Invalid credentials" />)
    expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
  })

  it('should be disabled when loading', () => {
    renderWithTheme(<LoginForm onSubmit={vi.fn()} loading />)
    expect(screen.getByRole('button', { name: /login/i })).toBeDisabled()
  })
})
