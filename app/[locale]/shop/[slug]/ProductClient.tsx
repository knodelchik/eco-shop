'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/navigation';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Minus,
  Plus,
  Heart,
  Share2,
  ChevronLeft,
  ArrowUpRight,
  ShieldCheck,
  Truck,
  RotateCcw,
} from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { authService } from '../../services/authService';
import Price from '@/app/Components/Price';
import { Product } from '@/app/types/products';

interface ProductClientProps {
  product: Product;
}

const CATEGORY_BG: Record<string, string> = {
  sharpeners: 'linear-gradient(160deg, oklch(0.94 0.03 110) 0%, oklch(0.78 0.14 150) 130%)',
  stones: 'linear-gradient(200deg, oklch(0.95 0.015 100) 0%, oklch(0.55 0.13 150) 130%)',
  accessories: 'linear-gradient(140deg, oklch(0.92 0.04 130) 0%, oklch(0.45 0.11 150) 130%)',
};

type TabId = 'description' | 'composition' | 'shipping' | 'eco';

export default function ProductClient({ product }: ProductClientProps) {
  const t = useTranslations('ProductPage');
  const tCart = useTranslations('CartSheet');
  const tCommon = useTranslations('Common');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');

  const CATEGORY_LABEL: Record<string, string> = {
    sharpeners: tCommon('categoryLabels.sharpeners'),
    stones: tCommon('categoryLabels.stones'),
    accessories: tCommon('categoryLabels.accessories'),
  };

  const TABS: { id: TabId; label: string }[] = [
    { id: 'description', label: t('tabDescription') },
    { id: 'composition', label: t('tabComposition') },
    { id: 'shipping', label: t('tabShipping') },
    { id: 'eco', label: t('tabEco') },
  ];

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<TabId>('description');
  const [userId, setUserId] = useState<string | null>(null);

  const { addToCart, cartItems } = useCartStore();
  const {
    wishlistItems,
    localWishlist,
    addToWishlist,
    removeFromWishlist,
    isInLocalWishlist,
  } = useWishlistStore();

  const itemInCart = cartItems.find((i) => i.id === product.id);
  const maxAvailable = product.stock;
  const isOutOfStock = product.stock <= 0;

  useEffect(() => {
    authService.getCurrentUser().then(({ user }) => setUserId(user?.id || null));
  }, []);

  const isInWishlist = userId
    ? wishlistItems.some((i) => i.product_id === product.id)
    : isInLocalWishlist(product.id);

  const handleToggleWishlist = async () => {
    if (isInWishlist) {
      await removeFromWishlist(userId, product.id);
      toast.success(tCommon('removedFromWishlist'));
    } else {
      await addToWishlist(userId, product.id);
      toast.success(tCommon('addedToWishlist'));
    }
  };

  const handleShare = async () => {
    if (typeof navigator === 'undefined') return;
    if (navigator.share) {
      try {
        await navigator.share({ title: displayTitle, url: window.location.href });
      } catch {
        // user cancelled — ignore
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(tCommon('linkCopied'));
    }
  };

  const displayTitle = locale === 'uk' && product.title_uk ? product.title_uk : product.title;
  const displayDescription =
    locale === 'uk' && product.description_uk ? product.description_uk : product.description;

  const handleAddToCart = () => {
    if (quantity > maxAvailable) {
      toast.error(t('stockLimitError', { max: maxAvailable }));
      return;
    }
    addToCart({ ...product, title: displayTitle, quantity }, tCart);
    toast.success(t('addToCartSuccess'), { description: displayTitle });
  };

  const ecoBadges: { label: string; cls: string }[] = [];
  if (product.isVegan) ecoBadges.push({ label: 'Vegan', cls: 'eco-badge-vegan' });
  if (product.isPlasticFree) ecoBadges.push({ label: 'Plastic-free', cls: 'eco-badge-pf' });
  if (product.isBiodegradable) ecoBadges.push({ label: 'Biodegradable', cls: 'eco-badge-bio' });

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
      {/* Back link */}
      <Link
        href={from === 'home' ? '/' : '/shop'}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ChevronLeft className="w-4 h-4" />
        {from === 'home' ? tCommon('backToHome') : tCommon('backToShop')}
      </Link>

      {/* Main: gallery + info */}
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 mb-20">
        {/* Gallery */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:sticky lg:top-24 lg:self-start"
        >
          <div
            className="aspect-[4/5] rounded-3xl border border-border overflow-hidden relative"
            style={{ background: CATEGORY_BG[product.category] ?? CATEGORY_BG.accessories }}
          >
            {/* Decorative grain / pattern hint — minimal */}
            <div className="absolute top-5 left-5 flex flex-col gap-1.5">
              {ecoBadges.map((b) => (
                <span key={b.label} className={`eco-badge ${b.cls}`}>
                  {b.label}
                </span>
              ))}
            </div>
          </div>

          {/* Thumbnails — 4 small variants */}
          <div className="grid grid-cols-4 gap-2 mt-2">
            {[0, 1, 2, 3].map((i) => (
              <button
                key={i}
                className={`aspect-square rounded-xl border overflow-hidden transition-all ${
                  i === 0 ? 'border-primary ring-2 ring-primary/30' : 'border-border opacity-60 hover:opacity-100'
                }`}
                style={{ background: CATEGORY_BG[product.category] ?? CATEGORY_BG.accessories, filter: i === 0 ? 'none' : `hue-rotate(${i * 25}deg)` }}
                aria-label={`Image ${i + 1}`}
              />
            ))}
          </div>
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">
            {CATEGORY_LABEL[product.category] ?? product.category}
          </div>
          <h1 className="font-display text-4xl md:text-5xl tracking-tight leading-[1.05] mb-6">
            {displayTitle}
          </h1>

          {/* Price + stock */}
          <div className="flex items-baseline gap-4 mb-8">
            <span className="font-display text-4xl text-foreground">
              <Price amount={product.price} />
            </span>
            {!isOutOfStock ? (
              <span className="text-sm text-muted-foreground">{tCommon('stockUnits', { count: product.stock })}</span>
            ) : (
              <span className="text-sm text-destructive">{tCommon('outOfStock')}</span>
            )}
          </div>

          {/* Quantity + Add to cart */}
          <div className="flex items-stretch gap-3 mb-6">
            <div className="inline-flex items-center bg-card border border-border rounded-xl">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1 || isOutOfStock}
                className="w-11 h-12 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label={tCommon('decrease')}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center font-medium tabular-nums">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(maxAvailable, q + 1))}
                disabled={quantity >= maxAvailable || isOutOfStock}
                className="w-11 h-12 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label={tCommon('increase')}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="flex-1 inline-flex items-center justify-center gap-2 h-12 px-6 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {isOutOfStock ? tCommon('outOfStock') : itemInCart ? tCommon('alreadyInCart') : tCommon('addToCart')}
            </button>
          </div>

          {/* Secondary actions */}
          <div className="flex items-center gap-2 mb-10">
            <button
              type="button"
              onClick={handleToggleWishlist}
              className={`inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl text-sm font-medium transition-colors ${
                isInWishlist
                  ? 'bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/15'
                  : 'bg-card text-foreground border border-border hover:bg-muted'
              }`}
            >
              <Heart
                className={`w-4 h-4 ${isInWishlist ? 'fill-current' : ''}`}
                strokeWidth={1.75}
              />
              {isInWishlist ? tCommon('inWishlist') : tCommon('addToWishlist')}
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center justify-center gap-2 h-11 px-4 bg-card border border-border rounded-xl text-sm text-foreground hover:bg-muted transition-colors"
            >
              <Share2 className="w-4 h-4" /> {tCommon('share')}
            </button>
          </div>

          {/* Trust strip */}
          <div className="grid grid-cols-3 gap-4 py-6 border-y border-border mb-10">
            <div className="flex flex-col items-start gap-1.5">
              <Truck className="w-5 h-5 text-primary" strokeWidth={1.75} />
              <div className="text-xs font-medium">{tCommon('trustCarbonShipping')}</div>
            </div>
            <div className="flex flex-col items-start gap-1.5">
              <RotateCcw className="w-5 h-5 text-primary" strokeWidth={1.75} />
              <div className="text-xs font-medium">{tCommon('trustReturns')}</div>
            </div>
            <div className="flex flex-col items-start gap-1.5">
              <ShieldCheck className="w-5 h-5 text-primary" strokeWidth={1.75} />
              <div className="text-xs font-medium">{tCommon('trustCertified')}</div>
            </div>
          </div>

          {/* Tabs */}
          <div>
            <nav className="flex border-b border-border mb-6">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.span
                      layoutId="tab-underline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </nav>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="text-foreground/85 leading-relaxed"
              >
                {activeTab === 'description' && (
                  <p>{displayDescription || t('fallbackDescription')}</p>
                )}
                {activeTab === 'composition' && (
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between border-b border-border py-2">
                      <span className="text-muted-foreground">{t('compositionMaterial')}</span>
                      <span>{product.material ?? t('fallbackMaterial')}</span>
                    </li>
                    <li className="flex justify-between border-b border-border py-2">
                      <span className="text-muted-foreground">{t('compositionCert')}</span>
                      <span>{product.ecoCertification ?? '—'}</span>
                    </li>
                    <li className="flex justify-between border-b border-border py-2">
                      <span className="text-muted-foreground">{t('compositionCountry')}</span>
                      <span>{product.countryOfOrigin ?? t('fallbackCountry')}</span>
                    </li>
                    <li className="flex justify-between py-2">
                      <span className="text-muted-foreground">{t('compositionBio')}</span>
                      <span>{product.isBiodegradable ? t('biodegradableYes') : t('biodegradableNo')}</span>
                    </li>
                  </ul>
                )}
                {activeTab === 'shipping' && (
                  <div className="space-y-3 text-sm">
                    <p>{t('shippingStandard')}</p>
                    <p>{t('shippingExpress')}</p>
                    <p>{t('shippingPackaging')}</p>
                  </div>
                )}
                {activeTab === 'eco' && (
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between border-b border-border py-2">
                      <span className="text-muted-foreground">{t('ecoCarbonFootprint')}</span>
                      <span>{product.carbonFootprintKg ? `${product.carbonFootprintKg} кг CO₂` : t('ecoLow')}</span>
                    </div>
                    <div className="flex justify-between border-b border-border py-2">
                      <span className="text-muted-foreground">{t('ecoPackaging')}</span>
                      <span>{t('ecoPackagingValue')}</span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed pt-2">
                      {t('ecoFooter')}
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Related strip */}
      <section className="border-t border-border pt-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="section-label mb-2">{t('relatedLabel')}</div>
            <h2 className="font-display text-3xl md:text-4xl tracking-tight">{t('relatedTitle')}</h2>
          </div>
          <Link
            href="/shop"
            className="hidden md:inline-flex items-center gap-1 text-sm hover:text-primary transition-colors"
          >
            {tCommon('viewProducts')} <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
        <p className="text-muted-foreground">
          {t('relatedComing')}
        </p>
      </section>
    </div>
  );
}
