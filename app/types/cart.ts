import { Product } from "./products";

export type CartItem = {
  id: string;
  user_id: string;
  product_id: number;
  quantity: number;
  product?: Product; // Додаємо інформацію про продукт
  created_at?: string;
  updated_at?: string;
}
export type CartItemWithProduct = CartItem & {
  products: {
    stock: number; // ЗМІНА: products замість product
    id: number;
    title: string;
    price: number;
    images: string[];
    description?: string;
    category?: string;
  };
}