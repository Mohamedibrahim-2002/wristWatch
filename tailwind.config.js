/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./client/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        luxury: {
          950: '#0a0d12',
          900: '#111622',
          850: '#161d2d',
          800: '#1e273b',
          700: '#2d3a56',
          gold: '#c5a059',
          goldLight: '#e4c88e',
          goldDark: '#997637',
          bronze: '#a77044',
          platinum: '#e5e7eb',
          sapphire: '#1e3a8a',
          emerald: '#064e3b',
          ruby: '#881337',
        }
      },
      fontFamily: {
        serif: ['Cinzel', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}

