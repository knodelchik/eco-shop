# Промти для Claude Design — EcoShop

Запускайте по черзі. Між ними чекайте відповіді, давайте зворотний зв'язок,
ітеруйте, експортуйте — потім переходьте до наступного.

---

## Початкова інструкція (вставити в опис проекту або перший повідомлення)

Я роблю **повністю новий дизайн** інтернет-магазину еко-товарів EcoShop.
Це не редизайн існуючого — повертайся до design-brief.md (завантажений у проект)
як до єдиного джерела істини. Вебсайт + мобільний застосунок Expo.

Стек кодової бази, з якою інтегруємось:
- Web: Next.js 15 (App Router) + React 19 + Tailwind CSS 4 + shadcn/ui + Framer Motion
- Mobile: Expo SDK 53 + Expo Router + NativeWind 4

Працюємо у 6 етапів: A) дизайн-система, B) глобальні компоненти, C) веб-сторінки,
D) мобільні screen-и, E) state-страніси, F) фінальний експорт.

Кожен етап = окрема сесія. Після завершення я скажу "OK далі" і переходимо.
Не намагайся зробити все в одній відповіді.

---

## ПРОМТ A — Дизайн-система

```
Етап A: Дизайн-система EcoShop.

Створи single-page стайлгайд, який містить (по порядку):

1. КОЛІРНА ПАЛІТРА — світла + темна тема в OKLCH (зі специфікації в design-brief).
   Покажи кожен токен як квадрат + його ім'я + hex + OKLCH-значення.

2. ТИПОГРАФІЧНА ШКАЛА
   Шрифти: Fraunces (display + headings) і Inter (body + UI), обидва з Google Fonts.
   Покажи всі рівні (display, h1-h4, body-lg, body, body-sm, caption) — два рядки
   українською і англійською для кожного.

3. SPACING SCALE (4, 8, 12, 16, 24, 32, 48, 64, 96, 128) як візуальні бруски.

4. RADIUS SCALE (0, 8, 12, 16, full) — приклади на квадратах.

5. SHADOWS (none, sm, md, lg) — приклади на картках.

6. BUTTONS
   5 варіантів × 3 розміри × 4 стани (default, hover, active, disabled, loading).
   Показати у таблиці. Включи icon-only варіанти.

7. INPUTS
   Text, textarea, select, checkbox, switch, radio.
   Стани: default, focus, error, disabled, з floating label.

8. BADGES
   Default, secondary, outline, eco-certs (vegan, biodegradable, plastic-free, fair-trade).
   Кожен сертифікат — з власною іконкою (намалюй у Lucide-стилі outline).

9. CARDS
   Generic Card (з Header/Content/Footer). ProductCard — повноцінна (image,
   2 бейджі зверху, назва, ціна, wishlist heart, quick-add кнопка).

10. ICONOGRAPHY
    Покажи 24 типові іконки що ми використовуватимемо (search, cart, heart, user,
    chevron, plus/minus, close, menu, filter, leaf, etc.) — з Lucide.

11. TOAST + DIALOG + SHEET — короткі приклади.

12. EMPTY STATE — приклад "Cart is empty" з ілюстрацією + CTA.

Все на одній сторінці, з якорем-навігацією зверху для розділів. Toggle
світла/темна тема у фіксованій кнопці зверху-справа. Показуй як інтерактивний
прев'ю. Українська мова в підписах.

Стиль: мінімалізм, багато повітря (padding мінімум 24, між секціями 96+),
м'які тіні, заокруглення 12-16 default. Без emoji. Інспірація: Aesop, Notion.
```

Після відповіді Клода:
- Покрутіть adjustment knobs (spacing, radius, font weights).
- Inline-правки на конкретних елементах.
- Експортуйте як **HTML** — назвіть `01-style-guide.html`.

Скажіть "OK далі" → ПРОМТ B.

---

## ПРОМТ B — Глобальні компоненти

