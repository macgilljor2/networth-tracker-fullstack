export interface Theme {
  name: string
  description: string
  colors: {
    // Primary color (buttons, links, highlights)
    primary: string
    primaryHover: string
    primaryLight: string
    primaryBg: string

    // Secondary/accent color
    accent: string
    accentHover: string
    accentBg: string

    // Backgrounds
    bgPrimary: string
    bgSecondary: string
    bgCard: string

    // Text colors
    textPrimary: string
    textSecondary: string
    textMuted: string

    // Borders
    border: string
    borderLight: string

    // Buttons
    btnPrimary: string
    btnPrimaryHover: string
    btnSecondary: string
    btnSecondaryBg: string
  }
}

export const themes: Record<string, Theme> = {
  // Beige & Earth - Warm neutrals with green and terracotta
  beige: {
    name: 'Beige & Earth',
    description: 'Warm neutrals with green accents and terracotta highlights',
    colors: {
      primary: '#2d5a27',
      primaryHover: '#1e3d1a',
      primaryLight: '#5a8f5a',
      primaryBg: 'rgba(45, 90, 39, 0.1)',
      accent: '#c17f59',
      accentHover: '#a36547',
      accentBg: 'rgba(193, 127, 89, 0.1)',

      bgPrimary: '#f4f5f2',
      bgSecondary: '#faf9f6',
      bgCard: '#faf8f5',

      textPrimary: '#3d3428',
      textSecondary: '#6d5c4a',
      textMuted: '#a89880',

      border: '#e5ddd3',
      borderLight: '#f5f0e8',

      btnPrimary: '#2d5a27',
      btnPrimaryHover: '#1e3d1a',
      btnSecondary: '#c17f59',
      btnSecondaryBg: 'rgba(193, 127, 89, 0.1)',
    },
  },

  // Scandinavian Night - Dark with gold accents
  scandi: {
    name: 'Scandinavian Night',
    description: 'Dark sophisticated with gold and mint accents',
    colors: {
      primary: '#d4a574',
      primaryHover: '#b8956a',
      primaryLight: '#e0c0a0',
      primaryBg: 'rgba(212, 165, 116, 0.12)',
      accent: '#9db4a0',
      accentHover: '#8a9f8d',
      accentBg: 'rgba(157, 180, 160, 0.12)',

      bgPrimary: '#2a2f35',
      bgSecondary: '#24282c',
      bgCard: '#2f343a',

      textPrimary: '#e8e4df',
      textSecondary: '#a8a49d',
      textMuted: '#7a7670',

      border: '#3d4148',
      borderLight: '#363a40',

      btnPrimary: '#d4a574',
      btnPrimaryHover: '#b8956a',
      btnSecondary: '#9db4a0',
      btnSecondaryBg: 'rgba(157, 180, 160, 0.12)',
    },
  },

  // Cappuccino & Stone - Warm coffee neutrals
  cappuccino: {
    name: 'Cappuccino & Stone',
    description: 'Warm coffee tones with stone neutrals - Clean, simple, luxury',
    colors: {
      primary: '#6d5c4a',
      primaryHover: '#5c4d3d',
      primaryLight: '#8b7d6a',
      primaryBg: 'rgba(109, 92, 74, 0.1)',
      accent: '#c17f59',
      accentHover: '#a36547',
      accentBg: 'rgba(193, 127, 89, 0.1)',

      bgPrimary: '#faf8f5',
      bgSecondary: '#f5f0e8',
      bgCard: '#faf8f5',

      textPrimary: '#3d3428',
      textSecondary: '#6d5c4a',
      textMuted: '#a89880',

      border: '#e5ddd3',
      borderLight: '#f5f0e8',

      btnPrimary: '#6d5c4a',
      btnPrimaryHover: '#5c4d3d',
      btnSecondary: '#a89880',
      btnSecondaryBg: 'rgba(168, 152, 128, 0.1)',
    },
  },
}

export const DEFAULT_THEME = 'beige'
