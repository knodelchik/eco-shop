'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

const CATEGORIES = [
  {
    key: 'sharpeners',
    bg: 'linear-gradient(160deg, oklch(0.94 0.03 110) 0%, oklch(0.78 0.14 150) 120%)',
    titleKey: 'titleSharpeners',
    descKey: 'descSharpeners',
  },
  {
    key: 'stones',
    bg: 'linear-gradient(200deg, oklch(0.95 0.015 100) 0%, oklch(0.45 0.11 150) 130%)',
    titleKey: 'titleGrindingStones',
    descKey: 'descGrindingStones',
  },
  {
    key: 'accessories',
    bg: 'linear-gradient(140deg, oklch(0.92 0.04 130) 0%, oklch(0.55 0.13 150) 130%)',
    titleKey: 'titleAccessories',
    descKey: 'descAccessories',
  },
];

export default function CategoriesSection() {
  const t = useTranslations('CardCarousel');
  const tHome = useTranslations('Home');
  const tCommon = useTranslations('Common');

  return (
    <section id="our-products" className="max-w-7xl mx-auto px-6 py-20 md:py-28">
      <div className="flex items-end justify-between mb-12 gap-4">
        <div>
          <div className="section-label mb-3">{tHome('categoriesLabel')}</div>
          <h2 className="font-display text-4xl md:text-5xl tracking-tight">{tHome('categoriesTitle')}</h2>
        </div>
        <Link
          href="/shop"
          className="hidden md:inline-flex items-center gap-1 text-sm text-foreground hover:text-primary transition-colors"
        >
          {tCommon('viewProducts')} <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {CATEGORIES.map((cat, i) => (
          <motion.div
            key={cat.key}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <Link
              href={`/shop?category=${cat.key}`}
              className="group block relative overflow-hidden rounded-2xl aspect-[4/5] border border-border transition-transform duration-500 hover:-translate-y-1"
              style={{ background: cat.bg }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
              <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                <h3 className="font-display text-3xl tracking-tight mb-2">
                  {t(cat.titleKey)}
                </h3>
                <p className="text-sm text-white/85 max-w-xs leading-relaxed">
                  {t(cat.descKey)}
                </p>
                <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium">
                  {tCommon('watchAll')} <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