```
Етап B: глобальні компоненти, що повторюються на всіх сторінках.
Спирайся на дизайн-систему з попередньої сесії.

Створи на одній сторінці (свого роду macro-preview):

1. HEADER (desktop)
   Логотип "EcoShop" зліва (минимум — типографічний, з листочковою рискою).
   Центр: nav links — Магазин / Про нас / Журнал / Контакти.
   Справа: search icon, language switcher (UK/EN), theme toggle, wishlist heart
   з лічильником, cart bag з лічильником, profile avatar.
   Висота 72px desktop, sticky з blur при скролі.

2. HEADER (mobile)
   Hamburger зліва, лого по центру, cart + profile справа.
   Drawer slide-in зліва: nav links, language, theme.

3. FOOTER
   4 колонки на desktop:
   — Бренд: лого + 2 рядки про місію + соцмережі (icons).
   — Магазин: посилання на категорії.
   — Підтримка: FAQ, доставка, повернення, контакти.
   — Юридичне: політика приватності, terms, cookies.
   Знизу: rights line + платіжні методи (PayPal, Mono, Visa, MasterCard як icons).
   Mobile: 1 колонка, accordions.

4. CART SHEET (slide-over з правого боку)
   Header з заголовком + close icon.
   Список товарів (image + назва + варіант + qty stepper + видалити).
   Footer: subtotal + кнопка "Оформити" full-width.
   Empty state — якщо корзина порожня.

5. WISHLIST SHEET — аналогічно cart.

6. SEARCH MODAL (cmd+k тип)
   Великий input зверху, список trending searches, останні запити, live results.
   Mobile: full-screen.

7. AUTH MODAL (опційно — якщо треба швидкий login без переходу)
   Compact версія форми входу.

8. NEWSLETTER SECTION
   Підкладка кольору muted, заголовок-серіф, sub-text, email input + кнопка
   inline. Privacy hint малими літерами знизу.

9. BREADCRUMBS — горизонтальний рядок з шевронами.

10. PAGINATION — компактна, з prev / next + цифри.

Покажи кожен компонент окремо, з підписами. Українська мова. Світла + темна
теми (toggle).
```

Експортуйте як `02-global-components.html`. Скажіть "OK далі" → ПРОМТ C.

---

## ПРОМТ C — Веб-сторінки (по черзі)

Цей промт повторюйте для кожної сторінки, змінюючи назву.

### C.1 Home

```
Етап C.1: Головна сторінка EcoShop. Спирайся на дизайн-систему та глобальні
компоненти з попередніх сесій (header / footer / newsletter уже є — підставляй).

Структура (зверху вниз):

1. HERO (повноекранний, ~85vh)
   Background: великий фото природи (зеленувата, золоте світло) — тимчасово
   Unsplash placeholder. Тінь градієнтна знизу.
   Текст лівобічно (vertical center): caption "Eco-friendly goods" → 
   display заголовок "Свідоме життя — без компромісів" (Fraunces, 80px) → 
   sub-text 1-2 рядки → CTA primary "Перейти у магазин" + secondary "Наша історія".

2. VALUES STRIP (4 пункти горизонтально)
   Іконка + заголовок + 1 рядок: Біорозкладні матеріали / Без пластикової
   упаковки / Українські майстри / Карбон-нейтральна доставка.
   Padding 64px, фон card.

3. CATEGORIES (3 великі картки)
   Кожна — фото фон, заголовок (Fraunces) + sub-text + chevron.
   Aspect ratio 4:5 на desktop, 3 в ряд. Hover: легкий zoom фото.
   Категорії: Еко-косметика / Багаторазовий посуд / Zero-waste аксесуари.

4. FEATURED PRODUCTS (8 товарів grid 4×2)
   Заголовок секції "Вибір редакції" + link "Дивитись всі →".
   Використай ProductCard з дизайн-системи.
   Stagger fade-in при появі у viewport.

5. STORY SECTION (split 50/50)
   Зліва: велике фото (4:5 aspect).
   Справа: caption "Наша історія" → h2 → 2 абзаци body → link "Дізнатися більше".

6. JOURNAL (3 статті)
   Картки з image (3:2), category tag, h4 заголовок, дата + автор.
   Заголовок секції "Журнал" + link.

7. NEWSLETTER (вже є — використай).

8. FOOTER (вже є).

Mobile-варіант: усі секції — одна колонка, hero 100vh, categories вертикально,
products grid 2 колонки.

Зроби show-and-tell обох варіантів (desktop + mobile у iPhone frame поряд).
```

