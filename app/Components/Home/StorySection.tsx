'use client';

import { Link } from '@/navigation';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function StorySection() {
  const tHome = useTranslations('Home');
  const tCommon = useTranslations('Common');

  return (
    <section className="max-w-7xl mx-auto px-6 py-20 md:py-28">
      <div className="bg-card border border-border rounded-3xl overflow-hidden">
        <div className="grid md:grid-cols-12 min-h-[480px]">
          <motion.div
            className="md:col-span-7 p-10 md:p-16 flex flex-col justify-center"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="section-label mb-5">{tHome('storyLabel')}</div>
            <h2 className="font-display text-4xl md:text-6xl leading-[0.95] tracking-tight">
              {tHome('storyTitleFirst')} <br />
              <span className="text-primary">{tHome('storyTitleSecond')}</span>
            </h2>
            <p className="mt-6 text-muted-foreground max-w-md leading-relaxed">
              {tHome('storyDescription')}
            </p>
            <div className="mt-8 flex gap-3">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 px-6 h-12 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
              >
                {tCommon('readMore')} <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-6 max-w-md">
              <div>
                <div className="font-display text-3xl text-primary">{tHome('storyStat1')}</div>
                <div className="text-xs text-muted-foreground mt-1">{tHome('storyStat1Label')}</div>
              </div>
              <div>
                <div className="font-display text-3xl text-primary">{tHome('storyStat2')}</div>
                <div className="text-xs text-muted-foreground mt-1">{tHome('storyStat2Label')}</div>
              </div>
              <div>
                <div className="font-display text-3xl text-primary">{tHome('storyStat3')}</div>
                <div className="text-xs text-muted-foreground mt-1">{tHome('storyStat3Label')}</div>
              </div>
            </div>
          </motion.div>

          <div
            className="md:col-span-5 relative min-h-[300px]"
            style={{ background: 'linear-gradient(160deg, oklch(0.92 0.04 130) 0%, oklch(0.45 0.11 150) 130%)' }}
          />
        </div>
      </div>
    </section>
  );
}
