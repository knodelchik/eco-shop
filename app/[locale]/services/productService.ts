/**
 * Product service — працює напряму з Neon Postgres через `@neondatabase/serverless`.
 * API ідентичний колишньому Supabase-варіанту, тому компоненти не змінюються.
 */
import { sql } from '@/lib/neon-db';
import { Product } from '../../types/products';

// snake_case з БД → camelCase нашого Product type
function mapProduct(row: Record<string, unknown>): Product {
  return {
    id: Number(row.id),
    title: String(row.title),
    title_uk: row.title_uk ? String(row.title_uk) : undefined,
    description: row.description ? String(row.description) : undefined,
    description_uk: row.description_uk ? String(row.description_uk) : undefined,
    price: Number(row.price),
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
    category: row.category as Product['category'],
    stock: Number(row.stock ?? 0),
    created_at: row.created_at ? String(row.created_at) : undefined,
    ecoCertification: row.eco_certification ? String(row.eco_certification) : undefined,
    material: row.material ? String(row.material) : undefined,
    isBiodegradable: row.is_biodegradable === true,
    isVegan: row.is_vegan === true,
    isPlasticFree: row.is_plastic_free === true,
    carbonFootprintKg: row.carbon_footprint_kg ? Number(row.carbon_footprint_kg) : undefined,
    countryOfOrigin: row.country_of_origin ? String(row.country_of_origin) : undefined,
  };
}

export const productsService = {
  async getAllProducts(): Promise<Product[]> {
    try {
      const rows = await sql`SELECT * FROM products ORDER BY id`;
      return (rows as Record<string, unknown>[]).map(mapProduct);
    } catch (error) {
      console.error('Failed to fetch products from Neon:', error);
      return [];
    }
  },

  async getProductsByCategory(category: Product['category']): Promise<Product[]> {
    try {
      const rows = await sql`
        SELECT * FROM products
        WHERE category = ${category}
        ORDER BY id
      `;
      return (rows as Record<string, unknown>[]).map(mapProduct);
    } catch (error) {
      console.error('Failed to fetch products by category:', error);
      return [];
    }
  },

  async getProductById(id: number): Promise<Product | null> {
    try {
      const rows = await sql`SELECT * FROM products WHERE id = ${id} LIMIT 1`;
      const list = rows as Record<string, unknown>[];
      return list.length > 0 ? mapProduct(list[0]) : null;
    } catch (error) {
      console.error('Failed to fetch product by id:', error);
      return null;
    }
  },

  async getProductByTitle(title: string): Promise<Product | null> {
    try {
      const rows = await sql`SELECT * FROM products WHERE title = ${title} LIMIT 1`;
      const list = rows as Record<string, unknown>[];
      return list.length > 0 ? mapProduct(list[0]) : null;
    } catch (error) {
      console.error('Failed to fetch product by title:', error);
      return null;
    }
  },

  async getProductBySlug(slug: string): Promise<Product | null> {
    try {
      const rows = await sql`SELECT * FROM products WHERE slug = ${slug} LIMIT 1`;
      const list = rows as Record<string, unknown>[];
      return list.length > 0 ? mapProduct(list[0]) : null;
    } catch (error) {
      console.error('Failed to fetch product by slug:', error);
      return null;
    }
  },

  async createProduct(p: Omit<Product, 'id' | 'created_at'>): Promise<Product | null> {
    try {
      const rows = await sql`
        INSERT INTO products (title, title_uk, description, description_uk, price, images,
                              category, stock, eco_certification, material, is_biodegradable,
                              is_vegan, is_plastic_free, carbon_footprint_kg, country_of_origin)
        VALUES (${p.title}, ${p.title_uk ?? null}, ${p.description ?? null},
                ${p.description_uk ?? null}, ${p.price}, ${p.images},
                ${p.category}, ${p.stock}, ${p.ecoCertification ?? null},
                ${p.material ?? null}, ${p.isBiodegradable ?? false},
                ${p.isVegan ?? false}, ${p.isPlasticFree ?? false},
                ${p.carbonFootprintKg ?? null}, ${p.countryOfOrigin ?? null})
        RETURNING *
      `;
      const list = rows as Record<string, unknown>[];
      return list.length > 0 ? mapProduct(list[0]) : null;
    } catch (error) {
      console.error('Failed to create product:', error);
      return null;
    }
  },

  async updateProduct(id: number, p: Partial<Product>): Promise<Product | null> {
    try {
      const rows = await sql`
        UPDATE products
        SET title = COALESCE(${p.title ?? null}, title),
            title_uk = COALESCE(${p.title_uk ?? null}, title_uk),
            description = COALESCE(${p.description ?? null}, description),
            description_uk = COALESCE(${p.description_uk ?? null}, description_uk),
            price = COALESCE(${p.price ?? null}, price),
            images = COALESCE(${p.images ?? null}, images),
            category = COALESCE(${p.category ?? null}, category),
            stock = COALESCE(${p.stock ?? null}, stock)
        WHERE id = ${id}
        RETURNING *
      `;
      const list = rows as Record<string, unknown>[];
      return list.length > 0 ? mapProduct(list[0]) : null;
    } catch (error) {
      console.error('Failed to update product:', error);
      return null;
    }
  },

  async deleteProduct(id: number): Promise<boolean> {
    try {
      await sql`DELETE FROM products WHERE id = ${id}`;
      return true;
    } catch (error) {
      console.error('Failed to delete product:', error);
      return false;
    }
  },
};
