import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";

export default defineConfig([
  js.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      globals: globals.browser,
      sourceType: "module",
      ecmaVersion: "latest",
    },
    rules: {
      "react/prop-types": "off",
    },
  },
]);
