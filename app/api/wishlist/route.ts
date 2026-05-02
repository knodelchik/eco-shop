import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/neon-db';
import { requireOwnUser } from '@/lib/auth-guard';

/**
 * GET /api/wishlist?userId=...    — список улюблених товарів з повною інформацією
 * POST /api/wishlist               — додати: { userId, productId }
 * DELETE /api/wishlist             — видалити: { userId, productId }
 *
 * Замітка: для коректної безпеки в продакшені треба перевіряти, що userId
 * відповідає поточній сесії Neon Auth. Поки приймаємо userId з body — це
 * прийнятно для курсової демо.
 */

export async function GET(request: NextRequest) {
  const userId = new URL(request.url).searchParams.get('userId');
  const auth = await requireOwnUser(userId);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const rows = await sql`
      SELECT w.id, w.product_id, w.user_id, w.created_at,
             p.title, p.title_uk, p.price, p.images, p.category, p.stock,
             p.eco_certification, p.material, p.is_biodegradable, p.is_vegan,
             p.is_plastic_free
      FROM wishlist w
      JOIN products p ON p.id = w.product_id
      WHERE w.user_id = ${userId}::uuid
      ORDER BY w.created_at DESC
    `;
    // Формат сумісний з UI: { id, product_id, products: { title, price, images... } }
    const items = (rows as Record<string, unknown>[]).map((r) => ({
      id: String(r.id),
      product_id: Number(r.product_id),
      user_id: String(r.user_id),
      created_at: String(r.created_at),
      products: {
        title: String(r.title),
        title_uk: r.title_uk ? String(r.title_uk) : undefined,
        price: Number(r.price),
        images: Array.isArray(r.images) ? (r.images as string[]) : [],
        category: r.category as string,
        stock: Number(r.stock ?? 0),
        eco_certification: r.eco_certification ? String(r.eco_certification) : undefined,
        material: r.material ? String(r.material) : undefined,
        is_biodegradable: r.is_biodegradable === true,
        is_vegan: r.is_vegan === true,
        is_plastic_free: r.is_plastic_free === true,
      },
    }));
    return NextResponse.json(items);
  } catch (error) {
    console.error('GET /api/wishlist failed:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, productId } = await request.json();
    const auth = await requireOwnUser(userId);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 });
    await sql`
      INSERT INTO wishlist (user_id, product_id)
      VALUES (${userId}::uuid, ${productId})
      ON CONFLICT (user_id, product_id) DO NOTHING
    `;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('POST /api/wishlist failed:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId, productId } = await request.json();
    const auth = await requireOwnUser(userId);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 });
    await sql`
      DELETE FROM wishlist
      WHERE user_id = ${userId}::uuid AND product_id = ${productId}
    `;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('DELETE /api/wishlist failed:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
