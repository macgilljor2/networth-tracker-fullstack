'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { themes, DEFAULT_THEME, Theme } from '@/styles/themes'

interface ThemeContextType {
  theme: string
  setTheme: (theme: string) => void
  currentTheme: Theme
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState(DEFAULT_THEME)

  useEffect(() => {
    // Load theme from localStorage on mount
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme && themes[savedTheme]) {
      setThemeState(savedTheme)
    } else {
      // Clear old theme value if it doesn't exist
      localStorage.removeItem('theme')
    }

    // Apply CSS variables
    applyTheme(savedTheme && themes[savedTheme] ? savedTheme : DEFAULT_THEME)
  }, [])

  const setTheme = (newTheme: string) => {
    if (themes[newTheme]) {
      setThemeState(newTheme)
      localStorage.setItem('theme', newTheme)
      applyTheme(newTheme)
    } else {
      console.warn(`Theme "${newTheme}" not found, using default theme`)
      setThemeState(DEFAULT_THEME)
      localStorage.setItem('theme', DEFAULT_THEME)
      applyTheme(DEFAULT_THEME)
    }
  }

  const currentTheme = themes[theme]

  return (
    <ThemeContext.Provider value={{ theme, setTheme, currentTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

function applyTheme(themeName: string) {
  const theme = themes[themeName]
  const root = document.documentElement

  // Apply all theme colors as CSS variables
  // Primary/accent colors
  root.style.setProperty('--color-primary', theme.colors.primary)
  root.style.setProperty('--color-primary-hover', theme.colors.primaryHover)
  root.style.setProperty('--color-primary-light', theme.colors.primaryLight)
  root.style.setProperty('--color-primary-bg', theme.colors.primaryBg)
  root.style.setProperty('--color-accent', theme.colors.accent)
  root.style.setProperty('--color-accent-hover', theme.colors.accentHover)
  root.style.setProperty('--color-accent-bg', theme.colors.accentBg)

  // Backgrounds
  root.style.setProperty('--color-bg-primary', theme.colors.bgPrimary)
  root.style.setProperty('--color-bg-secondary', theme.colors.bgSecondary)
  root.style.setProperty('--color-bg-card', theme.colors.bgCard)

  // Text colors
  root.style.setProperty('--color-text-primary', theme.colors.textPrimary)
  root.style.setProperty('--color-text-secondary', theme.colors.textSecondary)
  root.style.setProperty('--color-text-muted', theme.colors.textMuted)

  // Borders
  root.style.setProperty('--color-border', theme.colors.border)
  root.style.setProperty('--color-border-light', theme.colors.borderLight)

  // Buttons
  root.style.setProperty('--color-btn-primary', theme.colors.btnPrimary)
  root.style.setProperty('--color-btn-primary-hover', theme.colors.btnPrimaryHover)
  root.style.setProperty('--color-btn-secondary', theme.colors.btnSecondary)
  root.style.setProperty('--color-btn-secondary-bg', theme.colors.btnSecondaryBg)

  // Legacy variable names for backward compatibility
  root.style.setProperty('--green-accent', theme.colors.primary)
  root.style.setProperty('--green-dark', theme.colors.primaryHover)
  root.style.setProperty('--terracotta', theme.colors.accent)
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
