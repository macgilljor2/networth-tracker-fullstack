import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dynamic theme colors from CSS variables - use these for theming
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          light: 'var(--color-primary-light)',
          bg: 'var(--color-primary-bg)',
        },
        // Accent color
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
          bg: 'var(--color-accent-bg)',
        },
        // Text colors
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
        // Background colors
        'bg-primary': 'var(--color-bg-primary)',
        'bg-secondary': 'var(--color-bg-secondary)',
        'bg-card': 'var(--color-bg-card)',
        // Border colors
        'border-primary': 'var(--color-border)',
        'border-light': 'var(--color-border-light)',
        // Semantic color aliases for easier theming
        success: 'var(--color-primary)',
        'success-hover': 'var(--color-primary-hover)',
        'success-light': 'var(--color-primary-light)',
        'success-bg': 'var(--color-primary-bg)',
        // Shorthand aliases
        secondary: 'var(--color-bg-secondary)',
        card: 'var(--color-bg-card)',
        muted: 'var(--color-text-muted)',
        // Exact beige wireframe colors
        beige: {
          50: '#faf8f5',
          100: '#f5f0e8',
          200: '#e5ddd3',
          300: '#d5c9b8',
          dark: '#a89880',
          darker: '#8b7d6a',
        },
        green: {
          50: '#f0f5f0',
          100: '#e0ebe0',
          accent: 'var(--color-primary)',
          dark: 'var(--color-primary-hover)',
        },
        sage: {
          light: '#a3a898',
          DEFAULT: '#7d8471',
          dark: '#5d6353',
        },
        terracotta: {
          light: '#d4a07d',
          DEFAULT: '#c17f59',
          dark: '#a36547',
        },
      },
      fontFamily: {
        sans: ['var(--font-quicksand)', 'Quicksand', 'sans-serif'],
        display: ['var(--font-playfair)', 'Playfair Display', 'serif'],
        mono: ['var(--font-inter)', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%)',
        'gradient-terracotta': 'linear-gradient(135deg, #c17f59 0%, #a36547 100%)',
        'gradient-sage': 'linear-gradient(135deg, #7d8471 0%, #5d6353 100%)',
        'gradient-glass': 'linear-gradient(135deg, rgba(250, 248, 245, 0.95) 0%, rgba(245, 240, 232, 0.9) 100%)',
      },
      boxShadow: {
        'glass': '0 4px 20px rgba(61, 52, 40, 0.06)',
        'glass-hover': '0 8px 28px var(--color-primary-bg)',
        'glow': '0 8px 28px var(--color-primary-bg)',
        'glow-strong': '0 8px 20px -5px var(--color-primary)',
        'glow-terracotta': '0 8px 20px -5px rgba(193, 127, 89, 0.3)',
        'glow-sage': '0 8px 20px -5px rgba(125, 132, 113, 0.3)',
        'subtle': '0 2px 8px rgba(61, 52, 40, 0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        'pulse-subtle': 'subtlePulse 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          'from': { opacity: '0', transform: 'translateY(10px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        subtlePulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      transitionTimingFunction: {
        'premium': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      backdropBlur: {
        'glass': '20px',
      },
    },
  },
  plugins: [],
};
export default config;
