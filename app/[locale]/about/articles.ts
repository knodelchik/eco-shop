/**
 * Демо-статті для блогу EcoShop.
 * У продакшен-версії дані тягнулись би з БД (наприклад, таблиця `articles` у Neon)
 * або з headless-CMS типу Sanity / Contentful.
 */
export type Article = {
  slug: string;
  title: { uk: string; en: string };
  excerpt: { uk: string; en: string };
  category: 'guides' | 'knowledge' | 'lifestyle';
  readingTime: number; // у хвилинах
  publishedAt: string; // ISO-дата
  author: string;
  featured?: boolean;
  bg: string; // CSS-градієнт для cover-блока
};

export const ARTICLES: Article[] = [
  {
    slug: '5-zvichok-zero-waste',
    featured: true,
    title: {
      uk: '5 простих звичок для zero-waste життя',
      en: '5 simple habits for a zero-waste life',
    },
    excerpt: {
      uk: 'Перехід на свідомий спосіб життя не починається з великих змін — починається з ранкової кави без одноразового стаканчика.',
      en: 'Switching to a conscious lifestyle doesn\'t start with big changes — it starts with morning coffee without a disposable cup.',
    },
    category: 'guides',
    readingTime: 7,
    publishedAt: '2026-04-22',
    author: 'Леся Ковальчук',
    bg: 'linear-gradient(160deg, oklch(0.92 0.04 130) 0%, oklch(0.45 0.11 150) 130%)',
  },
  {
    slug: 'chomu-bambuk',
    title: {
      uk: 'Чому бамбук — найкращий матеріал для щоденних товарів',
      en: 'Why bamboo is the best material for everyday products',
    },
    excerpt: {
      uk: 'Він росте на 91 см на день, не потребує добрив і повністю розкладається за 4 місяці.',
      en: 'It grows 91cm a day, needs no fertilizer, and decomposes in 4 months.',
    },
    category: 'knowledge',
    readingTime: 5,
    publishedAt: '2026-04-15',
    author: 'Максим Чернов',
    bg: 'linear-gradient(200deg, oklch(0.95 0.015 100) 0%, oklch(0.55 0.13 150) 130%)',
  },
  {
    slug: 'vybyraemo-pliashku',
    title: {
      uk: 'Як вибрати багаторазову пляшку для води',
      en: 'How to choose a reusable water bottle',
    },
    excerpt: {
      uk: 'Скло, нержавіюча сталь чи трітан — порівнюємо матеріали і знаходимо ваш ідеальний варіант.',
      en: 'Glass, stainless steel, or tritan — comparing materials and finding your ideal option.',
    },
    category: 'guides',
    readingTime: 6,
    publishedAt: '2026-04-08',
    author: 'Ірина Гончаренко',
    bg: 'linear-gradient(140deg, oklch(0.94 0.03 110) 0%, oklch(0.78 0.14 150) 130%)',
  },
  {
    slug: 'naturalne-mylo',
    title: {
      uk: 'Натуральне мило vs промислове: що краще для шкіри',
      en: 'Natural soap vs industrial: which is better for the skin',
    },
    excerpt: {
      uk: 'Несподіване відкриття: мильні бруски виявилися добрішими до шкіри, ніж "ніжні" гелі для душу.',
      en: 'Surprising discovery: bar soaps turned out to be kinder to skin than "gentle" body washes.',
    },
    category: 'knowledge',
    readingTime: 8,
    publishedAt: '2026-03-30',
    author: 'Олена Гриценко',
    bg: 'linear-gradient(180deg, oklch(0.95 0.02 100) 0%, oklch(0.42 0.13 150) 130%)',
  },
  {
    slug: 'karbon-nejtralna-dostavka',
    title: {
      uk: 'Карбон-нейтральна доставка: як це працює насправді',
      en: 'Carbon-neutral delivery: how it actually works',
    },
    excerpt: {
      uk: 'Розбираємо чесно: що таке карбон-офсет, чому це не "зелена обгортка" і як EcoShop рахує свій слід.',
      en: 'An honest breakdown: what carbon offsets are, why it\'s not "greenwashing", and how EcoShop calculates its footprint.',
    },
    category: 'knowledge',
    readingTime: 9,
    publishedAt: '2026-03-22',
    author: 'Тарас Мельник',
    bg: 'linear-gradient(220deg, oklch(0.92 0.04 130) 0%, oklch(0.55 0.13 150) 130%)',
  },
  {
    slug: 'sertyfikaty-eko',
    title: {
      uk: 'GOTS, OEKO-TEX, COSMOS: розбираємо еко-сертифікати',
      en: 'GOTS, OEKO-TEX, COSMOS: decoding eco certifications',
    },
    excerpt: {
      uk: 'Які значки на упаковці справді щось означають, а які — лише маркетинг.',
      en: 'Which packaging labels actually mean something, and which are just marketing.',
    },
    category: 'knowledge',
    readingTime: 6,
    publishedAt: '2026-03-14',
    author: 'Ірина Гончаренко',
    bg: 'linear-gradient(160deg, oklch(0.94 0.03 110) 0%, oklch(0.78 0.14 150) 130%)',
  },
  {
    slug: 'minimalist-kuhnia',
    title: {
      uk: 'Мінімалістична кухня: 12 речей, без яких можна обійтись',
      en: 'A minimalist kitchen: 12 things you can do without',
    },
    excerpt: {
      uk: 'Прибираємо одноразові серветки, плівку, пластикові пакети — і нічого не втрачаємо.',
      en: 'Cutting paper towels, cling film, plastic bags — and losing nothing.',
    },
    category: 'lifestyle',
    readingTime: 5,
    publishedAt: '2026-03-04',
    author: 'Леся Ковальчук',
    bg: 'linear-gradient(200deg, oklch(0.95 0.015 100) 0%, oklch(0.45 0.11 150) 130%)',
  },
];

export const CATEGORIES = [
  { id: 'all', label: { uk: 'Всі статті', en: 'All articles' } },
  { id: 'guides', label: { uk: 'Гайди', en: 'Guides' } },
  { id: 'knowledge', label: { uk: 'Знання', en: 'Knowledge' } },
  { id: 'lifestyle', label: { uk: 'Стиль життя', en: 'Lifestyle' } },
] as const;
