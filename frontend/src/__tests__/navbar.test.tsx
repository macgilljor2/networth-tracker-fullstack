import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Navbar } from '@/components/layout/navbar'
import { ThemeProvider } from '@/hooks/use-theme'

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>)
}

describe('Navbar Component', () => {
  it('should render navigation bar', () => {
    renderWithTheme(<Navbar />)
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('should render logo', () => {
    renderWithTheme(<Navbar />)
    expect(screen.getByText(/net worth/i)).toBeInTheDocument()
  })

  it('should render navigation links when authenticated', () => {
    renderWithTheme(<Navbar isAuthenticated />)
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
    expect(screen.getByText(/accounts/i)).toBeInTheDocument()
    expect(screen.getByText(/groups/i)).toBeInTheDocument()
  })

  it('should not render protected links when not authenticated', () => {
    renderWithTheme(<Navbar isAuthenticated={false} />)
    expect(screen.queryByText(/dashboard/i)).not.toBeInTheDocument()
  })

  it('should render login and register links when not authenticated', () => {
    renderWithTheme(<Navbar isAuthenticated={false} />)
    expect(screen.getByText(/login/i)).toBeInTheDocument()
    expect(screen.getByText(/register/i)).toBeInTheDocument()
  })

  it('should render user menu when authenticated', () => {
    renderWithTheme(<Navbar isAuthenticated username="testuser" />)
    expect(screen.getByText(/testuser/i)).toBeInTheDocument()
  })

  it('should render logout button when authenticated', () => {
    const handleLogout = vi.fn()
    renderWithTheme(<Navbar isAuthenticated onLogout={handleLogout} />)
    expect(screen.getByText(/logout/i)).toBeInTheDocument()
  })

  it('should call logout handler when logout is clicked', async () => {
    const handleLogout = vi.fn()
    renderWithTheme(<Navbar isAuthenticated onLogout={handleLogout} />)
    const logoutBtn = screen.getByText(/logout/i)
    logoutBtn.click()
    expect(handleLogout).toHaveBeenCalled()
  })
})
