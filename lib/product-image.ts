/**
 * Утиліта для отримання URL зображення товару.
 * Якщо у товара немає зображень — повертає placeholder відповідно до категорії.
 */
import { Product, ProductCategory } from '@/app/types/products';

const PLACEHOLDERS: Record<ProductCategory, string> = {
  sharpeners: '/images/placeholder-eco-cosmetics.svg', // Еко-косметика
  stones: '/images/placeholder-tableware.svg',         // Багаторазовий посуд
  accessories: '/images/placeholder-accessories.svg',  // Zero-waste аксесуари
};

/**
 * Повертає URL першого зображення товару, або placeholder, якщо зображень немає.
 */
export function getProductImage(
  product: Pick<Product, 'images' | 'category'> | null | undefined
): string {
  if (!product) return '/images/placeholder-accessories.svg';
  const first = product.images?.[0];
  if (first && first.length > 0) return first;
  return PLACEHOLDERS[product.category] ?? '/images/placeholder-accessories.svg';
}

/**
 * Повертає всі зображення товару, додаючи placeholder, якщо список порожній.
 */
export function getProductImages(
  product: Pick<Product, 'images' | 'category'> | null | undefined
): string[] {
  if (!product) return ['/images/placeholder-accessories.svg'];
  if (product.images && product.images.length > 0) return product.images;
  return [PLACEHOLDERS[product.category] ?? '/images/placeholder-accessories.svg'];
}
