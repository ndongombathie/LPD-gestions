// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        appPurple: "#4b1c7b",
        appSidebar: "#4B0082", // violet foncé
        appOrange: "#f7881f",
        appBlue: "#dbeafe", // bleu clair hover
      },
    },
  },
  plugins: [],
};
