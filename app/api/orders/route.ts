import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/neon-db';
import { requireOwnUser } from '@/lib/auth-guard';

/**
 * GET /api/orders?userId=...   — замовлення користувача
 *                                (для адмінки можна зробити окремий /api/admin/orders)
 */
export async function GET(request: NextRequest) {
  const userId = new URL(request.url).searchParams.get('userId');
  const auth = await requireOwnUser(userId);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const orders = await sql`
      SELECT * FROM orders
      WHERE user_id = ${userId}::uuid
      ORDER BY created_at DESC
    `;

    // Завантажуємо позиції одним запитом
    const orderIds = (orders as Record<string, unknown>[]).map((o) => o.id);
    let items: Record<string, unknown>[] = [];
    if (orderIds.length > 0) {
      const itemRows = await sql`
        SELECT * FROM order_items WHERE order_id = ANY(${orderIds}::bigint[])
      `;
      items = itemRows as Record<string, unknown>[];
    }

    // Збираємо в один масив з вкладеними items
    const result = (orders as Record<string, unknown>[]).map((o) => ({
      ...o,
      order_items: items.filter((i) => Number(i.order_id) === Number(o.id)),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/orders failed:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
