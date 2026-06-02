/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  darkMode: 'class',   // toggled via <html class="dark">

  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#16a34a',
          dark:    '#15803d',
          light:   '#22c55e',
        },
      },
      borderRadius: {
        'card': '16px',
        'btn':  '10px',
      },
      boxShadow: {
        'card':       '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px 0 rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.04)',
      },
      maxWidth: {
        'page': '64rem',
      },
    },
  },
  plugins: [],
};
