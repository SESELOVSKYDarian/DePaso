// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";

/** Config base compartida. Cada app/package la extiende y agrega sus propias reglas. */
export const baseConfig = tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ]
    }
  },
  {
    ignores: ["dist/**", ".next/**", ".expo/**", "node_modules/**", "coverage/**"]
  }
);
