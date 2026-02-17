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

    // Color palette for groups, charts, etc.
    palette: string[]
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

      palette: ['#2d5a27', '#c17f59', '#7d8471', '#a6926a', '#6b8e23', '#8b7355'],
    },
  },

  // Neon Night - Dark with neon accents
  neon: {
    name: 'Neon Night',
    description: 'Dark cyberpunk with vibrant neon pink, cyan and yellow accents',
    colors: {
      primary: '#ff006e', // Neon pink
      primaryHover: '#d6005c',
      primaryLight: '#ff3385',
      primaryBg: 'rgba(255, 0, 110, 0.15)',
      accent: '#00f5d4', // Neon cyan
      accentHover: '#00d4b8',
      accentBg: 'rgba(0, 245, 212, 0.15)',

      bgPrimary: '#0a0e27', // Very dark blue-black
      bgSecondary: '#151b3d', // Dark navy
      bgCard: '#1a1f3a', // Slightly lighter navy

      textPrimary: '#ffffff', // Pure white
      textSecondary: '#b8b8d1', // Light gray-blue
      textMuted: '#6b6b8a', // Muted gray-blue

      border: '#2a2f5a', // Dark navy border
      borderLight: '#1f2545',

      btnPrimary: '#ff006e',
      btnPrimaryHover: '#d6005c',
      btnSecondary: '#00f5d4',
      btnSecondaryBg: 'rgba(0, 245, 212, 0.15)',

      palette: ['#ff006e', '#00f5d4', '#ffe600', '#8338ec', '#3a86ff', '#fb5607'],
    },
  },

  // Forest Night - Dark nature tones
  forest: {
    name: 'Forest Night',
    description: 'Deep forest with earth tones, moss and autumn colors',
    colors: {
      primary: '#2d5a27', // Rich forest green
      primaryHover: '#1e3d1a',
      primaryLight: '#4a7c3d',
      primaryBg: 'rgba(45, 90, 39, 0.12)',
      accent: '#c17f59', // Terracotta
      accentHover: '#a36547',
      accentBg: 'rgba(193, 127, 89, 0.12)',

      bgPrimary: '#0d1a0f', // Very dark green
      bgSecondary: '#152419', // Dark green-brown
      bgCard: '#1a2a1f', // Dark green-gray

      textPrimary: '#ffffff', // Pure white
      textSecondary: '#e8e8e8', // Off-white
      textMuted: '#b8b8b8', // Light gray

      border: '#3a5a3d', // Forest vine border
      borderLight: '#2a452d',

      btnPrimary: '#2d5a27',
      btnPrimaryHover: '#1e3d1a',
      btnSecondary: '#c17f59',
      btnSecondaryBg: 'rgba(193, 127, 89, 0.12)',

      palette: ['#2d5a27', '#c17f59', '#8b7355', '#6b8e23', '#9db4a0', '#d4a574'],
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

      palette: ['#6d5c4a', '#c17f59', '#8b7d6a', '#a6926a', '#7d6b5a', '#9a8a7a'],
    },
  },

  // Deep Cosmos - Light neutrals with deep royal purple and navy
  cosmos: {
    name: 'Deep Cosmos',
    description: 'Light sophisticated neutrals with deep royal purple and navy accents',
    colors: {
      primary: '#4c1d95', // Deep royal purple
      primaryHover: '#3b0d7e',
      primaryLight: '#6d28d9',
      primaryBg: 'rgba(76, 29, 149, 0.1)',
      accent: '#1e3a8a', // Deep navy
      accentHover: '#172554',
      accentBg: 'rgba(30, 58, 138, 0.1)',

      bgPrimary: '#f8fafc', // Very light slate
      bgSecondary: '#f1f5f9', // Light slate
      bgCard: '#ffffff', // White

      textPrimary: '#1e293b', // Dark slate
      textSecondary: '#475569', // Gray slate
      textMuted: '#94a3b8', // Muted slate

      border: '#e2e8f0', // Light slate border
      borderLight: '#f1f5f9',

      btnPrimary: '#4c1d95',
      btnPrimaryHover: '#3b0d7e',
      btnSecondary: '#1e3a8a',
      btnSecondaryBg: 'rgba(30, 58, 138, 0.1)',

      palette: ['#4c1d95', '#1e3a8a', '#5b21b6', '#0f172a', '#6366f1', '#475569'],
    },
  },
}

export const DEFAULT_THEME = 'beige'
