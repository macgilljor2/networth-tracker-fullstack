import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RegisterForm } from '@/components/forms/register-form'
import { ThemeProvider } from '@/hooks/use-theme'

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>)
}

describe('RegisterForm Component', () => {
  it('should render username input', () => {
    renderWithTheme(<RegisterForm onSubmit={vi.fn()} />)
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
  })

  it('should render email input', () => {
    renderWithTheme(<RegisterForm onSubmit={vi.fn()} />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })

  it('should render password input', () => {
    renderWithTheme(<RegisterForm onSubmit={vi.fn()} />)
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
  })

  it('should render confirm password input', () => {
    renderWithTheme(<RegisterForm onSubmit={vi.fn()} />)
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
  })

  it('should render submit button', () => {
    renderWithTheme(<RegisterForm onSubmit={vi.fn()} />)
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument()
  })

  it('should render login link', () => {
    renderWithTheme(<RegisterForm onSubmit={vi.fn()} />)
    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument()
  })

  it('should call onSubmit with form data', async () => {
    const user = userEvent.setup()
    const handleSubmit = vi.fn()
    renderWithTheme(<RegisterForm onSubmit={handleSubmit} />)

    await user.type(screen.getByLabelText(/username/i), 'testuser')
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'password123')
    await user.click(screen.getByRole('checkbox')) // accept terms
    await user.click(screen.getByRole('button', { name: /register/i }))

    expect(handleSubmit).toHaveBeenCalled()
    const submittedData = handleSubmit.mock.calls[0][0]
    expect(submittedData.username).toBe('testuser')
    expect(submittedData.email).toBe('test@example.com')
    expect(submittedData.password).toBe('password123')
    expect(submittedData.confirmPassword).toBe('password123')
  })

  it('should show validation errors for empty fields', async () => {
    const user = userEvent.setup()
    renderWithTheme(<RegisterForm onSubmit={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /register/i }))

    expect(await screen.findByText(/username is required/i)).toBeInTheDocument()
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument()
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument()
  })

  it('should show error when passwords do not match', async () => {
    const user = userEvent.setup()
    renderWithTheme(<RegisterForm onSubmit={vi.fn()} />)

    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'different')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /register/i }))

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument()
  })

  it('should show error message when provided', () => {
    renderWithTheme(<RegisterForm onSubmit={vi.fn()} error="Username already exists" />)
    expect(screen.getByText(/username already exists/i)).toBeInTheDocument()
  })

  it('should be disabled when loading', () => {
    renderWithTheme(<RegisterForm onSubmit={vi.fn()} loading />)
    expect(screen.getByRole('button', { name: /register/i })).toBeDisabled()
  })
})
