'use client';

import { X, ShoppingBag, Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { useCartStore } from '../[locale]/store/cartStore';
import { Link } from '@/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useCurrency } from '@/app/context/CurrencyContext';
import { ProductImage } from '@/app/Components/ProductImage';

interface MobileCartSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileCartSheet({ isOpen, onClose }: MobileCartSheetProps) {
  const t = useTranslations('CartSheet');
  const tCart = useTranslations('CartSheet');
  const locale = useLocale();
  const { cartItems, increaseQuantity, decreaseQuantity, removeFromCart } = useCartStore();
  const { formatPrice } = useCurrency();

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) onClose();
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
            {/* Drag handle */}
            <div className="pt-3 pb-1 flex justify-center">
              <div className="w-10 h-1 bg-border rounded-full" />
            </div>

            {/* Header */}
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

            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-5">
                  <ShoppingBag className="w-7 h-7 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-xl mb-2">Кошик порожній</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                  {t('emptyMessage') ?? 'Додайте товари — і вони з\'являться тут.'}
                </p>
                <Link
                  href="/shop"
                  onClick={onClose}
                  className="inline-flex items-center justify-center gap-2 h-11 px-6 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  {t('goToShop')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-3 rounded-2xl bg-card border border-border"
                    >
                      <div className="w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden">
                        <ProductImage
                          src={item.images?.[0]}
                          alt={item.title}
                          category={item.category as string}
                          sizes="64px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium leading-tight line-clamp-2 text-sm mb-1.5">
                          {locale === 'uk' ? item.title_uk || item.title : item.title}
                        </p>
                        <p className="text-sm font-semibold mb-2.5">{formatPrice(item.price)}</p>
                        <div className="flex items-center justify-between gap-2">
                          <div className="inline-flex items-center bg-muted rounded-lg">
                            <button
                              onClick={() => decreaseQuantity(item.id)}
                              className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground"
                              aria-label="Зменшити"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-7 text-center text-sm tabular-nums">{item.quantity}</span>
                            <button
                              onClick={() => increaseQuantity(item.id, tCart)}
                              className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground"
                              aria-label="Збільшити"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                            aria-label="Видалити"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border p-6 shrink-0">
                  <div className="flex justify-between items-baseline font-display text-xl mb-4">
                    <span>{t('totalLabel')}</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                  <Link
                    href="/order"
                    onClick={onClose}
                    className="w-full inline-flex items-center justify-center gap-2 h-12 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
                  >
                    {t('checkoutButton')}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