Експорт → `03-page-home.html`.

### C.2 Shop (Catalog)

```
Етап C.2: сторінка каталогу /shop.

Layout:
- Page header: caption "Магазин" → h1 "Усі товари" → sub-text 1 рядок.
  Padding-y 64px.

- Sticky toolbar (нижче header):
  Зліва: search input compact + результати (наприклад "84 товари").
  Справа: sort dropdown (Новинки / За зростанням ціни / За спаданням / Популярні)
  + Filter button (для mobile — відкриває sheet).

- Desktop: sidebar 280px зліва з фільтрами:
  · Категорія (radio групи)
  · Ціна (slider min/max)
  · Сертифікати (чекбокси: Vegan, Biodegradable, Plastic-free, Fair-trade)
  · Країна виробництва (multiselect chips)
  Кнопка "Скинути фільтри" знизу.

- Grid: 4 колонки desktop, 3 при md, 2 mobile. Gap 24/16.
- Активні фільтри показуються як tags зверху grid (з X для видалення).

- Pagination внизу.

Empty state: "Нічого не знайдено" + ілюстрація + "Скинути фільтри".

Mobile: sidebar стає bottom sheet (через filter button у toolbar).

Зроби обидва вигляди (desktop + mobile).
```

→ `04-page-shop.html`.

### C.3 Product Detail

```
Етап C.3: сторінка картки товару /shop/[slug].
Реальні дані для прев'ю: "Бамбукова зубна щітка (4 шт.)", $8.

Layout: 2 колонки 50/50 на desktop, 1 mobile.

ЛІВА (галерея):
- Headline image 3:4 aspect, без border.
- 4-6 thumbnails знизу (1:1, gap 8). Активна — primary border.
- Hover на main: показує курсор-zoom, при кліку модальний viewer.

ПРАВА (інфо), sticky scroll:
- Breadcrumb: Магазин / Аксесуари / Бамбукова зубна щітка
- Caption: категорія
- h1: назва (Fraunces, 36px)
- Eco-бейджі (vegan, biodegradable, plastic-free) у рядку
- Велика ціна + caption "за набір з 4 шт."
- Stepper кількості + Primary "Додати в корзину" inline.
- Wishlist + Share іконки кнопками.
- Stock indicator: "У наявності 47 шт."
- Accordion (default розкрита: Опис):
  · Опис
  · Склад / матеріали
  · Догляд та використання
  · Доставка та повернення
  · Еко-вплив (carbon footprint, packaging)

Нижче на повну ширину:
- Reviews: середня оцінка (4.8 / 5) + bar chart 5-1 stars + список відгуків.
- "З цим купують" — 4 товари ProductCard.

Mobile: галерея на повну ширину з horizontal swiper, нижче — інфо, sticky bottom
з ціною та "Додати в корзину".
```

→ `05-page-product.html`.

### C.4 Cart, C.5 Checkout, C.6 Profile, C.7 Auth, C.8 About, C.9 Contact, C.10 Admin

Аналогічна структура промту: «Зроби сторінку X згідно секції Y у design-brief.md.
Покажи desktop + mobile». Спирайся на бриф для контентного наповнення.

Кожен експорт: `06-page-cart.html`, `07-page-checkout.html`, тощо.

---

## ПРОМТ D — Mobile App Screens

