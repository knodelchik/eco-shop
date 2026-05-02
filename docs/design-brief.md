# EcoShop — Design Brief

Документ для роботи з Claude Design (claude.ai/design). Розрахований на створення
повного нового дизайну веб-сайту та мобільного застосунку з нуля.

---

## 1. Бренд

**Назва:** EcoShop
**Тагліни (uk / en):**
- "Свідоме життя — без компромісів"
- "Conscious living, without compromise"

**Місія:** дати людям зручний доступ до перевірених еко-товарів, щоб щоденні звички
ставали екологічно дружніми без зайвого зусилля.

**Цінності:** прозорість, натуральність, мінімалізм, повага до матеріалу,
довговічність речей.

**Тон голосу:** теплий, спокійний, обізнаний. Без агресивного маркетингу,
без надмірної емоційності, без капіталізації як крик. Розповідаємо, не продаємо.

**Цільова аудиторія:**
- Основна: 25–40 років, міські професіонали зі середнім+ доходом, екологічно
  свідомі, цінують якість понад кількість.
- Вторинна: 18–25, студенти/молоді спеціалісти, перехід на zero-waste.

---

## 2. Візуальна мова

**Стилеві ключові слова:** мінімалізм, біопластика, натуральні матеріали,
сонячне світло, ботаніка, "тихий розкіш" (quiet luxury), wabi-sabi.

**Інспірація (study and reference):**
- aesop.com — типографіка, повітря, темно-зелена текстура
- patagonia.com — стателіснутість, чесність, фото природи
- allbirds.com — мінімалістичний продукт-фокус, м'які кольори
- cocokind.com — clean cosmetics, бежеві акценти
- goop.com — premium редакторський стиль
- everlane.com — прозорість + product photography
- notion.so — функціональний мінімалізм, типографічна ієрархія

