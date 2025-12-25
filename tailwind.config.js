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
