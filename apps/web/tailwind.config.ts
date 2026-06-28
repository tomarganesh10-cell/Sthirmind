import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy:   '#1B3A6B',
        gold:   '#F4A261',
        heart:  '#E63946',
        hope:   '#457B9D',
        health: '#52B788',
        help:   '#7B2D8B',
        happy:  '#F4A261',
        border: 'hsl(var(--border))',
        input:  'hsl(var(--input))',
        ring:   'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary:   { DEFAULT: '#1B3A6B', foreground: '#FFFFFF' },
        secondary: { DEFAULT: '#F4A261', foreground: '#1A202C' },
        muted:     { DEFAULT: '#F0F4F8', foreground: '#718096' },
        accent:    { DEFAULT: '#E63946', foreground: '#FFFFFF' },
      },
      fontFamily: {
        sans:  ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
      },
      borderRadius: {
        lg: '14px',
        md: '10px',
        sm: '6px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(0,0,0,.07)',
        hover: '0 8px 32px rgba(0,0,0,.12)',
        nav: '0 4px 20px rgba(0,0,0,.1)',
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
        float: 'float 3s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0,0,0.2,1) infinite',
        'slide-up': 'slide-up 0.4s ease-out',
        'fade-in':  'fade-in 0.3s ease-out',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up':   { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        float:     { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        'pulse-ring': { '0%': { transform: 'scale(1)', opacity: '1' }, '100%': { transform: 'scale(1.4)', opacity: '0' } },
        'slide-up': { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'fade-in':  { from: { opacity: '0' }, to: { opacity: '1' } },
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
} satisfies Config;
