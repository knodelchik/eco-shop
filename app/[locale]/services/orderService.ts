/**
 * Order service — клієнтський. Дані тягнуться через `/api/orders`.
 */

export interface OrderItem {
  id: number;
  product_title: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_image: string | null;
  order_id: number;
  product_id: number | null;
}

export interface Order {
  id: number;
  user_id: string | null;
  email: string;
  created_at: string;
  total: number;
  currency: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shipping_address: any;
  payment_id: string | null;
  payment_method: string;
  notes: string | null;
  order_items: OrderItem[];
}

export const orderService = {
  async getOrders(userId: string): Promise<Order[]> {
    try {
      const res = await fetch(`/api/orders?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) return [];
      return (await res.json()) as Order[];
    } catch (e) {
      console.error('getOrders failed:', e);
      return [];
    }
  },
};
