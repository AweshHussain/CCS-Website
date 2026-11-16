/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#080808',
        'surface-secondary': '#111111',
        'surface-card': '#141416',
        'surface-elevated': '#18181B',
        accent: {
          DEFAULT: '#E50920',
          hover: '#FF1E38',
          glow: 'rgba(229, 9, 32, 0.4)',
          dim: 'rgba(229, 9, 32, 0.12)',
          dark: '#B20718',
        },
        muted: '#A1A1AA',
        subtle: '#71717A',
        glass: {
          border: 'rgba(255, 255, 255, 0.08)',
          'border-focus': 'rgba(229, 9, 32, 0.35)',
          surface: 'rgba(18, 18, 20, 0.72)',
          'surface-hover': 'rgba(26, 26, 30, 0.85)',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Space Grotesk"', 'Inter', 'sans-serif'],
        display: ['Unbounded', 'Syne', '"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        rajdhani: ['Rajdhani', 'sans-serif'],
        syncopate: ['Syncopate', 'sans-serif'],
        syne: ['Syne', 'sans-serif'],
        space: ['"Space Grotesk"', 'sans-serif'],
      },
      boxShadow: {
        'glass-sm': '0 4px 24px -1px rgba(0, 0, 0, 0.4), inset 0 1px 1px 0 rgba(255, 255, 255, 0.06)',
        'glass-md': '0 8px 32px -2px rgba(0, 0, 0, 0.6), inset 0 1px 1px 0 rgba(255, 255, 255, 0.08)',
        'glass-lg': '0 16px 48px -4px rgba(0, 0, 0, 0.75), inset 0 1px 2px 0 rgba(255, 255, 255, 0.12)',
        'crimson-glow': '0 0 35px rgba(229, 9, 32, 0.28), 0 0 70px rgba(229, 9, 32, 0.12)',
        'crimson-sm': '0 0 16px rgba(229, 9, 32, 0.35)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: 0.4, transform: 'scale(1)' },
          '50%': { opacity: 0.8, transform: 'scale(1.05)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        }
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 4s ease-in-out infinite',
        scanline: 'scanline 8s linear infinite',
      }
    },
  },
  plugins: [],
}
