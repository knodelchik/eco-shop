import { CartItemWithProduct } from '../../types/cart';

/**
 * Cart service — клієнтський. Усі виклики йдуть через `/api/cart`.
 */
export const cartService = {
  async getCart(userId: string): Promise<CartItemWithProduct[]> {
    try {
      const res = await fetch(`/api/cart?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) return [];
      return (await res.json()) as CartItemWithProduct[];
    } catch (e) {
      console.error('getCart failed:', e);
      return [];
    }
  },

  async addToCart(userId: string, productId: number, quantity: number = 1): Promise<boolean> {
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, productId, quantity }),
      });
      return res.ok;
    } catch (e) {
      console.error('addToCart failed:', e);
      return false;
    }
  },

  async updateQuantity(userId: string, productId: number, quantity: number): Promise<boolean> {
    try {
      const res = await fetch('/api/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, productId, quantity }),
      });
      return res.ok;
    } catch (e) {
      console.error('updateQuantity failed:', e);
      return false;
    }
  },

  async removeFromCart(userId: string, productId: number): Promise<boolean> {
    try {
      const res = await fetch('/api/cart', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, productId }),
      });
      return res.ok;
    } catch (e) {
      console.error('removeFromCart failed:', e);
      return false;
    }
  },

  async clearCart(userId: string): Promise<boolean> {
    try {
      const res = await fetch('/api/cart', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      return res.ok;
    } catch (e) {
      console.error('clearCart failed:', e);
      return false;
    }
  },

  async syncCart(
    userId: string,
    localCart: { productId: number; quantity: number }[]
  ): Promise<boolean> {
    try {
      await this.clearCart(userId);
      for (const item of localCart) {
        const ok = await this.addToCart(userId, item.productId, item.quantity);
        if (!ok) return false;
      }
      return true;
    } catch (e) {
      console.error('syncCart failed:', e);
      return false;
    }
  },
};
