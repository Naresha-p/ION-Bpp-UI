/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ion-blue': {
          50:  '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        'ion-teal': {
          500: '#14b8a6',
          600: '#0d9488',
        }
      },
      backgroundImage: {
        'ion-gradient': 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)',
        'card-blue': 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        'card-red': 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        'card-orange': 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        'card-teal': 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
      }
    },
  },
  plugins: [],
}
