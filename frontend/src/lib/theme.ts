export const themes = {
  forest: {
    name: 'Forest Green',
    colors: {
      primary: '#2d5a27',
      primaryHover: '#1e3d1a',
      primaryLight: '#5a8f5a',
      primaryBg: 'rgba(90, 143, 90, 0.1)',
      primaryBgSolid: 'rgba(90, 143, 90, 0.2)',
      accent: '#c17f59',
    }
  },
  ocean: {
    name: 'Ocean Blue',
    colors: {
      primary: '#1e40af',
      primaryHover: '#1e3a8a',
      primaryLight: '#3b82f6',
      primaryBg: 'rgba(59, 130, 246, 0.1)',
      primaryBgSolid: 'rgba(59, 130, 246, 0.2)',
      accent: '#f59e0b',
    }
  },
  plum: {
    name: 'Plum Purple',
    colors: {
      primary: '#7c3aed',
      primaryHover: '#6d28d9',
      primaryLight: '#a78bfa',
      primaryBg: 'rgba(167, 139, 250, 0.1)',
      primaryBgSolid: 'rgba(167, 139, 250, 0.2)',
      accent: '#f59e0b',
    }
  }
}

export type ThemeName = keyof typeof themes
export type ThemeColors = typeof themes.forest.colors

export const defaultTheme: ThemeName = 'forest'

export function getTheme(themeName: ThemeName): ThemeColors {
  return themes[themeName]?.colors || themes.forest.colors
}
