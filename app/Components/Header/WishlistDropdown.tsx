'use client';

import { Heart, ShoppingCart, Trash2, Check, Loader2 } from 'lucide-react';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWishlistStore } from '../../[locale]/store/wishlistStore';
import { useCartStore } from '../../[locale]/store/cartStore';
import { useTranslations, useLocale } from 'next-intl'; // ✅ 1. Додано useLocale
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Link } from '@/navigation';
import { User } from '../../types/users';
import { Product } from '../../types/products';

interface WishlistDropdownProps {
  user: User | null;
}

// ✅ 2. Оновлено інтерфейс: додано title_uk
interface WishlistItem {
  id: string;
  product_id: number;
  products: {
    title: string;
    title_uk?: string; // <--
    price: number;
    images: string[];
  };
}

interface WishlistItemsProps {
  items: WishlistItem[];
  movingItem: number | null;
  successItem: number | null;
  onMoveToCart: (e: React.MouseEvent, productId: number) => void;
  onRemove: (productId: number) => void;
  locale: string; // ✅ Передаємо локаль
}

interface LocalWishlistItemsProps {
  productIds: number[];
  movingItem: number | null;
  successItem: number | null;
  onMoveToCart: (e: React.MouseEvent, productId: number) => void;
  onRemove: (productId: number) => void;
  productsData: Product[];
  locale: string; // ✅ Передаємо локаль
}

