/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Switzer', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['"Instrument Serif"', '"Newsreader"', 'Georgia', 'serif'],
        mono: ['"Geist Mono"', '"JetBrains Mono"', '"SF Mono"', 'monospace'],
      },
      colors: {
        bone: {
          50: '#FDFBF7',
          100: '#F7F6F2',
          200: '#EFECE6',
          300: '#E2DDD4',
          400: '#C8C1B4',
          500: '#9E9687',
          600: '#6E6759',
          700: '#4A453B',
          800: '#2F2B24',
          900: '#181613',
        },
        olive: {
          50: '#F4F7F4',
          100: '#E7EFE8',
          200: '#D1E1D3',
          300: '#ABC7B0',
          400: '#7FA886',
          500: '#5A8562',
          600: '#43684B',
          700: '#34523B',
          800: '#2B4230',
          900: '#233628',
          950: '#111D15',
        },
        obsidian: {
          DEFAULT: '#121315',
          soft: '#1A1C1E',
          muted: '#2D3035',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'soft-sm': '0 1px 3px rgba(0,0,0,0.03), 0 1px 2px rgba(0,0,0,0.02)',
        'soft-md': '0 4px 16px -2px rgba(0,0,0,0.04), 0 2px 6px -1px rgba(0,0,0,0.02)',
        'soft-lg': '0 12px 32px -4px rgba(0,0,0,0.06), 0 4px 12px -2px rgba(0,0,0,0.03)',
        'inner-glow': 'inset 0 1px 1px 0 rgba(255,255,255,0.85)',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'luxury': 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
    },
  },
  plugins: [],
};
