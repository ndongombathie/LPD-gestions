// ==========================================================
// 🎨 Configuration TailwindCSS — Interface LPD Responsable
// Compatible Tailwind v4 + Vite
// ==========================================================

import plugin from 'tailwindcss/plugin';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',

  theme: {
    extend: {
      colors: {
        // 🎨 Palette LPD harmonisée
        'lpd-bg': '#ffffff',
        'lpd-header': '#472EAD',
        'lpd-sidebar': '#F3F4F6',
        'lpd-text': '#111827',
        'lpd-muted': '#6B7280',
        'lpd-orange': '#F58020',
        'lpd-border': '#E5E7EB',
        'lpd-card': '#ffffff',

        // Couleurs sémantiques
        'lpd-primary': '#472EAD',
        'lpd-accent': '#F58020',
        'lpd-success': '#16A34A',
        'lpd-danger': '#DC2626',
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#472EAD', // Violet principal
          700: '#3d2888',
          800: '#2e1f66',
          900: '#1f1544',
          950: '#0f0a22',
        },
        accent: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#F58020', // Orange accent
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        text: {
          primary: '#111827', // Noir texte
          secondary: '#6b7280',
        },
        background: {
          light: '#F3F4F6', // Gris clair (fond clair)
          white: '#FFFFFF', // Blanc pur
        }
      },

      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'sans-serif'],
      },

      boxShadow: {
        soft: '0 2px 6px rgba(0, 0, 0, 0.08)',
        strong: '0 4px 12px rgba(0, 0, 0, 0.15)',

      },
    },
  },

  plugins: [
    plugin(function ({ addUtilities }) {
      addUtilities({
        '.card': {
          '@apply bg-white rounded-xl shadow-soft p-5 transition-all duration-200 hover:shadow-strong': {},
        },
        '.btn': {
          '@apply inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200': {},
        },
        '.btn-primary': {
          '@apply bg-lpd-primary text-white hover:bg-indigo-800 shadow-soft': {},
        },
        '.btn-accent': {
          '@apply bg-lpd-accent text-white hover:bg-orange-600 shadow-soft': {},
        },
        '.btn-outline': {
          '@apply border border-lpd-border text-lpd-primary hover:bg-lpd-primary hover:text-white transition': {},
        },
      });
    }),
  ],
};
