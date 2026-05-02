'use client';

import { useState, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { Link } from '@/navigation';
import { motion } from 'framer-motion';
import { ArrowUpRight, Clock, Search } from 'lucide-react';
import { ARTICLES, CATEGORIES, type Article } from './articles';

const CATEGORY_LABELS: Record<Article['category'], { uk: string; en: string }> = {
  guides: { uk: 'Гайди', en: 'Guides' },
  knowledge: { uk: 'Знання', en: 'Knowledge' },
  lifestyle: { uk: 'Стиль життя', en: 'Lifestyle' },
};

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale === 'uk' ? 'uk-UA' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function BlogPage() {
  const locale = useLocale() as 'uk' | 'en';
  const [activeCategory, setActiveCategory] = useState<typeof CATEGORIES[number]['id']>('all');
  const [search, setSearch] = useState('');

  const featured = ARTICLES.find((a) => a.featured);
  const rest = ARTICLES.filter((a) => !a.featured);

  const filtered = useMemo(() => {
    return rest.filter((a) => {
      const matchCat = activeCategory === 'all' || a.category === activeCategory;
      const matchSearch =
        !search ||
        a.title[locale].toLowerCase().includes(search.toLowerCase()) ||
        a.excerpt[locale].toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [rest, activeCategory, search, locale]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
      {/* Hero */}
      <header className="mb-16 md:mb-20">
        <div className="section-label mb-4">Журнал EcoShop · 2026</div>
        <h1 className="font-display text-5xl md:text-7xl tracking-tight leading-[0.95] max-w-4xl">
          Думки про <span className="text-primary">свідоме споживання</span>.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
          Гайди, рецензії і чесні розмови про зменшення сліду, локальне виробництво
          та маленькі звички, що змінюють день.
        </p>
      </header>

      {/* Featured article */}
      {featured && (
        <Link href={`/about/${featured.slug}`} className="block group mb-20">
          <article className="grid md:grid-cols-12 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="md:col-span-7"
            >
              <div
                className="aspect-[16/10] rounded-3xl border border-border overflow-hidden transition-transform duration-500 group-hover:-translate-y-1"
                style={{ background: featured.bg }}
              />
            </motion.div>
            <div className="md:col-span-5">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs uppercase tracking-widest text-primary font-semibold">
                  Featured · {CATEGORY_LABELS[featured.category][locale]}
                </span>
              </div>
              <h2 className="font-display text-3xl md:text-4xl leading-tight tracking-tight mb-4 transition-colors group-hover:text-primary">
                {featured.title[locale]}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                {featured.excerpt[locale]}
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{featured.author}</span>
                <span aria-hidden>·</span>
                <span>{formatDate(featured.publishedAt, locale)}</span>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {featured.readingTime} хв
                </span>
              </div>
              <div className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium">
                Читати <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </div>
          </article>
        </Link>
      )}

      {/* Toolbar */}
      <div className="border-y border-border py-5 mb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Categories */}
          <nav className="flex flex-wrap items-center gap-1">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  activeCategory === c.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {c.label[locale]}
              </button>
            ))}
          </nav>

          {/* Search */}
          <div className="relative md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Пошук по статтях..."
              className="w-full pl-10 pr-4 h-10 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Articles grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-24">
          <div className="font-display text-3xl mb-2">Нічого не знайдено</div>
          <p className="text-muted-foreground mb-6">
            Спробуйте іншу категорію або очистіть пошук.
          </p>
          <button
            onClick={() => {
              setActiveCategory('all');
              setSearch('');
            }}
            className="inline-flex items-center gap-2 px-5 h-10 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            Показати всі
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {filtered.map((article, i) => (
            <ArticleCard key={article.slug} article={article} locale={locale} index={i} />
          ))}
        </div>
      )}

      {/* Newsletter CTA */}
      <section className="mt-24 md:mt-32 rounded-3xl bg-muted p-10 md:p-16 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="section-label mb-4">Розсилка</div>
          <h2 className="font-display text-3xl md:text-5xl leading-tight tracking-tight mb-4">
            Раз на місяць — еко-есеї та <span className="text-primary">нові товари</span>
          </h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Без спаму, без інфошуму. Тільки те, що ми самі прочитали б під ранкову каву.
          </p>
          <form className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <input
              type="email"
              placeholder="email@example.com"
              className="flex-1 h-12 px-4 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            <button
              type="submit"
              className="h-12 px-6 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              Підписатися
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

function ArticleCard({
  article,
  locale,
  index,
}: {
  article: Article;
  locale: 'uk' | 'en';
  index: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.4, delay: (index % 6) * 0.06 }}
    >
      <Link href={`/about/${article.slug}`} className="block group">
        <div
          className="aspect-[5/3] rounded-2xl border border-border overflow-hidden mb-5 transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-md"
          style={{ background: article.bg }}
        />
        <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-2">
          {CATEGORY_LABELS[article.category][locale]}
        </div>
        <h3 className="font-display text-xl md:text-2xl leading-snug tracking-tight mb-2 transition-colors group-hover:text-primary">
          {article.title[locale]}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">
          {article.excerpt[locale]}
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{article.author}</span>
          <span aria-hidden>·</span>
          <span>{formatDate(article.publishedAt, locale)}</span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3 h-3" /> {article.readingTime} хв
          </span>
        </div>
      </Link>
    </motion.article>
  );
}
