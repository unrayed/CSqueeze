/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        mist: {
          50: '#f5f6f2',
          100: '#eaede5',
          200: '#d9e1d3',
          300: '#bcc8b7',
          400: '#8d9a8d',
          500: '#647065',
          600: '#4b574d',
          700: '#35413a',
          800: '#1d2822',
          900: '#121a16',
          950: '#0b1210',
        },
        primary: {
          50: '#f6fbe3',
          100: '#ecf6c1',
          200: '#d9ea84',
          300: '#c4dd62',
          400: '#aacf4c',
          500: '#7fbf4a',
          600: '#5da546',
          700: '#3f7f3c',
          800: '#2f5e2f',
          900: '#234726',
          950: '#142a16',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      animation: {
        'accordion-down': 'accordion-down 220ms cubic-bezier(0.22, 1, 0.36, 1)',
        'accordion-up': 'accordion-up 220ms cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
    },
  },
  plugins: [],
};
