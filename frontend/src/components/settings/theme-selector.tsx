import React from 'react'
import { cn } from '@/lib/utils'

export interface ThemeSelectorProps {
  currentTheme: string
  onThemeChange: (theme: string) => void
}

const THEMES = [
  {
    id: 'beige',
    name: 'Beige & Earth',
    description: 'Warm neutrals with green and terracotta',
    preview: 'linear-gradient(135deg, #2d5a27 0%, #c17f59 100%)',
    bg: '#f4f5f2',
    accent: '#2d5a27',
  },
  {
    id: 'neon',
    name: 'Neon Night',
    description: 'Dark cyberpunk with vibrant neon accents',
    preview: 'linear-gradient(135deg, #ff006e 0%, #00f5d4 100%)',
    bg: '#0a0e27',
    accent: '#ff006e',
  },
  {
    id: 'cappuccino',
    name: 'Cappuccino & Stone',
    description: 'Warm coffee tones with stone neutrals',
    preview: 'linear-gradient(135deg, #6d5c4a 0%, #c17f59 100%)',
    bg: '#faf8f5',
    accent: '#6d5c4a',
  },
  {
    id: 'cosmos',
    name: 'Deep Cosmos',
    description: 'Light neutrals with deep purple and navy',
    preview: 'linear-gradient(135deg, #4c1d95 0%, #1e3a8a 100%)',
    bg: '#f8fafc',
    accent: '#4c1d95',
  },
  {
    id: 'forest',
    name: 'Forest Night',
    description: 'Deep forest with earth tones, moss and autumn colors',
    preview: 'linear-gradient(135deg, #2d5a27 0%, #c17f59 100%)',
    bg: '#1a2e1a',
    accent: '#2d5a27',
  },
]

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onThemeChange,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-primary">Theme</h3>
      <p className="text-sm text-secondary mb-4">Choose your style - all elements adjust automatically</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {THEMES.map((theme) => (
          <button
            key={theme.id}
            onClick={() => onThemeChange(theme.id)}
            className={cn(
              'p-5 rounded-xl border-2 text-center transition-all duration-300 cursor-pointer',
              'hover:shadow-lg hover:scale-[1.02]',
              currentTheme === theme.id
                ? 'border-primary shadow-md ring-2 ring-primary/10'
                : 'border-primary hover:border-primary'
            )}
            style={{
              backgroundColor: theme.bg,
            }}
          >
            {/* Preview Gradient */}
            <div
              className="h-3 rounded-lg mb-4 w-full"
              style={{ background: theme.preview }}
            ></div>

            {/* Accent Circle */}
            <div
              className="w-12 h-12 rounded-full border-2 border-white/20 shadow-sm mx-auto mb-3 flex items-center justify-center"
              style={{ backgroundColor: theme.accent }}
            >
              <span className="text-white font-bold text-lg">
                {theme.name[0]}
              </span>
            </div>

            <div className="font-semibold text-primary text-sm mb-1">{theme.name}</div>
            <div className="text-xs text-secondary">{theme.description}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
