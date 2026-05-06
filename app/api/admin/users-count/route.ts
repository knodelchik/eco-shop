import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon-db';
import { requireAdmin } from '@/lib/auth-guard';

/**
 * GET /api/admin/users-count — кількість користувачів у БД.
 *
 * Рахуємо за нашою `user_profiles` бо ця таблиця гарантовано існує і
 * заповнюється авто-апсертом у lib/auth-guard.ts при кожному session-check.
 * Кількість = юзери, які хоч раз заходили після останнього деплою.
 */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const rows = await sql`SELECT COUNT(*)::int AS count FROM user_profiles`;
    const count = (rows as Record<string, unknown>[])[0]?.count ?? 0;
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
