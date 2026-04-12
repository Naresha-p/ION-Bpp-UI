/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#141418',
          raised:  '#1c1c22',
          overlay: '#222228',
          border:  'rgba(255,255,255,0.08)',
        },
        accent: {
          DEFAULT: '#6366f1',
          hover:   '#818cf8',
          muted:   'rgba(99,102,241,0.15)',
        },
      },
      backgroundImage: {
        'premium-gradient': 'linear-gradient(135deg, #0d0d10 0%, #141418 100%)',
        'card-glow-blue':   'linear-gradient(135deg, #1e3a8a22, #3b82f611)',
        'card-glow-purple': 'linear-gradient(135deg, #4f46e522, #818cf811)',
        'card-glow-emerald':'linear-gradient(135deg, #06422222, #10b98111)',
        'card-glow-amber':  'linear-gradient(135deg, #78350f22, #f59e0b11)',
        'card-glow-rose':   'linear-gradient(135deg, #88172222, #f4364611)',
      },
      boxShadow: {
        'card':     '0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.4)',
        'card-hover':'0 8px 30px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.4)',
        'modal':    '0 25px 60px rgba(0,0,0,0.8)',
        'glow-blue':'0 0 20px rgba(99,102,241,0.25)',
        'glow-sm':  '0 0 10px rgba(99,102,241,0.15)',
      },
      animation: {
        'fade-in':  'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