**Чого уникаємо:**
- кричущих "эко-зелених" градієнтів, листочків з emoji, sparkle-ефектів
- стокових фото з посміхненими людьми тримаючими листочок
- надмірної анімованості (parallax, паралельні об'єкти що рухаються в різні боки)
- агресивних SALE-баннерів і таймерів зворотного відліку

---

## 3. Кольорова система (OKLCH)

```css
/* Light theme */
--background:    oklch(0.985 0.012 95);   /* #FBFAF5 — warm off-white */
--foreground:    oklch(0.21 0.02 145);    /* #1F2421 — earthy near-black */
--card:          oklch(1 0 0);            /* #FFFFFF */
--muted:         oklch(0.95 0.015 100);   /* #F2EFE8 — pale beige */
--muted-foreground: oklch(0.5 0.04 145);  /* #5C6B61 — moss */
--primary:       oklch(0.45 0.11 150);    /* #2D6A4F — forest green */
--primary-foreground: oklch(0.99 0.01 95);
--accent:        oklch(0.78 0.14 150);    /* #52B788 — sage */
--accent-foreground: oklch(0.22 0.04 145);
--secondary:     oklch(0.94 0.03 110);    /* pale sage */
--secondary-foreground: oklch(0.32 0.08 150);
--border:        oklch(0.9 0.02 110);     /* #E0DDD3 */
--input:         oklch(0.92 0.018 110);
--destructive:   oklch(0.58 0.22 28);     /* #C44536 — terracotta */
--ring:          oklch(0.62 0.12 150);

/* Dark theme */
--background:    oklch(0.18 0.02 150);    /* #1A2A23 — deep moss */
--foreground:    oklch(0.96 0.015 95);    /* #F5F2E8 */
--card:          oklch(0.23 0.025 150);
--muted:         oklch(0.3 0.025 145);
--muted-foreground: oklch(0.74 0.04 110);
--primary:       oklch(0.78 0.14 150);    /* sage у темному режимі */
--primary-foreground: oklch(0.18 0.04 150);
--accent:        oklch(0.55 0.13 150);
--border:        oklch(1 0 0 / 12%);
```

**Акцентні (для бейджів/станів):**
- Vegan: `#7CB518` (свіжо-зелений)
- Biodegradable: `#A4AC86` (оливковий)
- Plastic-free: `#52B788` (sage)
- Limited edition / sale: terracotta `#C44536`

---

## 4. Типографіка

**Display + Headings:** Fraunces (серіф з характером, для заголовків,
нагадує редакторський стиль) — Google Fonts.
**Body + UI:** Inter (нейтральний sans, чудово читається) — Google Fonts.
**Альтернатива:** Geist Sans (вже у проекті) — якщо не хочеться додавати Inter.

**Шкала (mobile / desktop):**

| Token | mobile | desktop | weight |
|---|---|---|---|
| display | 40 / 48 | 64 / 80 | 400 (Fraunces) |
| h1 | 32 | 48 | 500 |
| h2 | 28 | 36 | 500 |
| h3 | 22 | 28 | 500 |
| h4 | 18 | 22 | 600 |
| body-lg | 18 | 18 | 400 |
| body | 16 | 16 | 400 |
| body-sm | 14 | 14 | 400 |
| caption | 12 | 12 | 500 |

Заголовки: tracking trochi tighter (-0.02em), line-height 1.1.
Body: line-height 1.6, max-width 65ch для абзаців.

---

## 5. Сітка, відступи, форма

- Grid: 12-колонок, gutter 24px (desktop), 16px (mobile).
- Container max-width: 1280px (центрований, padding 24-48px).
- Section vertical spacing: 96-128px desktop / 64-80px mobile.
- Component spacing: 8 / 12 / 16 / 24 / 32 / 48 / 64.
- Border radius: 0 (категорично) / 8 / 12 / 16 / full. Базовий = 12.
- Shadows: дуже мінімально. Один рівень `shadow-sm` для карток,
  `shadow-lg` для модалів. Без неонових/кольорових тіней.
- Borders: 1px `var(--border)` — тонкі, ненав'язливі.

---

## 6. Іконографія

- Бібліотека: **Lucide React** (в проекті вже встановлена).
- Стиль: outline, stroke 1.5-1.75.
- Розміри: 16 / 20 / 24 (стандартно у UI).
- Не використовувати кольорові емоджі чи 3D-іконки.
- Власні іконки еко-сертифікатів: створити 4 кастомні (vegan / biodegradable /
  plastic-free / fair-trade) у тому ж outline-стилі.

---

## 7. Фотографія / зображення

- Світло: природне, м'яке, золоте.
- Композиція: продукт у руках, на дерев'яній/льняній поверхні, з ботанікою поряд.
- Кольори фону для catalog: warm off-white, beige, soft sage.
- Уникати: спалаху, синтетичного фону, контрастного освітлення.
- Минімум 3 фото на товар: 1 hero (3:4), 1 lifestyle (4:5), 1 деталь (1:1).
- AI-зображення припустимі, але без надмірно "пластикового" вигляду.

---

## 8. Анімація / рух

Принцип: **підказувати, не відволікати**.

- Page transitions: fade 200ms ease-out.
- Hover на картках: `scale(1.01)` + soft shadow, 250ms.
- Кнопки: `active:scale(0.98)` для тактильного відчуття.
- Список товарів: stagger fade-in (delay 30ms на елемент).
- Скрол-анімації: дуже стримані `whileInView`, без parallax.
- Бібліотека: Framer Motion (вже у проекті).

Чого НЕ робимо: бігучих елементів, бекграунд-blob, parallax зум-аутів,
маркі-стрічок з товарами.

---

## 9. Інвентар компонентів (UI Kit)

**Базові:**
- Button (primary / secondary / outline / ghost / destructive × sm/md/lg + icon-only)
- Input / Textarea / Select / Checkbox / Switch / Radio
- Badge (default / secondary / outline / eco-cert)
- Tag (для фільтрів — з X-кнопкою для видалення)
- Avatar (з fallback ініціалами)
- Tooltip
- Skeleton
- Spinner
- Progress bar (для checkout-кроків)

**Композити:**
- Card (Header / Content / Footer)
- ProductCard (image / badges / title / price / wishlist / quick-add)
- CategoryCard (великий, з фоновим зображенням)
- Banner (інформаційний рядок зверху)
- EmptyState (з ілюстрацією + CTA)
- Pagination
- Breadcrumbs

**Overlay:**
- Dialog / Modal
- Sheet / Drawer (з боку — для корзини, фільтрів, мобільного меню)
- Popover
- Toast (sonner — вже у проекті)
- Command palette (для пошуку, optional)

**Форми:**
- Form (з полями, валідацією, error helpers)
- AddressForm (країна + штат + місто + вулиця + zip + телефон)
- PaymentMethodPicker
- AuthForm (sign-in / sign-up / forgot)

---

## 10. Веб-сторінки (з контентними брифами)

### 10.1 / (Home)
**Мета:** показати філософію, спрямувати у каталог, зловити email.

Секції:
1. **Hero** — повноекранне фото природи / товару, заголовок-tagline, 1 CTA "Магазин".
2. **Цінності-стрічка** (3-4 пункти): «Біорозкладні матеріали», «Безпластикова упаковка», «Українські майстри», «Карбон-нейтральна доставка».
3. **Категорії** (3 великі картки): Еко-косметика, Багаторазовий посуд, Zero-waste аксесуари.
4. **Featured products** (4-8 товарів) — "Вибір редакції".
5. **Story-secція** (4:6 layout фото+текст) — про компанію в 2-3 абзаци.
6. **Editorial / Журнал** (3 статті-картки) — гайди, приклади.
7. **Newsletter** — мінімалістична форма.
8. Footer — 4 колонки: магазин, про нас, підтримка, юридичне.

### 10.2 /shop (Catalog)
- Хедер сторінки з заголовком та коротким описом.
- Sticky toolbar: search input | sort dropdown | filter button.
- Sidebar (desktop) / Sheet (mobile) фільтрів: категорія, ціновий діапазон,
  чекбокси (vegan / biodegradable / plastic-free), країна виробництва.
- Grid: 4 колонки desktop, 2 mobile, grid-gap 24/16.
- Empty state: "Нічого не знайдено — спробуйте змінити фільтри".
- Pagination внизу або infinite scroll.

### 10.3 /shop/[slug] (Product Detail)
Layout: 2 колонки desktop (50/50), 1 колонка mobile.

**Ліва (галерея):**
- Headline image (3:4)
- Thumbnails знизу (4-6)
- Zoom on hover (desktop)

**Права (інфо):**
- Категорія (caption-розмір) + назва (h1)
- Eco-бейджі (3-4)
- Ціна (велика, primary-color)
- Stepper кількості + кнопка "Додати в корзину" (full-width primary)
- Wishlist + Share іконки
- Accordion або Tabs:
  - Опис
  - Склад / матеріали
  - Догляд та використання
  - Доставка та повернення
  - Еко-вплив (carbon footprint, packaging)
- "З цим купують" (4 товари)
- Reviews (середній рейтинг + список)

### 10.4 /cart (Cart)
- Список товарів (image, назва, варіант, ціна, stepper, видалити)
- Підсумок справа: subtotal, доставка, total, кнопка "Оформити".
- Promo-code field.
- Empty state: ілюстрація + "Перейти у магазин".

### 10.5 /checkout (Checkout, 3 кроки)
Step indicator зверху: Адреса → Доставка → Оплата.
1. Адреса (форма + список збережених адрес).
2. Метод доставки (radio cards: Standard $5 / Express $10 / Pickup).
3. Метод оплати: PayPal / Card / Monobank.
4. Огляд замовлення + кнопка "Оплатити".

### 10.6 /profile (User dashboard)
Двоколонковий: sidebar з табами, контент справа.

Tabs:
- Особисті дані
- Адреси
- Замовлення (з історією і статусами)
- Обране
- Налаштування (мова, тема, сповіщення)

### 10.7 /auth
Single-page з 3 view (через ?view=signin/signup/forgot).
Лівий бік: фото / ілюстрація з brand statement.
Правий: форма (мінімалістична, з floating labels).
Soft transitions між видами.

### 10.8 /about (Story)
Editorial layout, 6-8 секцій з великими фото та довгим текстом. Місія,
історія, команда, постачальники, журнал відповідальності.

### 10.9 /contact
Hero з заголовком + контактна форма зліва, мапа або фото справа,
блок з email/phone/social знизу.

### 10.10 /404, /500
Великий display-заголовок, коротке пояснення, CTA на головну.
Без жартів про "загубленого панду" — стримано і елегантно.

### 10.11 /admin
Окремий шар, але в тій самій палітрі.
- Dashboard: 4 metric cards + chart + останні замовлення.
- Products: таблиця з search, sort, sheet для редагування.
- Orders: таблиця з filter, drawer з деталями.
- Newsletter: список підписників + bulk-email composer.

---

## 11. Mobile App (Expo) — Screens

Tab-bar навігація знизу: Каталог / Пошук / Корзина / Профіль (Home button center).

### 11.1 Onboarding (3 screens)
Перший запуск: «Що таке EcoShop», «Як ми обираємо товари», «Готові почати».
Свайпом між екранами, точки-індикатор знизу, "Skip" зверху.

### 11.2 Home / Catalog (default tab)
- Sticky header: лого + іконка пошуку + іконка профілю.
- Горизонтальний скрол категорій (chips).
- Grid 2 колонки товарів.
- Pull-to-refresh.

### 11.3 Search
- Великий пошуковий input зверху.
- Trending searches.
- Останні запити.
- Live results (300ms debounce).

### 11.4 Product Detail
- Свайпер фото на повну ширину.
- Sticky bottom: ціна + "Додати в корзину" з haptic.
- Animated header (назва з'являється при скролі).
- Tabs/accordion з деталями.

### 11.5 Filters (bottom sheet)
- Свайп вверх знизу.
- Категорії, ціна (slider), чекбокси сертифікатів.
- "Apply" CTA, "Reset" link.

### 11.6 Cart
- Список з swipe-to-delete.
- Підсумок прикріплений знизу.
- "Checkout" full-width.

### 11.7 Checkout (multi-screen)
3 окремих screen-и (стек): адреса → доставка → оплата.
WebView для PayPal/Monobank.

### 11.8 Order tracking
- Статус-пайплайн (Pending → Paid → Shipped → Delivered) як progress.
- Map з трекінгом (опційно).
- Список товарів.

### 11.9 Profile
- Header з аватаром + ім'я + email.
- Меню: Замовлення, Обране, Адреси, Налаштування, Допомога, Вийти.
- Theme switcher.

### 11.10 Auth
3 screens: Sign in / Sign up / Forgot.
Великий заголовок зверху, форма посередині, links знизу.
Social sign-in (Google / Apple).

### 11.11 Settings
- Мова (uk/en)
- Тема (light/dark/system)
- Push-сповіщення (toggles)
- Видалити акаунт (destructive)

---

## 12. Інтеракції / стани

Кожен компонент має покривати: default, hover (web), pressed, focus, disabled,
loading, error, empty.

Loading-стани: skeletons (не spinners) для контенту.
Error: inline під полем + toast-сповіщення.
Empty states: ілюстрація + копірайт + CTA.

---

## 13. Доступність (a11y)

- Контраст: AA для усього тексту (4.5:1 для body, 3:1 для large).
- Focus rings обов'язкові — не приховувати.
- Aria-labels на icon-only кнопках.
- Keyboard navigation працює: Tab, Enter, Esc, Arrows у списках.
- Screen reader friendly: правильні теги (`<button>`, `<nav>`, `<main>`).

---

## 14. Тон копірайту

**Українською:**
- Тепло, без формальностей, без перебільшень.
- Уникати канцеляризмів («Здійснити покупку» → «Купити»).
- CTA: дієслова в інфінітиві або наказі («Додати у кошик», «Оформити»).
- Описи товарів: 2-3 короткі речення, що дають відчуття матеріалу.

**English:**
- Conversational, warm, confident.
- Avoid superlatives.
- Use sentence-case for buttons ("Add to cart" not "ADD TO CART").

---

## 15. Що очікую від Claude Design на виході

1. **Style guide** — single page з усіма компонентами, обома темами.
2. **Page mockups** — все 11 веб-сторінок, кожна desktop + mobile.
3. **Mobile app screens** — все 11 mobile-screens у iPhone-frame.
4. **Component library** — як HTML/Tailwind або React snippets.
5. **Експорт** — окремі HTML-файли для кожної сторінки + один master CSS.

---

Кінець документа. Завантажте цей файл у Claude Design разом зі скрінами
референсів та починайте з Етапу A нижче.
