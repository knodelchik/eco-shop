import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/neon-db';

/**
 * GET /api/admin/orders?since=ISO&limit=N&status=paid
 *
 * Адмінський перегляд усіх замовлень.
 * УВАГА: для продакшену додайте перевірку, що користувач є admin.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const since = searchParams.get('since');
  const limit = searchParams.get('limit');
  const status = searchParams.get('status');

  try {
    // Збираємо WHERE-частину динамічно
    let rows;
    if (since && status) {
      rows = limit
        ? await sql`SELECT * FROM orders WHERE created_at >= ${since}::timestamptz AND status = ${status} ORDER BY created_at DESC LIMIT ${Number(limit)}`
        : await sql`SELECT * FROM orders WHERE created_at >= ${since}::timestamptz AND status = ${status} ORDER BY created_at DESC`;
    } else if (since) {
      rows = limit
        ? await sql`SELECT * FROM orders WHERE created_at >= ${since}::timestamptz ORDER BY created_at DESC LIMIT ${Number(limit)}`
        : await sql`SELECT * FROM orders WHERE created_at >= ${since}::timestamptz ORDER BY created_at DESC`;
    } else if (status) {
      rows = limit
        ? await sql`SELECT * FROM orders WHERE status = ${status} ORDER BY created_at DESC LIMIT ${Number(limit)}`
        : await sql`SELECT * FROM orders WHERE status = ${status} ORDER BY created_at DESC`;
    } else {
      rows = limit
        ? await sql`SELECT * FROM orders ORDER BY created_at DESC LIMIT ${Number(limit)}`
        : await sql`SELECT * FROM orders ORDER BY created_at DESC`;
    }
    return NextResponse.json(rows);
  } catch (error) {
    console.error('GET /api/admin/orders failed:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, status } = await request.json();
    if (!id || !status) {
      return NextResponse.json({ error: 'id and status required' }, { status: 400 });
    }
    await sql`UPDATE orders SET status = ${status}, updated_at = NOW() WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('PATCH /api/admin/orders failed:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
