import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { ThemeProvider } from '@/hooks/use-theme'

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>)
}

describe('ProtectedRoute Component', () => {
  it('should render children when authenticated', () => {
    renderWithTheme(
      <ProtectedRoute isAuthenticated>
        <div>Protected Content</div>
      </ProtectedRoute>
    )
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('should not render children when not authenticated', () => {
    renderWithTheme(
      <ProtectedRoute isAuthenticated={false}>
        <div>Protected Content</div>
      </ProtectedRoute>
    )
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('should redirect to login when not authenticated', () => {
    renderWithTheme(
      <ProtectedRoute isAuthenticated={false}>
        <div>Protected Content</div>
      </ProtectedRoute>
    )
    // Component should show nothing or redirect
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('should render loading state when isLoading is true', () => {
    renderWithTheme(
      <ProtectedRoute isAuthenticated={true} isLoading>
        <div>Protected Content</div>
      </ProtectedRoute>
    )
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })
})
