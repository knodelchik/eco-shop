import { Product } from "./products";

// types/wishlist.ts
export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: number;
  created_at: string;
  product?: Product; // Деталі продукту
}

export interface WishlistItemWithProduct extends WishlistItem {
  products: Product;
}