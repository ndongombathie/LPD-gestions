/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
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
        },
      },
    },
  },
  plugins: [],
}