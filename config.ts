// src/config.ts
export const locales = ['en', 'uk'] as const;

// Встановлюємо 'en' як дефолтну (щоб для англійської не було проблем).
// Можете змінити на 'uk', якщо хочете, але тоді переконайтеся, що це вас влаштовує.
export const defaultLocale = 'en';

// 'always' — це ключ до вирішення вашого багу.
// Це змушує URL завжди бути /en/about або /uk/about.
export const localePrefix = 'always';

export type Locale = (typeof locales)[number];
