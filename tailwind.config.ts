import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#050505',
          secondary: '#0d0d0d',
          elevated: '#171717',
          harsh: '#1a1a1a',
        },
        text: {
          primary: '#f0f0f0',
          secondary: '#8a8a8a',
          muted: '#4a4a4a',
        },
        accent: {
          DEFAULT: '#ff4d00',
          hover: '#ff6b2c',
          dim: '#ff4d0020',
        },
        success: '#00ff6a',
        warning: '#ffd000',
        danger: '#ff003c',
        muscle: {
          chest: '#ff4d00',
          back: '#0066ff',
          shoulders: '#9333ea',
          arms: '#ff0066',
          legs: '#00d4aa',
        },
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        '2xs': '0.625rem',
        'display-xl': ['4rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
        'display-lg': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-top': 'env(safe-area-inset-top)',
      },
      borderRadius: {
        none: '0',
      },
      boxShadow: {
        'harsh': '4px 4px 0 0 rgba(255, 77, 0, 0.3)',
        'harsh-lg': '8px 8px 0 0 rgba(255, 77, 0, 0.2)',
        'inner-harsh': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.5)',
        'glow': '0 0 30px rgba(255, 77, 0, 0.4)',
        'glow-sm': '0 0 15px rgba(255, 77, 0, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-left': 'slideLeft 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-accent': 'pulseAccent 2s infinite',
        'grain': 'grain 8s steps(10) infinite',
        'flicker': 'flicker 0.15s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeft: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseAccent: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        grain: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '10%': { transform: 'translate(-5%, -10%)' },
          '20%': { transform: 'translate(-15%, 5%)' },
          '30%': { transform: 'translate(7%, -25%)' },
          '40%': { transform: 'translate(-5%, 25%)' },
          '50%': { transform: 'translate(-15%, 10%)' },
          '60%': { transform: 'translate(15%, 0%)' },
          '70%': { transform: 'translate(0%, 15%)' },
          '80%': { transform: 'translate(3%, 35%)' },
          '90%': { transform: 'translate(-10%, 10%)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(to right, #1a1a1a 1px, transparent 1px), linear-gradient(to bottom, #1a1a1a 1px, transparent 1px)',
        'diagonal-lines': 'repeating-linear-gradient(45deg, transparent, transparent 10px, #1a1a1a 10px, #1a1a1a 11px)',
      },
    },
  },
  plugins: [],
} satisfies Config
