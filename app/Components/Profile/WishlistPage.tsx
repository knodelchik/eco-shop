'use client';

import { useTranslations, useLocale } from 'next-intl'; // ✅ 1. Додано useLocale
import { useWishlistStore } from '@/app/[locale]/store/wishlistStore';
import { useCurrency } from '@/app/context/CurrencyContext';
import Image from 'next/image';
import { Link } from '@/navigation';
import { toast } from 'sonner';
import { ShoppingCart, Trash2, Heart } from 'lucide-react';

export default function WishlistPage({ userId }: { userId: string }) {
  const t = useTranslations('Wishlist');
  const locale = useLocale(); // ✅ 2. Отримуємо локаль
  const { formatPrice } = useCurrency();

  const { wishlistItems, removeFromWishlist, moveToCart } = useWishlistStore();

  const handleMoveToCart = async (product: any) => {
    if (!userId) return;

    if (product.stock <= 0) {
      toast.error(t('outOfStockError'));
      return;
    }

    toast.promise(moveToCart(userId, product.id, t), {
      loading: t('addingToCart'),
      // Тут ми теж можемо використати локалізовану назву, якщо передамо її,
      // але зазвичай в toast 'product.title' (оригінальна) теж ок.
      // Якщо хочете і тут локалізацію - треба брати (product.title_uk || product.title)
      success: t('addedToCartSuccess', { 
        title: locale === 'uk' ? (product.title_uk || product.title) : product.title 
      }),
      error: t('addToCartError'),
    });
  };

  const handleRemove = (productId: number) => {
    if (!userId) return;
    removeFromWishlist(userId, productId);
    toast.info(t('removedMessage'));
  };

  return (
    <div className="bg-card rounded-2xl shadow-lg border border-border p-6">
      <h2 className="text-2xl font-bold text-foreground mb-6">
        {t('title')} ({wishlistItems.length})
      </h2>

      {wishlistItems.length === 0 ? (
        <div className="h-48 flex flex-col items-center justify-center bg-muted/50 rounded-lg border-2 border-dashed border-border">
          <Heart className="w-12 h-12 mx-auto mb-4 opacity-30 text-gray-500" />
          <p className="text-muted-foreground">{t('empty')}</p>
          <p className="text-sm text-gray-400 mt-1">{t('emptyDescription')}</p>
          <Link
            href="/shop"
            className="mt-4 text-sm font-medium text-blue-600 hover:underline"
          >
            {t('continueShopping')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {wishlistItems.map((item) => {
            const isOutOfStock = (item.products.stock || 0) <= 0;
            
            // ✅ 3. Визначаємо правильну назву для відображення
            // Оскільки в WishlistStore дані приходять з БД, item.products 
            // повинен містити title_uk, якщо він є в базі.
            // Приводимо до any, якщо TypeScript лається, що title_uk немає в типі.
            const productData = item.products as any;
            const productTitle = locale === 'uk' 
              ? (productData.title_uk || productData.title) 
              : productData.title;

            return (
              <div
                key={item.id}
                className="flex items-center gap-4 p-3 rounded-lg border bg-white dark:bg-neutral-800 border-border"
              >
                <div className="relative">
                  <Image
                    src={item.products.images?.[0] || '/images/placeholder.jpg'}
                    alt={productTitle}
                    width={64}
                    height={64}
                    className={`w-16 h-16 object-cover rounded-md flex-shrink-0 ${
                      isOutOfStock ? 'grayscale opacity-50' : ''
                    }`}
                  />
                  {isOutOfStock && (
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white bg-black/50 rounded-md uppercase">
                      {t('outOfStockBadge')}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <Link
                    href={`/shop/${item.products.title
                      .replace(/\s+/g, '-')
                      .toLowerCase()}`}
                    className="font-medium text-sm truncate block hover:underline text-foreground"
                    title={productTitle}
                  >
                    {/* ✅ 4. Виводимо локалізовану назву */}
                    {productTitle}
                  </Link>
                  <p className="text-green-600 font-semibold text-sm">
                    {formatPrice(item.products.price)}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleMoveToCart(item.products)}
                    disabled={isOutOfStock}
                    className={`p-2 rounded-md transition ${
                      isOutOfStock
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-neutral-700 dark:text-neutral-500'
                        : 'text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-neutral-700 cursor-pointer'
                    }`}
                    title={t('addToCart')}
                  >
                    <ShoppingCart className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleRemove(item.product_id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:text-red-500 dark:hover:bg-neutral-700 rounded-md transition cursor-pointer"
                    title={t('remove')}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}