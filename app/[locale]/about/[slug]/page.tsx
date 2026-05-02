'use client';

import { use } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Link } from '@/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowUpRight, Clock, Share2 } from 'lucide-react';
import { ARTICLES, type Article } from '../articles';

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

export default function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const locale = useLocale() as 'uk' | 'en';
  const router = useRouter();

  const article = ARTICLES.find((a) => a.slug === slug);

  if (!article) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-32 text-center">
        <h1 className="font-display text-5xl mb-4">404</h1>
        <p className="text-muted-foreground mb-8">Статтю не знайдено.</p>
        <Link
          href="/about"
          className="inline-flex items-center gap-2 px-5 h-10 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" /> До журналу
        </Link>
      </div>
    );
  }

  // Стаття-плейсхолдер контенту (у продакшені — Markdown / MDX / Sanity)
  const contentParagraphs = [
    'Це демонстраційна стаття журналу EcoShop. У реальному продакшен-сценарії контент тут був би Markdown-документом або статтею з headless-CMS.',
    'Підхід до свідомого споживання — це не радикальна зміна, а серія малих рішень. Перехід на бамбукову зубну щітку економить ~4 кг пластику на рік. Заміна одноразових серветок на льняні економить 30% продуктового бюджету.',
    'У EcoShop ми перевіряємо кожен товар за чотирма критеріями: матеріал, біорозкладність, ланцюжок постачання та довговічність. Лише 12% з тих, кого ми тестуємо, проходять усі чотири.',
  ];

  // Інші статті (related)
  const related = ARTICLES.filter(
    (a) => a.slug !== article.slug && a.category === article.category
  ).slice(0, 3);

  return (
    <article className="max-w-4xl mx-auto px-6 py-16 md:py-24">
      {/* Back link */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" /> Назад
      </button>

      {/* Header */}
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-xs uppercase tracking-widest text-primary font-semibold">
            {CATEGORY_LABELS[article.category][locale]}
          </span>
          <span className="text-muted-foreground" aria-hidden>·</span>
          <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <Clock className="w-3 h-3" /> {article.readingTime} хв читання
          </span>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-display text-4xl md:text-6xl tracking-tight leading-[1.05] mb-6"
        >
          {article.title[locale]}
        </motion.h1>

        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl">
          {article.excerpt[locale]}
        </p>

        <div className="flex items-center justify-between mt-8 pt-8 border-t border-border">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-medium text-sm">
              {article.author.charAt(0)}
            </div>
            <div>
              <div className="font-medium text-sm">{article.author}</div>
              <div className="text-xs text-muted-foreground">
                {formatDate(article.publishedAt, locale)}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 px-3 h-9 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
          >
            <Share2 className="w-4 h-4" /> Поділитися
          </button>
        </div>
      </header>

      {/* Cover */}
      <div
        className="aspect-[16/9] rounded-3xl border border-border mb-12"
        style={{ background: article.bg }}
      />

      {/* Body */}
      <div className="prose prose-lg max-w-none mb-16">
        {contentParagraphs.map((p, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="text-lg leading-relaxed text-foreground/90 mb-6 max-w-3xl"
          >
            {p}
          </motion.p>
        ))}

        <blockquote className="my-12 pl-6 border-l-2 border-primary">
          <p className="font-display text-2xl md:text-3xl italic text-foreground leading-snug max-w-3xl">
            «Свідоме споживання — це не аскеза. Це повага до речей, які вже є в твоєму домі.»
          </p>
          <footer className="mt-4 text-sm text-muted-foreground">
            — {article.author}
          </footer>
        </blockquote>

        <p className="text-lg leading-relaxed text-foreground/90 max-w-3xl">
          Якщо вам подобається тема — підпишіться на наш місячний журнал. Ми не
          пишемо про модний скандинавський мінімалізм. Ми пишемо про те, що
          справді працює — у Києві, Львові, Одесі та десь у селі під Полтавою.
        </p>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="border-t border-border pt-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="section-label mb-2">Читати далі</div>
              <h2 className="font-display text-3xl md:text-4xl tracking-tight">
                У цій же категорії
              </h2>
            </div>
            <Link
              href="/about"
              className="hidden md:inline-flex items-center gap-1 text-sm text-foreground hover:text-primary transition-colors"
            >
              Усі статті <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {related.map((r) => (
              <Link key={r.slug} href={`/about/${r.slug}`} className="block group">
                <div
                  className="aspect-[5/3] rounded-2xl border border-border mb-4 transition-all duration-500 group-hover:-translate-y-1"
                  style={{ background: r.bg }}
                />
                <h3 className="font-display text-lg leading-tight mb-2 transition-colors group-hover:text-primary">
                  {r.title[locale]}
                </h3>
                <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {r.readingTime} хв
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
