import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Глобальні ignores — окремий об'єкт без інших ключів, інакше у flat config
  // не сприймається як global ignore (буде ігнорувати лише для конкретного
  // блоку правил). Без цього lint сканує згенеровані .next/build/ і дає 40k+
  // false positives.
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      "next-env.d.ts",
      "playwright-report/**",
      "test-results/**",
    ],
  },
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
  },
];

export default eslintConfig;
