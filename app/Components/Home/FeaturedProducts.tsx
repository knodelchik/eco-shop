'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/navigation';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Product } from '@/app/types/products';
import WishlistButton from '@/app/Components/WishlistButton';

const createSlug = (str: string) =>
  str.toLowerCase().trim().replace(/[\s\W-]+/g, '-');

// Градієнт-фон замість фото для кожної категорії
const CATEGORY_BG: Record<string, string> = {
  sharpeners: 'linear-gradient(160deg, oklch(0.94 0.03 110) 0%, oklch(0.78 0.14 150) 130%)',
  stones: 'linear-gradient(200deg, oklch(0.95 0.015 100) 0%, oklch(0.55 0.13 150) 130%)',
  accessories: 'linear-gradient(140deg, oklch(0.92 0.04 130) 0%, oklch(0.45 0.11 150) 130%)',
};

const ECO_BADGES = (p: Product) => {
  const out: { label: string; cls: string }[] = [];
  if (p.isVegan) out.push({ label: 'Vegan', cls: 'eco-badge-vegan' });
  if (p.isPlasticFree) out.push({ label: 'Plastic-free', cls: 'eco-badge-pf' });
  if (p.isBiodegradable) out.push({ label: 'Biodegradable', cls: 'eco-badge-bio' });
  return out.slice(0, 2);
};

export default function FeaturedProducts() {
  const tHome = useTranslations('Home');
  const tCommon = useTranslations('Common');
  const CATEGORY_LABEL: Record<string, string> = {
    sharpeners: tCommon('categoryLabels.sharpeners'),
    stones: tCommon('categoryLabels.stones'),
    accessories: tCommon('categoryLabels.accessories'),
  };
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Product[]) => {
        setProducts(data.slice(0, 8));
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-6 py-20 md:py-28">
      <div className="flex items-end justify-between mb-12 gap-4">
        <div>
          <div className="section-label mb-3">{tHome('featuredLabel')}</div>
          <h2 className="font-display text-4xl md:text-5xl tracking-tight">
            {tHome('featuredTitle')}
          </h2>
        </div>
        <Link
          href="/shop"
          className="inline-flex items-center gap-1 text-sm text-foreground hover:text-primary transition-colors"
        >
          {tCommon('viewAll')} <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card overflow-hidden">
              <div className="aspect-[4/5] skel" />
              <div className="p-5 space-y-2">
                <div className="h-3 w-16 skel" />
                <div className="h-5 w-3/4 skel" />
                <div className="h-4 w-1/4 skel mt-3" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          {tHome('featuredEmpty')}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {products.map((p, i) => (
            <motion.article
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: (i % 4) * 0.05 }}
              className="bg-card border border-border rounded-2xl overflow-hidden group hover:-translate-y-0.5 hover:shadow-lg transition-all"
            >
              <Link href={`/shop/${createSlug(p.title)}`} className="block">
                <div
                  className="aspect-[4/5] overflow-hidden relative"
                  style={{ background: CATEGORY_BG[p.category] ?? CATEGORY_BG.accessories }}
                >
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {ECO_BADGES(p).map((b) => (
                      <span key={b.label} className={`eco-badge ${b.cls}`}>
                        {b.label}
                      </span>
                    ))}
                  </div>
                  <div className="absolute top-3 right-3">
                    <WishlistButton
                      productId={p.id}
                      size="sm"
                      onClick={(e: React.MouseEvent) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    />
                  </div>
                </div>
                <div className="p-5">
                  <div className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">
                    {CATEGORY_LABEL[p.category] ?? p.category}
                  </div>
                  <h3 className="font-display text-lg leading-tight mb-3 line-clamp-2">
                    {p.title_uk || p.title}
                  </h3>
                  <div className="flex items-baseline justify-between mt-4">
                    <span className="text-lg font-semibold">${p.price}</span>
                    {p.stock > 0 ? (
                      <span className="text-xs text-muted-foreground">{tCommon('inStock')}</span>
                    ) : (
                      <span className="text-xs text-destructive">{tCommon('outOfStock')}</span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      )}
    </section>
  );
}