```
Етап D: мобільний застосунок EcoShop на Expo + NativeWind. Створи всі screen-и
у iPhone 15 Pro frame (393×852).

Спирайся на ту саму дизайн-систему. Native-патерни:
- Tab-bar bottom (4 таби: Каталог / Пошук / Корзина / Профіль).
- Sheet знизу для filters і quick-actions.
- Sticky header з blur.
- Bottom safe area — додавай padding.
- Тапи мінімум 44px.
- Haptic feedback асоціюй з add-to-cart і важливими діями.

Screen-и (по списку з design-brief 11.1-11.11):
1. Onboarding (3 screens, swiper з точками)
2. Tab home / Catalog
3. Search (focused state)
4. Product Detail (з sticky bottom add-to-cart)
5. Filters (bottom sheet)
6. Cart
7. Checkout — Address, Shipping, Payment (3 окремих)
8. Order Tracking
9. Profile
10. Auth: Sign in / Sign up / Forgot (3)
11. Settings

Покажи всі screen-и в одній галереї (грід 3-4 в ряд) — щоб бачити консистентність.
Включи світлу і темну тему.
```

→ `08-mobile-screens.html`.

---

## ПРОМТ E — State pages

```
Етап E: стани, які часто пропускають.

1. 404 / 500 — мінімалістичні, з display-цифрою і CTA.
2. Maintenance — повноекранне повідомлення.
3. Loading skeletons для всіх ключових сторінок.
4. Empty states (cart, wishlist, search, orders).
5. Email templates (welcome, order confirmation, shipping update,
   password reset) — HTML, що рендериться в Gmail.

Показуй і вебові, і мобільні версії, де релевантно.
```

→ `09-state-pages.html`.

---

## ПРОМТ F — Експорт + handoff

```
Етап F: фінальний експорт.

1. Зведи всі дизайн-токени в один tokens.css файл (CSS-змінні OKLCH,
   готовий до вставки у globals.css Tailwind 4).

2. Експортуй кожну сторінку окремим HTML-файлом з inline Tailwind через CDN
   (для перегляду без зборки).

3. Створи design-handoff.md з:
   - переліком усіх компонентів і де вони використовуються;
   - mapping старих файлів → нових (для кодової інтеграції);
   - changelog проти оригінального дизайну.

4. Збережи папкою у zip разом з усіма HTML.
```

Завантажте zip, розпакуйте у `eco-shop/design/`, і далі використайте Claude Code
для інтеграції в `.tsx` файли.

---

## Поради під час роботи

1. **Завжди починайте сесію з посилання на design-brief.md** — щоб Клод не
   "забував" контекст бренду.

2. **Inline-правки** — швидші за переписування промту. Клікаєте на елемент,
   міняєте текст / колір / spacing, кажете "застосуй до решти".

3. **Adjustment knobs** використовуйте після генерації — тонке налаштування
   spacing/radius/font weights без переписування.

4. **Зберігайте версії** — після кожного OK експортуйте HTML локально, навіть
   якщо в інтерфейсі є undo. Це гарантія від втрати роботи.

5. **Реальні дані** — у промтах вказуйте реальні товари ("Бамбукова зубна щітка",
   "$8"), а не Lorem Ipsum. Дизайн виглядатиме чесніше.

6. **Кожну сторінку** просіть у двох вимірах: desktop (1440px) + mobile (393px).
   Так одразу побачите проблеми адаптивності.

7. **Якщо щось виглядає "AI-stockish"** — попросіть «зроби менш AI, більш
   editorial, як на patagonia.com».

8. **Після завершення Етапу C-D** запустіть Claude Code у репозиторії й
   скажіть: «застосуй design з папки design/03-page-home.html до app/page.tsx —
   адаптуй під next-intl + framer motion». Code сам зробить інтеграцію.

---

## Чек-лист готовності

- [ ] Style guide (HTML)
- [ ] Global components (HTML)
- [ ] 11 веб-сторінок (HTML × 2 viewport)
- [ ] 11 мобільних screen-ів (HTML)
- [ ] State pages (HTML)
- [ ] tokens.css
- [ ] design-handoff.md
- [ ] zip-архів усього

Коли всі експорти готові — скажіть тут, я допоможу інтегрувати в реальний
код через Claude Code.
