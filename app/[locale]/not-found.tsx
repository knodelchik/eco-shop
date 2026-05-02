'use client';

import { Link } from '@/navigation';
import { ArrowLeft, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function NotFound() {
  const t = useTranslations('NotFound');
  const tCommon = useTranslations('Common');

  return (
    <div className="min-h-[calc(100vh-8rem)] grid lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 lg:px-16 py-20">
        <div className="max-w-md">
          <div className="section-label mb-4">{t('label')}</div>
          <h1 className="font-display text-7xl md:text-9xl tracking-tight leading-[0.9]">
            {t('titleFirst')}<br />
            {t('titleSecond')} <span className="text-primary">{t('titleHighlight')}</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            {t('subtitle')}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 h-12 px-6 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity active:scale-[0.99]"
            >
              <ArrowLeft className="w-4 h-4" />
              {tCommon('backToHome')}
            </Link>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 h-12 px-6 border border-border rounded-xl text-foreground font-medium hover:bg-muted transition-colors"
            >
              <Search className="w-4 h-4" />
              {t('toShop')}
            </Link>
          </div>
        </div>
      </div>

      <div className="hidden lg:block relative overflow-hidden border-l border-border">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(160deg, oklch(0.92 0.04 130) 0%, oklch(0.45 0.11 150) 130%)' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="font-display text-[28rem] leading-none text-white/30 select-none"
            aria-hidden
          >
            404
          </div>
        </div>
      </div>
    </div>
  );
}
