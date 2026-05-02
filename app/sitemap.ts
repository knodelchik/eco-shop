import type { MetadataRoute } from 'next';
import { sql } from '@/lib/neon-db';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://ecoshop.com';

const STATIC_PATHS = ['', '/shop', '/about', '/contact', '/auth'];
const LOCALES = ['uk', 'en'];

function createSlug(s: string) {
  return s.toLowerCase().trim().replace(/[\s\W-]+/g, '-');
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const items: MetadataRoute.Sitemap = [];

  // Статичні сторінки в обох локалях
  for (const locale of LOCALES) {
    for (const path of STATIC_PATHS) {
      items.push({
        url: `${BASE_URL}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: path === '' ? 1.0 : 0.8,
      });
    }
  }

  // Товари — динамічно з Neon
  try {
    const products = await sql`SELECT title, updated_at FROM products`;
    for (const p of products as Record<string, unknown>[]) {
      const slug = createSlug(String(p.title));
      for (const locale of LOCALES) {
        items.push({
          url: `${BASE_URL}/${locale}/shop/${slug}`,
          lastModified: p.updated_at ? new Date(String(p.updated_at)) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }
    }
  } catch (e) {
    console.warn('sitemap: cannot fetch products', e);
  }

  return items;
}
