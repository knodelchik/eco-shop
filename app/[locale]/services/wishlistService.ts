import { WishlistItemWithProduct } from '../../types/wishlist';
import { Product } from '../../types/products';

/**
 * Wishlist service — клієнтський (вживається у компонентах).
 * Усі виклики йдуть через API-роут `/api/wishlist`, який під капотом
 * робить SQL-запити до Neon Postgres.
 */
export const wishlistService = {
  async getWishlist(userId: string): Promise<WishlistItemWithProduct[]> {
    try {
      const res = await fetch(`/api/wishlist?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error('Failed');
      return (await res.json()) as WishlistItemWithProduct[];
    } catch (e) {
      console.error('getWishlist failed:', e);
      return [];
    }
  },

  async addToWishlist(userId: string, productId: number): Promise<boolean> {
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, productId }),
      });
      return res.ok;
    } catch (e) {
      console.error('addToWishlist failed:', e);
      return false;
    }
  },

  async removeFromWishlist(userId: string, productId: number): Promise<boolean> {
    try {
      const res = await fetch('/api/wishlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, productId }),
      });
      return res.ok;
    } catch (e) {
      console.error('removeFromWishlist failed:', e);
      return false;
    }
  },

  async isInWishlist(userId: string, productId: number): Promise<boolean> {
    const list = await this.getWishlist(userId);
    return list.some((i) => i.product_id === productId);
  },

  async getProductsByIds(productIds: number[]): Promise<Product[]> {
    if (!productIds || productIds.length === 0) return [];
    try {
      // /api/products повертає всі товари — фільтруємо локально.
      // Для продуктивності можна додати ?ids=1,2,3 у API-роут.
      const res = await fetch('/api/products');
      if (!res.ok) return [];
      const all: Product[] = await res.json();
      return all.filter((p) => productIds.includes(p.id));
    } catch (e) {
      console.error('getProductsByIds failed:', e);
      return [];
    }
  },

  async moveToCart(userId: string, productId: number): Promise<boolean> {
    try {
      const cartModule = await import('./cartService');
      const success = await cartModule.cartService.addToCart(userId, productId, 1);
      if (success) {
        await this.removeFromWishlist(userId, productId);
        return true;
      }
      return false;
    } catch (e) {
      console.error('moveToCart failed:', e);
      return false;
    }
  },
};
