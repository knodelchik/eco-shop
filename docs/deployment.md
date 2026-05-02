# EcoShop — Deployment Guide

Покрокова інструкція з деплою EcoShop на Vercel + Neon Postgres + Neon Auth.

---

## ✅ Передумови

- [x] Акаунт Vercel ([vercel.com](https://vercel.com))
- [x] Акаунт Neon з активним проектом ([console.neon.tech](https://console.neon.tech))
- [x] Акаунт Cloudinary (опційно — для upload фото) ([cloudinary.com](https://cloudinary.com))
- [x] Акаунт Resend (опційно — для надійної відправки email) ([resend.com](https://resend.com))
- [x] GitHub-репозиторій з кодом проекту

---

## Крок 1. Запушити проект у GitHub

```bash
cd /Users/bogdan/web/next/eco-shop

# Якщо ще нема remote:
git remote add origin https://github.com/YOUR_USERNAME/eco-shop.git
git add -A
git commit -m "feat: ready for deploy"
git push -u origin master
```

---

## Крок 2. Створити проект у Vercel

1. Перейдіть на [vercel.com/new](https://vercel.com/new)
2. **Import Git Repository** → виберіть `eco-shop`
3. Framework Preset визначиться автоматично як **Next.js**
4. **НЕ натискайте Deploy** — спочатку додайте env-змінні

---

## Крок 3. Environment Variables

У Vercel Dashboard → Project Settings → Environment Variables додайте:

### Обов'язкові

```
DATABASE_URL=postgresql://neondb_owner:****@ep-...neon.tech/neondb?sslmode=require
NEXT_PUBLIC_NEON_AUTH_URL=https://ep-...neonauth.c-3.eu-central-1.aws.neon.tech/neondb/auth
NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app
```

### PayPal (Sandbox для тестів, Live для реального магазину)

```
PAYPAL_CLIENT_ID=AReq...
PAYPAL_CLIENT_SECRET=EMnZ...
PAYPAL_ENVIRONMENT=sandbox
```

### Email (опційно — використовується у feedback/newsletter)

```
GMAIL_USER=ваш@gmail.com
GMAIL_PASSWORD=ваш_app_password   # НЕ звичайний пароль, а app-password
```

Або через SendGrid:
```
SENDGRID_API_KEY=SG.xxx...
```

### Cloudinary (опційно — для upload фото в адмінці)

```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=ecoshop_unsigned
```

### Адмін

```
NEXT_PUBLIC_ADMIN_EMAILS=ваш@email.com
ADMIN_EMAIL=ваш@email.com
```

### Monobank webhook (опційно)

```
MONOBANK_WEBHOOK_SECRET=random_string_here
```

---

## Крок 4. Запустити deploy

Натисніть **Deploy**. Перший білд триватиме 2-3 хвилини. Перевірте у логах:
- ✓ `Compiled successfully`
- ✓ `Generating static pages (X/X)`
- ✓ `Collecting page data`

Якщо є помилки — типово через відсутність env-змінної. Гляньте `Build Logs` і додайте бракуючу.

---

## Крок 5. Налаштувати Neon Auth для production

У Neon Console → Auth → Configuration:

1. **Allowed callback URLs** — додайте:
   ```
   https://your-domain.vercel.app/auth/confirm
   https://your-domain.vercel.app/auth/update-password
   https://your-domain.vercel.app/auth/verify
   ```

2. **Email provider** — підключіть Resend або SMTP. Без цього листи не приходитимуть.

3. **Email template (опційно)** — налаштуйте свій шаблон з лого EcoShop.

---

## Крок 6. Виконати міграцію БД у production

У Neon Console → SQL Editor виконайте:

1. `db/migrations/20260428_eco_products.sql` (якщо ще не виконано)
2. `db/migrations/20260429_product_images.sql`

Перевірте що таблиці створені:
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

Має бути: `products`, `cart_items`, `wishlist`, `orders`, `order_items`, `user_addresses`, `user_profiles`, `newsletter`, `feedback`.

---

## Крок 7. Custom domain (опційно)

1. Vercel Dashboard → Project → Settings → Domains
2. Додайте свій домен (наприклад `ecoshop.com.ua`)
3. У DNS-провайдера додайте `CNAME` запис на `cname.vercel-dns.com`
4. Очікуйте ~30 хв на пропагацію
5. Vercel автоматично видасть SSL-сертифікат

Не забудьте оновити:
- `NEXT_PUBLIC_BASE_URL=https://ecoshop.com.ua`
- Allowed callback URLs у Neon Auth

---

## Крок 8. Post-deploy чек-лист

Пройдіться сайтом і перевірте кожен флоу:

- [ ] Головна `/` — hero, categories, featured products, story
- [ ] Каталог `/shop` — фільтри, пошук, sort
- [ ] Картка товару `/shop/[slug]` — галерея, табы, related
- [ ] Корзина — додавання, видалення, qty +/−
- [ ] Реєстрація — створення акаунту, OTP код
- [ ] Логін — після верифікації email
- [ ] Профіль — особисті дані, адреси, замовлення, обране, безпека
- [ ] Checkout — PayPal sandbox transaction
- [ ] Contact — форма надсилається
- [ ] Blog — `/about` список статей, окрема стаття
- [ ] 404 сторінка
- [ ] Темна тема (toggle у footer)
- [ ] Мова (UA/EN switcher)
- [ ] Mobile (Chrome DevTools → Device toolbar)

---

## Крок 9. Моніторинг

### Vercel Analytics (безкоштовно)
Vercel Dashboard → Project → Analytics — увімкніть Web Analytics одним кліком.

### Speed Insights
Project → Settings → Speed Insights → Enable. Покаже Core Web Vitals.

### Sentry (рекомендую для продакшену)
```bash
npx @sentry/wizard@latest -i nextjs
```

---

## Крок 10. CI/CD з GitHub

Vercel автоматично:
- При push у `master` → deploy у production
- При PR → деплоїть preview-URL у коментар PR

Якщо хочете додати CI-тести:
1. Створіть `.github/workflows/test.yml`
2. У workflow запускайте `npm run test:e2e` перед merge

---

## 🔧 Troubleshooting

### Build fails with "DATABASE_URL is missing"
→ Перевірте що змінна додана до Production environment у Vercel.

### Auth не працює — "Origin header required"
→ Додайте production URL у `Allowed callback URLs` у Neon Auth.

### Email не приходить
→ У Neon Auth → Email provider підключіть Resend/SendGrid. Тестовий мейлер Neon може не доходити.

### 404 на `/uk/...` сторінках
→ Перевірте що `next-intl` middleware працює (`middleware.ts` має `matcher: ['/((?!_next|_vercel|.*\\..*).*)']`).

### Cloudinary upload returns 400
→ Перевірте що Upload Preset позначено як **Unsigned** і додано до production env.

---

## 📊 Performance чек

Запустіть [PageSpeed Insights](https://pagespeed.web.dev/) на production URL.
Очікувана оцінка для EcoShop:
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 100

Якщо нижче — гляньте конкретні рекомендації; зазвичай питання у LCP image (Hero) — додайте `priority` атрибут.

---

## 🎓 Для курсової роботи

У звіті додайте:
1. Скрін архітектури: User → Vercel CDN → Next.js → Neon Auth + Postgres
2. ER-діаграма БД (можна згенерувати з Neon Console → Schema → Tables → Diagram)
3. Скріни post-deploy чек-листа (як кожен флоу працює)
4. Lighthouse-звіт (експорт у PDF)
5. Перелік usef.ed технологій з обґрунтуваннями
