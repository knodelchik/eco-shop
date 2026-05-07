'use client';

import { X, Heart, Trash2, ShoppingCart, Check, Loader2, ArrowRight } from 'lucide-react';
import { useWishlistStore } from '@/app/[locale]/store/wishlistStore';
import { useCartStore } from '@/app/[locale]/store/cartStore';
import { authService } from '@/app/[locale]/services/authService';
import { wishlistService } from '@/app/[locale]/services/wishlistService';
import { Link } from '@/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useCurrency } from '@/app/context/CurrencyContext';

interface MobileWishlistSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_BG: Record<string, string> = {
  sharpeners: 'linear-gradient(160deg, oklch(0.94 0.03 110) 0%, oklch(0.78 0.14 150) 130%)',
  stones: 'linear-gradient(200deg, oklch(0.95 0.015 100) 0%, oklch(0.55 0.13 150) 130%)',
  accessories: 'linear-gradient(140deg, oklch(0.92 0.04 130) 0%, oklch(0.45 0.11 150) 130%)',
};

 
type AnyItem = any;

export default function MobileWishlistSheet({ isOpen, onClose }: MobileWishlistSheetProps) {
  const t = useTranslations('WishlistSheet');
  const locale = useLocale();
  const { formatPrice } = useCurrency();

  const {
    wishlistItems,
    localWishlist,
    removeFromWishlist,
    removeFromLocalWishlist,
  } = useWishlistStore();

  const { addToCart } = useCartStore();
  const [userId, setUserId] = useState<string | null>(null);
  const [hydratedLocalItems, setHydratedLocalItems] = useState<AnyItem[]>([]);
  const [isLoadingLocal, setIsLoadingLocal] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [successId, setSuccessId] = useState<number | null>(null);

  useEffect(() => {
    authService.getCurrentUser().then(({ user }) => setUserId(user?.id || null));
  }, []);

  useEffect(() => {
    if (userId || localWishlist.length === 0) {
      if (localWishlist.length === 0) setHydratedLocalItems([]);
      return;
    }
    setIsLoadingLocal(true);
    wishlistService
      .getProductsByIds(localWishlist)
      .then(setHydratedLocalItems)
      .finally(() => setIsLoadingLocal(false));
  }, [localWishlist, userId]);

  const displayItems: AnyItem[] = userId ? wishlistItems : hydratedLocalItems;
  const totalItems = displayItems.length;

  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) onClose();
  };

  const handleAddToCart = async (item: AnyItem) => {
    const productId = item.product_id || item.id;
    const data = item.products || item;
    if ((data.stock || 0) <= 0) {
      toast.error(t('soldOut') ?? 'Закінчилось');
      return;
    }
    setProcessingId(productId);
    try {
      addToCart({
        id: productId,
        title: data.title || '',
        title_uk: data.title_uk,
        price: data.price || 0,
        images: data.images || [],
        category: data.category || 'accessories',
        description: data.description || '',
        created_at: data.created_at || new Date().toISOString(),
        quantity: 1,
        stock: data.stock || 0,
      });
      setProcessingId(null);
      setSuccessId(productId);
      setTimeout(async () => {
        if (userId) await removeFromWishlist(userId, productId);
        else {
          removeFromLocalWishlist(productId);
          setHydratedLocalItems((p) => p.filter((x) => x.id !== productId));
        }
        setSuccessId(null);
      }, 1000);
    } catch {
      setProcessingId(null);
    }
  };

  const handleRemove = async (item: AnyItem) => {
    const productId = item.product_id || item.id;
    if (userId) await removeFromWishlist(userId, productId);
    else {
      removeFromLocalWishlist(productId);
      setHydratedLocalItems((p) => p.filter((x) => x.id !== productId));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.2 }}
            onDragEnd={handleDragEnd}
            className="fixed inset-x-0 bottom-0 z-50 bg-background rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] lg:hidden border-t border-border"
          >
            <div className="pt-3 pb-1 flex justify-center">
              <div className="w-10 h-1 bg-border rounded-full" />
            </div>

            <div className="px-6 py-4 flex items-center justify-between border-b border-border">
              <h2 className="font-display text-2xl tracking-tight">
                {t('title')}
                {totalItems > 0 && (
                  <span className="ml-2 text-base text-muted-foreground font-sans font-normal">
                    ({totalItems})
                  </span>
                )}
              </h2>
              <button
                onClick={onClose}
                className="p-2 -mr-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="Закрити"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoadingLocal ? (
              <div className="flex flex-col items-center justify-center flex-1 p-8">
                <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
              </div>
            ) : totalItems === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-5">
                  <Heart className="w-7 h-7 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-xl mb-2">Список бажань порожній</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                  {t('emptyMessage') ?? 'Додавайте товари тут — і знаходьте їх потім.'}
                </p>
                <Link
                  href="/shop"
                  onClick={onClose}
                  className="inline-flex items-center justify-center gap-2 h-11 px-6 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  Перейти у магазин
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                {displayItems.map((item: AnyItem) => {
                  const productId = item.product_id || item.id;
                  const data = item.products || item;
                  return (
                    <div
                      key={productId}
                      className="flex items-start gap-3 p-3 rounded-2xl bg-card border border-border"
                    >
                      <div
                        className="w-16 h-16 rounded-xl flex-shrink-0"
                        style={{ background: CATEGORY_BG[data.category as string] ?? CATEGORY_BG.accessories }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium leading-tight line-clamp-2 text-sm mb-1.5">
                          {locale === 'uk' ? data.title_uk || data.title : data.title}
                        </p>
                        <p className="text-sm font-semibold mb-2.5">{formatPrice(data.price || 0)}</p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAddToCart(item)}
                            disabled={processingId === productId || successId === productId}
                            className="inline-flex items-center gap-1.5 h-8 px-3 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                          >
                            {processingId === productId ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : successId === productId ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <ShoppingCart className="w-3 h-3" />
                            )}
                            У корзину
                          </button>
                          <button
                            onClick={() => handleRemove(item)}
                            className="p-1.5 text-muted-foreground hover:text-destructive transition-colors ml-auto"
                            aria-label="Видалити"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
