import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeSelector } from '@/components/settings/theme-selector'
import { ThemeProvider } from '@/hooks/use-theme'

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>)
}

describe('ThemeSelector Component', () => {
  it('should render theme options', () => {
    renderWithTheme(<ThemeSelector currentTheme="beige" onThemeChange={() => {}} />)
    expect(screen.getByText('Beige')).toBeInTheDocument()
    expect(screen.getByText('Light')).toBeInTheDocument()
    expect(screen.getByText('Dark')).toBeInTheDocument()
  })

  it('should highlight current theme', () => {
    renderWithTheme(<ThemeSelector currentTheme="beige" onThemeChange={() => {}} />)
    const beigeOption = screen.getByText('Beige').closest('.border-green-600')
    expect(beigeOption).toBeInTheDocument()
  })

  it('should call onThemeChange when theme is clicked', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    renderWithTheme(<ThemeSelector currentTheme="beige" onThemeChange={handleChange} />)

    const lightOption = screen.getByText('Light')
    await user.click(lightOption)

    expect(handleChange).toHaveBeenCalledWith('light')
  })
})
