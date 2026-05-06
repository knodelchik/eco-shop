'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { Product } from '../../types/products';
import Price from '@/app/Components/Price';
import WishlistButton from '@/app/Components/WishlistButton';
import { ProductImage } from '@/app/Components/ProductImage';
import { getProductImage } from '@/lib/product-image';

type Category = 'all' | 'sharpeners' | 'stones' | 'accessories';
type SortKey = 'newest' | 'price-asc' | 'price-desc' | 'popular';

interface ShopClientProps {
  initialProducts: Product[];
}

export default function ShopClient({ initialProducts }: ShopClientProps) {
  const t = useTranslations('Shop');
  const tCommon = useTranslations('Common');
  const searchParams = useSearchParams();
  const urlCategory = searchParams.get('category') as Category | null;

  const [activeCategory, setActiveCategory] = useState<Category>(
    urlCategory && ['sharpeners', 'stones', 'accessories'].includes(urlCategory)
      ? urlCategory
      : 'all'
  );
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [filters, setFilters] = useState({ vegan: false, biodegradable: false, plasticFree: false });
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    if (urlCategory && ['sharpeners', 'stones', 'accessories'].includes(urlCategory)) {
      setActiveCategory(urlCategory);
    }
  }, [urlCategory]);

  const filtered = useMemo(() => {
    let result = initialProducts;
    if (activeCategory !== 'all') {
      result = result.filter((p) => p.category === activeCategory);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.title.toLowerCase().includes(q) || (p.title_uk?.toLowerCase().includes(q) ?? false)
      );
    }
    if (filters.vegan) result = result.filter((p) => p.isVegan);
    if (filters.biodegradable) result = result.filter((p) => p.isBiodegradable);
    if (filters.plasticFree) result = result.filter((p) => p.isPlasticFree);

    const sorted = [...result];
    switch (sort) {
      case 'price-asc': sorted.sort((a, b) => a.price - b.price); break;
      case 'price-desc': sorted.sort((a, b) => b.price - a.price); break;
      case 'newest': sorted.sort((a, b) => b.id - a.id); break;
      case 'popular': break;
    }
    return sorted;
  }, [initialProducts, activeCategory, search, sort, filters]);

  const activeChips: { label: string; onRemove: () => void }[] = [];
  if (activeCategory !== 'all') {
    activeChips.push({
      label: tCommon(`categoryLabels.${activeCategory}` as 'categoryLabels.sharpeners'),
      onRemove: () => setActiveCategory('all'),
    });
  }
  if (filters.vegan) activeChips.push({ label: 'Vegan', onRemove: () => setFilters((f) => ({ ...f, vegan: false })) });
  if (filters.biodegradable) activeChips.push({ label: 'Biodegradable', onRemove: () => setFilters((f) => ({ ...f, biodegradable: false })) });
  if (filters.plasticFree) activeChips.push({ label: 'Plastic-free', onRemove: () => setFilters((f) => ({ ...f, plasticFree: false })) });

  const resetAll = () => {
    setActiveCategory('all');
    setSearch('');
    setFilters({ vegan: false, biodegradable: false, plasticFree: false });
  };

  return (
    <div className="max-w-7xl mx-auto px-6">
      {/* Page header */}
      <div className="pt-12 md:pt-16 pb-10">
        <div className="section-label mb-3">{t('label')}</div>
        <h1 className="font-display text-5xl md:text-6xl tracking-tight">
          {t('title')}
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          {t('heroSubtitle')}
        </p>
      </div>

      {/* Toolbar */}
      <div className="sticky top-16 z-30 bg-background/85 backdrop-blur-md py-4 -mx-6 px-6 border-y border-border mb-8">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-10 pr-4 h-10 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>

          <span className="hidden sm:block text-sm text-muted-foreground">
            {filtered.length} {tCommon('results', { count: filtered.length })}
          </span>

          <div className="ml-auto flex items-center gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-10 px-3 pr-8 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="newest">{t('sortNewest')}</option>
              <option value="price-asc">{t('sortPriceAsc')}</option>
              <option value="price-desc">{t('sortPriceDesc')}</option>
              <option value="popular">{t('sortPopular')}</option>
            </select>

            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="lg:hidden h-10 px-3 inline-flex items-center gap-2 bg-card border border-border rounded-xl text-sm hover:bg-muted transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {tCommon('filters')}
            </button>
          </div>
        </div>

        {/* Active chips */}
        {activeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {activeChips.map((c) => (
              <button
                key={c.label}
                onClick={c.onRemove}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-xs rounded-full hover:bg-primary/15 transition-colors"
              >
                {c.label}
                <X className="w-3 h-3" />
              </button>
            ))}
            <button onClick={resetAll} className="text-xs text-muted-foreground hover:text-foreground ml-2">
              {tCommon('resetAll')}
            </button>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-10 pb-20">
        {/* Sidebar — desktop */}
        <aside className="hidden lg:block">
          <FilterPanel
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            filters={filters}
            onFilterChange={setFilters}
          />
        </aside>

        {/* Sidebar — mobile sheet */}
        {showMobileFilters && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)}>
            <div
              className="absolute right-0 top-0 bottom-0 w-[85vw] max-w-sm bg-card p-6 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl">{t('filtersTitle')}</h2>
                <button onClick={() => setShowMobileFilters(false)} className="p-2 hover:bg-muted rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <FilterPanel
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
                filters={filters}
                onFilterChange={setFilters}
              />
            </div>
          </div>
        )}

        {/* Grid */}
        <main>
          {filtered.length === 0 ? (
            <div className="text-center py-24">
              <div className="font-display text-3xl mb-2">{t('emptyTitle')}</div>
              <p className="text-muted-foreground mb-6">{t('emptyDescription')}</p>
              <button onClick={resetAll} className="inline-flex items-center gap-2 px-5 h-10 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity">
                {tCommon('resetFilters')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
              {filtered.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function FilterPanel({
  activeCategory,
  onCategoryChange,
  filters,
  onFilterChange,
}: {
  activeCategory: Category;
  onCategoryChange: (c: Category) => void;
  filters: { vegan: boolean; biodegradable: boolean; plasticFree: boolean };
  onFilterChange: (f: { vegan: boolean; biodegradable: boolean; plasticFree: boolean }) => void;
}) {
  const tCommon = useTranslations('Common');
  const categories: { id: Category; label: string }[] = [
    { id: 'all', label: tCommon('categoryLabels.all') },
    { id: 'sharpeners', label: tCommon('categoryLabels.sharpeners') },
    { id: 'stones', label: tCommon('categoryLabels.stones') },
    { id: 'accessories', label: tCommon('categoryLabels.accessories') },
  ];
  return (
    <div className="space-y-8 sticky top-32">
      <div>
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-4">
          {tCommon('category')}
        </h3>
        <ul className="space-y-1">
          {categories.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => onCategoryChange(c.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeCategory === c.id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground/80 hover:text-foreground hover:bg-muted'
                }`}
              >
                {c.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-4">
          {tCommon('certificates')}
        </h3>
        <div className="space-y-2">
          {[
            { key: 'vegan' as const, label: 'Vegan' },
            { key: 'biodegradable' as const, label: 'Biodegradable' },
            { key: 'plasticFree' as const, label: 'Plastic-free' },
          ].map((f) => (
            <label key={f.key} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={filters[f.key]}
                onChange={(e) => onFilterChange({ ...filters, [f.key]: e.target.checked })}
                className="w-4 h-4 rounded border-border"
                style={{ accentColor: 'var(--primary)' }}
              />
              <span className="text-sm">{f.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, index }: { product: Product; index: number }) {
  const locale = useLocale();
  const tCommon = useTranslations('Common');
  const displayTitle = locale === 'uk' && product.title_uk ? product.title_uk : product.title;

  const ecoBadges: { label: string; cls: string }[] = [];
  if (product.isVegan) ecoBadges.push({ label: 'Vegan', cls: 'eco-badge-vegan' });
  if (product.isPlasticFree) ecoBadges.push({ label: 'Plastic-free', cls: 'eco-badge-pf' });
  if (product.isBiodegradable && ecoBadges.length < 2) {
    ecoBadges.push({ label: 'Biodegradable', cls: 'eco-badge-bio' });
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: (index % 9) * 0.04 }}
      className="bg-card border border-border rounded-2xl overflow-hidden group hover:-translate-y-0.5 hover:shadow-lg transition-all"
    >
      <Link
        href={`/shop/${product.title.replace(/\s+/g, '-').toLowerCase()}`}
        className="block"
      >
        <div className="aspect-[4/5] relative overflow-hidden">
          <ProductImage
            src={getProductImage(product)}
            alt={displayTitle}
            category={product.category}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          />
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {ecoBadges.map((b) => (
              <span key={b.label} className={`eco-badge ${b.cls}`}>
                {b.label}
              </span>
            ))}
          </div>
          <div className="absolute top-3 right-3 z-10">
            <WishlistButton
              productId={product.id}
              size="sm"
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            />
          </div>
        </div>
        <div className="p-5">
          <h3 className="font-display text-lg leading-tight line-clamp-2 mb-3">
            {displayTitle}
          </h3>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-semibold">
              <Price amount={product.price} />
            </span>
            {product.stock > 0 ? (
              <span className="text-xs text-muted-foreground">{tCommon('inStock')}</span>
            ) : (
              <span className="text-xs text-destructive">{tCommon('outOfStock')}</span>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