export default function WishlistDropdown({ user }: WishlistDropdownProps) {
  const t = useTranslations('Wishlist');
  const locale = useLocale(); // ✅ 3. Отримуємо локаль

  const [movingItem, setMovingItem] = useState<number | null>(null);
  const [successItem, setSuccessItem] = useState<number | null>(null);
  const [localProducts, setLocalProducts] = useState<Product[]>([]);
  const router = useRouter();
  const {
    wishlistItems,
    localWishlist,
    removeFromWishlist,
    moveToCart,
    removeFromLocalWishlist,
  } = useWishlistStore();
  const { addToCart } = useCartStore();

  useEffect(() => {
    const loadLocalProducts = async () => {
      if (localWishlist.length > 0) {
        try {
          const res = await fetch('/api/products');
          const allProducts: Product[] = await res.json();
          const localProductsData = allProducts.filter((product) =>
            localWishlist.includes(product.id)
          );
          setLocalProducts(localProductsData);
        } catch (error) {
          console.error('Error loading local wishlist products:', error);
        }
      } else {
        setLocalProducts([]);
      }
    };

    loadLocalProducts();
  }, [localWishlist]);

  const handleMoveToCart = async (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    e.stopPropagation();

    setMovingItem(productId);

    try {
      if (user) {
        await moveToCart(user.id, productId, t);
      } else {
        const product = localProducts.find((p) => p.id === productId);
        if (product) {
          // Тут ми передаємо весь об'єкт product, який містить title_uk,
          // тому cartStore коректно його збереже
          addToCart({ ...product, quantity: 1 });
        }
        removeFromLocalWishlist(productId);
      }

      setSuccessItem(productId);

      setTimeout(() => {
        setSuccessItem(null);
      }, 2000);
    } catch (error) {
      console.error('❌ Error moving to cart:', error);
    } finally {
      setMovingItem(null);
    }
  };

  const handleRemoveFromWishlist = async (productId: number) => {
    if (user) {
      await removeFromWishlist(user.id, productId);
    } else {
      removeFromLocalWishlist(productId);
    }
  };

  const totalItems = user ? wishlistItems.length : localWishlist.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="relative flex items-center gap-2 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100 cursor-pointer outline-none"
          aria-label="Wishlist"
        >
          <Heart className="w-6 h-6" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>
          {t('title')}
          {totalItems > 0 && ` (${totalItems})`}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {totalItems === 0 ? (
          <EmptyWishlist />
        ) : user ? (
          <WishlistItems
            items={wishlistItems as unknown as WishlistItem[]} // Приведення типів, якщо потрібно
            movingItem={movingItem}
            successItem={successItem}
            onMoveToCart={handleMoveToCart}
            onRemove={handleRemoveFromWishlist}
            locale={locale} // ✅ Передаємо локаль
          />
        ) : (
          <LocalWishlistItems
            productIds={localWishlist}
            movingItem={movingItem}
            successItem={successItem}
            onMoveToCart={handleMoveToCart}
            onRemove={handleRemoveFromWishlist}
            productsData={localProducts}
            locale={locale} // ✅ Передаємо локаль
          />
        )}

        {totalItems > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              asChild
              className="cursor-pointer text-center justify-center"
            >
              <Link href="/shop" className="w-full">
                {t('continueShopping')}
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EmptyWishlist() {
  const t = useTranslations('Wishlist');
  return (
    <div className="px-2 py-4 text-center text-gray-500 dark:text-neutral-500">
      <Heart className="w-8 h-8 mx-auto mb-2 opacity-50" />
      <p>{t('empty')}</p>
      <p className="text-sm mt-1">{t('emptyDescription')}</p>
    </div>
  );
}

function WishlistItems({
  items,
  movingItem,
  successItem,
  onMoveToCart,
  onRemove,
  locale,
}: WishlistItemsProps) {
  const t = useTranslations('Wishlist');

  return (
    <div className="max-h-96 overflow-y-auto">
      {items.map((item) => (
        <div key={item.id} className="px-2 py-3 border-b last:border-b-0">
          <div className="flex items-center gap-3">
            <Image
              src={item.products.images?.[0] || '/images/placeholder.jpg'}
              alt={item.products.title}
              width={48}
              height={48}
              className="object-cover rounded-lg flex-shrink-0"
            />

            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {/* ✅ Логіка назви */}
                {locale === 'uk'
                  ? item.products.title_uk || item.products.title
                  : item.products.title}
              </p>
              <p className="text-green-600 font-semibold text-sm ">
                ${item.products.price}
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <button
                onClick={(e) => onMoveToCart(e, item.product_id)}
                disabled={
                  movingItem === item.product_id ||
                  successItem === item.product_id
                }
                className={`p-1 rounded transition disabled:opacity-70 cursor-pointer ${
                  successItem === item.product_id
                    ? 'bg-green-100 text-green-700'
                    : 'text-green-600 hover:bg-green-50'
                }`}
                title={t('addToCart')}
              >
                {movingItem === item.product_id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : successItem === item.product_id ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <ShoppingCart className="w-4 h-4" />
                )}
              </button>

              <button
                onClick={() => onRemove(item.product_id)}
                className="p-1 text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                title={t('remove')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          {movingItem === item.product_id && (
            <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
              {t('addingToCart')}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function LocalWishlistItems({
  productIds,
  movingItem,
  successItem,
  onMoveToCart,
  onRemove,
  productsData,
  locale,
}: LocalWishlistItemsProps) {
  const t = useTranslations('Wishlist');

  return (
    <div className="max-h-96 overflow-y-auto">
      {productIds.map((productId) => {
        const product = productsData.find((p) => p.id === productId);

        return (
          <div key={productId} className="px-2 py-3 border-b last:border-b-0">
            <div className="flex items-center gap-3">
              <Image
                src={product?.images?.[0] || '/images/placeholder.jpg'}
                alt={product?.title || `Product ${productId}`}
                width={48}
                height={48}
                className="object-cover rounded-lg flex-shrink-0"
              />

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {/* ✅ Логіка назви для локальних товарів */}
                  {product
                    ? locale === 'uk'
                      ? product.title_uk || product.title
                      : product.title
                    : `Product #${productId}`}
                </p>
                <p className="text-green-600 font-semibold text-sm">
                  {product ? `$${product.price}` : t('loading')}
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <button
                  onClick={(e) => onMoveToCart(e, productId)}
                  disabled={
                    movingItem === productId || successItem === productId
                  }
                  className={`p-1 rounded transition disabled:opacity-70 ${
                    successItem === productId
                      ? 'bg-green-100 text-green-700'
                      : 'text-green-600 hover:bg-green-50'
                  }`}
                  title={t('addToCart')}
                >
                  {movingItem === productId ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : successItem === productId ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <ShoppingCart className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => onRemove(productId)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                  title={t('remove')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {movingItem === productId && (
              <div className="text-xs text-green-600 mt-1">
                {t('addingToCart')}
              </div>
            )}
            {!product && (
              <div className="text-xs text-gray-500 mt-1">{t('loading')}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}