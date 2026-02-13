'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { themes, ThemeName, ThemeColors, defaultTheme } from '@/lib/theme'

interface ThemeContextType {
  theme: ThemeName
  themeColors: ThemeColors
  setTheme: (theme: ThemeName) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(defaultTheme)

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeName
    if (savedTheme && themes[savedTheme]) {
      setThemeState(savedTheme)
    }
  }, [])

  // Save theme to localStorage when it changes
  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)

    // Update CSS variables
    const colors = themes[newTheme].colors
    document.documentElement.style.setProperty('--color-primary', colors.primary)
    document.documentElement.style.setProperty('--color-primary-hover', colors.primaryHover)
    document.documentElement.style.setProperty('--color-primary-light', colors.primaryLight)
    document.documentElement.style.setProperty('--color-primary-bg', colors.primaryBg)
    document.documentElement.style.setProperty('--color-accent', colors.accent)
  }

  // Initialize CSS variables on mount and when theme changes
  useEffect(() => {
    const colors = themes[theme].colors
    document.documentElement.style.setProperty('--color-primary', colors.primary)
    document.documentElement.style.setProperty('--color-primary-hover', colors.primaryHover)
    document.documentElement.style.setProperty('--color-primary-light', colors.primaryLight)
    document.documentElement.style.setProperty('--color-primary-bg', colors.primaryBg)
    document.documentElement.style.setProperty('--color-accent', colors.accent)
  }, [theme])

  const themeColors = themes[theme].colors

  return (
    <ThemeContext.Provider value={{ theme, themeColors, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
