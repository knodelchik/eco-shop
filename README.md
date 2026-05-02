# EcoShop — Електронний магазин еко-товарів

Курсова робота. Веб-магазин з продажу екологічних товарів: натуральна косметика, багаторазовий посуд, біорозкладна побутова хімія, еко-одяг та органічні продукти.

Реалізовано на стеку Next.js 15 (App Router, Turbopack) + React 19 + TypeScript + Tailwind CSS 4. Бекенд — Supabase (Auth, Postgres, Storage). Платежі — PayPal. Мультимовність — `next-intl` (UA / EN). Двошаровий тематичний дизайн (light / dark).

## Запуск проекту

```bash
npm install
npm run dev
```

Відкрийте [http://localhost:3000](http://localhost:3000) у браузері.

## Доступні скрипти

- `npm run dev` — запуск у режимі розробки (Turbopack)
- `npm run build` — продакшен-збірка
- `npm run start` — запуск production-серверу
- `npm run lint` — перевірка ESLint

## Структура проекту

- `app/[locale]/` — сторінки (главна, магазин, корзина, профіль, оформлення замовлення тощо)
- `app/Components/` — UI-компоненти (Header, Footer, CartSheet, AuthForm…)
- `app/api/` — API-маршрути (платежі, аутентифікація, форми зворотнього зв’язку)
- `app/types/` — TypeScript-типи (`Product`, `Cart`, `User`…)
- `messages/` — переклади (`en.json`, `uk.json`)
- `lib/` — Supabase-клієнти та хелпери

## Категорії товарів

- Еко-косметика та догляд
- Багаторазовий посуд і кухня
- Натуральна побутова хімія
- Еко-одяг
- Органічні продукти
- Zero-waste аксесуари
