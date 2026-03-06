import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig } from "eslint/config";

export default defineConfig([
  js.configs.recommended,
  pluginReact.configs.flat.recommended,

  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node, // ✅ corrige process is not defined
      },
    },

    settings: {
      react: {
        version: "detect", // ✅ corrige React version warning
      },
    },

    plugins: {
      "react-hooks": reactHooks,
    },

    rules: {
      // ✅ React 17+ (plus besoin d'import React)
      "react/react-in-jsx-scope": "off",

      // Optionnel mais recommandé
      "react/prop-types": "off",

      // Si les apostrophes te fatiguent
      "react/no-unescaped-entities": "off",

      // Hook rules importantes
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
]);