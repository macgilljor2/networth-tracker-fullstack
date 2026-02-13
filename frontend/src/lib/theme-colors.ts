/**
 * Theme color utilities for accessing theme colors in components
 * All colors come from CSS variables set by ThemeProvider
 */

/**
 * Get a theme color value
 * @param colorKey - The color key (e.g., 'primary', 'textPrimary', 'bgCard', etc.)
 * @returns The CSS variable value to use
 */
export function getThemeColor(colorKey: keyof ThemeColors): string {
  const colorMap: Record<ThemeColors, string> = {
    primary: 'var(--color-primary)',
    primaryHover: 'var(--color-primary-hover)',
    primaryLight: 'var(--color-primary-light)',
    primaryBg: 'var(--color-primary-bg)',
    accent: 'var(--color-accent)',
    accentHover: 'var(--color-accent-hover)',
    accentBg: 'var(--color-accent-bg)',
    bgPrimary: 'var(--color-bg-primary)',
    bgSecondary: 'var(--color-bg-secondary)',
    bgCard: 'var(--color-bg-card)',
    textPrimary: 'var(--color-text-primary)',
    textSecondary: 'var(--color-text-secondary)',
    textMuted: 'var(--color-text-muted)',
    border: 'var(--color-border)',
    borderLight: 'var(--color-border-light)',
    btnPrimary: 'var(--color-btn-primary)',
    btnPrimaryHover: 'var(--color-btn-primary-hover)',
    btnSecondary: 'var(--color-btn-secondary)',
    btnSecondaryBg: 'var(--color-btn-secondary-bg)',
  }
  return colorMap[colorKey as ThemeColors]
}

export type ThemeColors =
  | 'primary'
  | 'primaryHover'
  | 'primaryLight'
  | 'primaryBg'
  | 'accent'
  | 'accentHover'
  | 'accentBg'
  | 'bgPrimary'
  | 'bgSecondary'
  | 'bgCard'
  | 'textPrimary'
  | 'textSecondary'
  | 'textMuted'
  | 'border'
  | 'borderLight'
  | 'btnPrimary'
  | 'btnPrimaryHover'
  | 'btnSecondary'
  | 'btnSecondaryBg'

/**
 * Common theme color combinations as style objects
 */
export const themeColors = {
  // Primary button styles
  primaryButton: {
    backgroundColor: 'var(--color-btn-primary)',
    color: '#fff',
    '&:hover': {
      backgroundColor: 'var(--color-btn-primary-hover)',
    },
  },
  secondaryButton: {
    backgroundColor: 'var(--color-btn-secondary-bg)',
    color: 'var(--color-btn-secondary)',
    border: `1px solid var(--color-btn-secondary)`,
    '&:hover': {
      backgroundColor: 'var(--color-btn-secondary-bg)',
    },
  },

  // Card backgrounds
  card: {
    backgroundColor: 'var(--color-bg-card)',
    borderColor: 'var(--color-border)',
  },

  // Text styles
  textPrimary: {
    color: 'var(--color-text-primary)',
  },
  textSecondary: {
    color: 'var(--color-text-secondary)',
  },
  textMuted: {
    color: 'var(--color-text-muted)',
  },

  // Border styles
  border: {
    borderColor: 'var(--color-border)',
  },
  borderLight: {
    borderColor: 'var(--color-border-light)',
  },
}
