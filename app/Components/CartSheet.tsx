'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ShoppingBag, Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { useCartStore } from '../[locale]/store/cartStore';
import { Link } from '@/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useState } from 'react';
import { useCurrency } from '@/app/context/CurrencyContext';

const CATEGORY_BG: Record<string, string> = {
  sharpeners: 'linear-gradient(160deg, oklch(0.94 0.03 110) 0%, oklch(0.78 0.14 150) 130%)',
  stones: 'linear-gradient(200deg, oklch(0.95 0.015 100) 0%, oklch(0.55 0.13 150) 130%)',
  accessories: 'linear-gradient(140deg, oklch(0.92 0.04 130) 0%, oklch(0.45 0.11 150) 130%)',
};

export default function CartSheet() {
  const t = useTranslations('CartSheet');
  const tCart = useTranslations('CartSheet');
  const tCommon = useTranslations('Common');
  const locale = useLocale();
  const { cartItems, increaseQuantity, decreaseQuantity, removeFromCart } = useCartStore();
  const [open, setOpen] = useState(false);
  const { formatPrice } = useCurrency();

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="relative p-2 rounded-lg text-foreground hover:bg-muted transition-colors"
          aria-label="Корзина"
        >
          <ShoppingBag className="w-5 h-5" strokeWidth={1.75} />
          {totalItems > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-semibold w-4 h-4 flex items-center justify-center rounded-full">
              {totalItems}
            </span>
          )}
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-[420px] sm:w-[480px] p-0 flex flex-col h-full bg-background border-l border-border"
      >
        <SheetHeader className="p-6 border-b border-border shrink-0">
          <SheetTitle className="font-display text-2xl tracking-tight">
            {t('title')}
            {totalItems > 0 && (
              <span className="ml-2 text-base text-muted-foreground font-sans font-normal">
                ({totalItems})
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-5">
              <ShoppingBag className="w-7 h-7 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <h3 className="font-display text-xl mb-2">{t('emptyTitle') ?? 'Кошик порожній'}</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              {t('emptyMessage') ?? 'Додайте товари — і вони з\'являться тут.'}
            </p>
            <Link
              href="/shop"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center gap-2 h-11 px-6 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              {t('goToShop')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-4 p-3 rounded-2xl bg-card border border-border hover:border-foreground/20 transition-colors"
                >
                  <div
                    className="w-20 h-20 rounded-xl flex-shrink-0"
                    style={{ background: CATEGORY_BG[item.category as string] ?? CATEGORY_BG.accessories }}
                  />
                  <div className="flex-1 min-w-0 py-1">
                    <p className="font-medium leading-tight line-clamp-2 mb-2">
                      {locale === 'uk' ? item.title_uk || item.title : item.title}
                    </p>
                    <p className="text-sm font-semibold text-foreground mb-3">
                      {formatPrice(item.price)}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <div className="inline-flex items-center bg-muted rounded-lg">
                        <button
                          type="button"
                          onClick={() => decreaseQuantity(item.id)}
                          className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="Зменшити"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center text-sm tabular-nums">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => increaseQuantity(item.id, tCart)}
                          className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="Збільшити"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-md"
                        aria-label="Видалити"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border p-6 bg-background shrink-0">
              <div className="flex justify-between items-baseline mb-2 text-sm text-muted-foreground">
                <span>{t('subtotalLabel')}</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between items-baseline mb-5 text-sm text-muted-foreground">
                <span>{t('shippingLabel')}</span>
                <span>{t('shippingCalculated')}</span>
              </div>
              <div className="flex justify-between items-baseline font-display text-xl mb-5 pt-3 border-t border-border">
                <span>{t('totalLabel')}</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>

              <Link
                href="/order"
                onClick={() => setOpen(false)}
                className="w-full inline-flex items-center justify-center gap-2 h-12 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                {t('checkoutButton')}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/shop"
                onClick={() => setOpen(false)}
                className="w-full inline-flex items-center justify-center mt-2 h-10 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('continueShoppingButton')}
              </Link>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
