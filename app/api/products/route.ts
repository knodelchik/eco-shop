import { NextRequest, NextResponse } from 'next/server';
import { productsService } from '@/app/[locale]/services/productService';
import { sql } from '@/lib/neon-db';

/**
 * GET    /api/products?category=xxx&id=N&slug=xxx — товари (всі / категорія / по id / по slug)
 * POST   /api/products  { ...Product }                 — створити (admin)
 * PATCH  /api/products  { id, ...Partial<Product> }    — оновити (admin)
 * DELETE /api/products  { id }                         — видалити (admin)
 *
 * Замітка: для спрощеної архітектури курсової admin-перевірка на цьому
 * рівні не реалізована — додайте перевірку сесії Neon Auth у продакшені.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const slug = searchParams.get('slug');
  const category = searchParams.get('category');

  try {
    if (id) {
      const product = await productsService.getProductById(Number(id));
      return NextResponse.json(product);
    }

    if (slug) {
      const product = await productsService.getProductBySlug(slug);
      return NextResponse.json(product);
    }

    if (category) {
      const products = await productsService.getProductsByCategory(
        category as 'sharpeners' | 'stones' | 'accessories'
      );
      return NextResponse.json(products);
    }

    const products = await productsService.getAllProducts();
    return NextResponse.json(products);
  } catch (error) {
    console.error('GET /api/products failed:', error);
    return NextResponse.json(
      { error: 'Failed to load products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const p = await request.json();
    const rows = await sql`
      INSERT INTO products
        (title, title_uk, description, description_uk, price, images, category, stock,
         eco_certification, material, is_biodegradable, is_vegan, is_plastic_free,
         carbon_footprint_kg, country_of_origin)
      VALUES
        (${p.title}, ${p.title_uk ?? null}, ${p.description ?? null},
         ${p.description_uk ?? null}, ${p.price}, ${p.images ?? []},
         ${p.category}, ${p.stock ?? 0},
         ${p.eco_certification ?? null}, ${p.material ?? null},
         ${p.is_biodegradable ?? false}, ${p.is_vegan ?? false},
         ${p.is_plastic_free ?? false},
         ${p.carbon_footprint_kg ?? null}, ${p.country_of_origin ?? null})
      RETURNING *
    `;
    return NextResponse.json((rows as Record<string, unknown>[])[0]);
  } catch (error) {
    console.error('POST /api/products failed:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, ...p } = await request.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const rows = await sql`
      UPDATE products SET
        title = COALESCE(${p.title ?? null}, title),
        title_uk = COALESCE(${p.title_uk ?? null}, title_uk),
        description = COALESCE(${p.description ?? null}, description),
        description_uk = COALESCE(${p.description_uk ?? null}, description_uk),
        price = COALESCE(${p.price ?? null}, price),
        images = COALESCE(${p.images ?? null}, images),
        category = COALESCE(${p.category ?? null}, category),
        stock = COALESCE(${p.stock ?? null}, stock),
        eco_certification = COALESCE(${p.eco_certification ?? null}, eco_certification),
        material = COALESCE(${p.material ?? null}, material),
        country_of_origin = COALESCE(${p.country_of_origin ?? null}, country_of_origin),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return NextResponse.json((rows as Record<string, unknown>[])[0]);
  } catch (error) {
    console.error('PATCH /api/products failed:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await sql`DELETE FROM products WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('DELETE /api/products failed:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
