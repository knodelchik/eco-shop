'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import { motion } from 'framer-motion';

export default function HeroSection() {
  const t = useTranslations('Main');
  const tHome = useTranslations('Home');

  return (
    <section className="max-w-7xl mx-auto px-6 pt-12 md:pt-20 pb-20">
      <div className="grid md:grid-cols-12 gap-8 items-end">
        <motion.div
          className="md:col-span-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-label mb-4">{tHome('heroLabel')}</div>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95] tracking-tight">
            {t('heroTitle')} <br />
            <span className="text-primary">{t('about')}</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            {t('heroSubtitle')}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 px-6 h-12 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity active:scale-[0.98]"
            >
              {t('shop')}
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center justify-center gap-2 px-6 h-12 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition-colors active:scale-[0.98]"
            >
              {t('about')}
            </Link>
          </div>
        </motion.div>

        <motion.div
          className="md:col-span-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          <div className="grid grid-cols-2 gap-2">
            <div
              className="rounded-2xl aspect-[3/4]"
              style={{ background: 'linear-gradient(160deg, oklch(0.92 0.04 130) 0%, oklch(0.78 0.14 150) 100%)' }}
            />
            <div
              className="rounded-2xl aspect-[3/4] mt-8"
              style={{ background: 'linear-gradient(200deg, oklch(0.95 0.02 100) 0%, oklch(0.45 0.11 150) 100%)' }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
