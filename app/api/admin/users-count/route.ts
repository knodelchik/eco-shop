import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon-db';

/**
 * GET /api/admin/users-count — кількість користувачів у БД (з neon_auth.users_sync).
 * Якщо схема відсутня (Neon Auth не увімкнено) — повертає 0.
 */
export async function GET() {
  try {
    const rows = await sql`SELECT COUNT(*)::int AS count FROM neon_auth.users_sync`;
    const count = (rows as Record<string, unknown>[])[0]?.count ?? 0;
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
