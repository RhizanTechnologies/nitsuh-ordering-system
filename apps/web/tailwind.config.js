/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          'Outfit',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        heading: ['Outfit', '"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"SF Mono"', 'ui-monospace', 'Menlo', 'monospace'],
      },
      colors: {
        cream: {
          50: '#FDFCF9',
          100: '#F8F6F0',
          200: '#EFECE2',
          300: '#E3DFD2',
        },
        forest: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          DEFAULT: '#C11221', // Primary Nitsuh Brand Crimson Red!
          600: '#C11221',
          700: '#A30F1C',
          800: '#830C16',
          900: '#640A11',
        },
        brand: {
          red: '#C11221',
          'red-hover': '#A30F1C',
          'red-light': '#FEF2F2',
          'red-subtle': '#FFF5F5',
          yellow: '#F59E0B',
          'yellow-light': '#FEF9C3',
          'yellow-hover': '#D97706',
          gold: '#F89B22',
          amber: '#F59E0B',
        },
        cafe: {
          dark: '#18181B', // Crisp deep charcoal (zinc-900)
          red: '#C11221',
          yellow: '#F59E0B',
          amber: '#F89B22',
          coral: '#EF4444',
          sand: '#F4F1EA',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
