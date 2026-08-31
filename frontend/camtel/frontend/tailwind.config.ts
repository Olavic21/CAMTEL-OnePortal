import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#003DA5',
          50: '#E6EDF9',
          100: '#C1D3F0',
          200: '#98B6E6',
          300: '#6E98DB',
          400: '#4A7ED3',
          500: '#003DA5',
          600: '#003692',
          700: '#002D7A',
          800: '#002461',
          900: '#001A47',
        },
        accent: {
          DEFAULT: '#00A651',
          50: '#E5F7ED',
          100: '#B8EBCE',
          200: '#87DEAC',
          300: '#55D089',
          400: '#2AC46E',
          500: '#00A651',
          600: '#009449',
          700: '#007D3E',
          800: '#006633',
          900: '#004022',
        },
        neutral: {
          50: '#FAFAF9',
          100: '#F4F3F1',
          200: '#E6E4E1',
          300: '#D3D1CD',
          400: '#A8A6A1',
          500: '#7C7A76',
          600: '#5C5A57',
          700: '#403E3B',
          800: '#2B2B2E',
          900: '#1B1B1D',
          950: '#121213',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.875rem',
      },
      transitionDuration: {
        DEFAULT: '250ms',
        250: '250ms',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.03), 0 2px 8px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 16px 0 rgba(0, 58, 217, 0.08), 0 8px 24px 0 rgba(0, 0, 0, 0.08)',
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '1.5rem',
          lg: '2rem',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
