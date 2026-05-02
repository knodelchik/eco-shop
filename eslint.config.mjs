import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Дозволяємо використання any
      "@typescript-eslint/no-explicit-any": "off",
      // Дозволяємо невикористані змінні (робимо їх попередженнями, а не помилками)
      "@typescript-eslint/no-unused-vars": "warn",
      // Дозволяємо апострофи в тексті без екранування
      "react/no-unescaped-entities": "off",
      // Дозволяємо ts-ignore
      "@typescript-eslint/ban-ts-comment": "off",
    },
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
