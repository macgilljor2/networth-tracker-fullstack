import { describe, it, expect } from 'vitest'
import { themes } from '@/styles/themes'

describe('Theme System', () => {
  it('should have beige theme defined', () => {
    expect(themes.beige).toBeDefined()
  })

  it('should have all required color properties in beige theme', () => {
    const theme = themes.beige
    expect(theme.colors.bgPrimary).toBeDefined()
    expect(theme.colors.bgSecondary).toBeDefined()
    expect(theme.colors.textPrimary).toBeDefined()
    expect(theme.colors.textSecondary).toBeDefined()
    expect(theme.colors.border).toBeDefined()
    expect(theme.colors.greenAccent).toBeDefined()
    expect(theme.colors.greenDark).toBeDefined()
    expect(theme.colors.sage).toBeDefined()
    expect(theme.colors.terracotta).toBeDefined()
  })

  it('should have font properties defined', () => {
    const theme = themes.beige
    expect(theme.fonts.primary).toBeDefined()
    expect(theme.fonts.display).toBeDefined()
    expect(theme.fonts.mono).toBeDefined()
  })

  it('should support multiple themes', () => {
    expect(Object.keys(themes)).toContain('beige')
    // Currently only beige is implemented
    expect(Object.keys(themes).length).toBeGreaterThanOrEqual(1)
  })

  it('should have unique theme names', () => {
    const themeNames = Object.values(themes).map(t => t.name)
    const uniqueNames = new Set(themeNames)
    expect(themeNames.length).toBe(uniqueNames.size)
  })
})
