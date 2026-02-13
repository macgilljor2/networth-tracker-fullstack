import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTheme, ThemeProvider } from '@/hooks/use-theme'

describe('useTheme Hook', () => {
  beforeEach(() => {
    // Reset to default theme before each test
    localStorage.clear()
  })

  it('should default to beige theme', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    })
    expect(result.current.theme).toBe('beige')
  })

  it('should return current theme name', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    })
    expect(result.current.theme).toBeDefined()
    expect(typeof result.current.theme).toBe('string')
  })

  it('should return setTheme function', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    })
    expect(result.current.setTheme).toBeDefined()
    expect(typeof result.current.setTheme).toBe('function')
  })

  it('should change theme when setTheme is called', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    })

    act(() => {
      result.current.setTheme('beige')
    })

    expect(result.current.theme).toBe('beige')
  })

  it('should return theme object', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    })
    expect(result.current.currentTheme).toBeDefined()
    expect(result.current.currentTheme.colors).toBeDefined()
    expect(result.current.currentTheme.fonts).toBeDefined()
  })
})
