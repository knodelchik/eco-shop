import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/neon-db';
import { requireOwnUser } from '@/lib/auth-guard';

/**
 * GET    /api/cart?userId=...                            — поточна корзина з товарами
 * POST   /api/cart  { userId, productId, quantity }      — додати/upsert
 * PATCH  /api/cart  { userId, productId, quantity }      — оновити кількість
 * DELETE /api/cart  { userId, productId? }               — видалити позицію або всю корзину
 */

export async function GET(request: NextRequest) {
  const userId = new URL(request.url).searchParams.get('userId');
  const auth = await requireOwnUser(userId);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const rows = await sql`
      SELECT c.id, c.product_id, c.user_id, c.quantity, c.created_at,
             p.title, p.title_uk, p.price, p.images, p.category, p.stock
      FROM cart_items c
      JOIN products p ON p.id = c.product_id
      WHERE c.user_id = ${userId}::uuid
      ORDER BY c.created_at ASC
    `;
    const items = (rows as Record<string, unknown>[]).map((r) => ({
      id: String(r.id),
      product_id: Number(r.product_id),
      user_id: String(r.user_id),
      quantity: Number(r.quantity),
      created_at: String(r.created_at),
      products: {
        title: String(r.title),
        title_uk: r.title_uk ? String(r.title_uk) : undefined,
        price: Number(r.price),
        images: Array.isArray(r.images) ? (r.images as string[]) : [],
        category: r.category as string,
        stock: Number(r.stock ?? 0),
      },
    }));
    return NextResponse.json(items);
  } catch (error) {
    console.error('GET /api/cart failed:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, productId, quantity = 1 } = await request.json();
    const auth = await requireOwnUser(userId);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 });
    await sql`
      INSERT INTO cart_items (user_id, product_id, quantity)
      VALUES (${userId}::uuid, ${productId}, ${quantity})
      ON CONFLICT (user_id, product_id)
      DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity,
                    updated_at = NOW()
    `;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('POST /api/cart failed:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId, productId, quantity } = await request.json();
    const auth = await requireOwnUser(userId);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (!productId || quantity === undefined) {
      return NextResponse.json({ error: 'productId and quantity required' }, { status: 400 });
    }
    if (quantity <= 0) {
      await sql`
        DELETE FROM cart_items
        WHERE user_id = ${userId}::uuid AND product_id = ${productId}
      `;
    } else {
      await sql`
        UPDATE cart_items
        SET quantity = ${quantity}, updated_at = NOW()
        WHERE user_id = ${userId}::uuid AND product_id = ${productId}
      `;
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('PATCH /api/cart failed:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId, productId } = await request.json();
    const auth = await requireOwnUser(userId);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    if (productId) {
      await sql`
        DELETE FROM cart_items
        WHERE user_id = ${userId}::uuid AND product_id = ${productId}
      `;
    } else {
      await sql`DELETE FROM cart_items WHERE user_id = ${userId}::uuid`;
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('DELETE /api/cart failed:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
