// ==========================================================
// ⚙️ Configuration PostCSS – Compatible TailwindCSS v4 + Vite
// ==========================================================

import tailwindcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';

export default {
  plugins: [tailwindcss(), autoprefixer()],
};
