import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon-db';

/**
 * GET /api/admin/users-count — кількість користувачів у БД.
 *
 * Рахуємо за нашою `user_profiles` бо ця таблиця гарантовано існує і
 * заповнюється авто-апсертом у lib/auth-guard.ts при кожному session-check.
 * Тобто кількість = кількість юзерів, які хоч раз заходили після останнього
 * деплою. Для курсової прокси-метрики достатньо.
 */
export async function GET() {
  try {
    const rows = await sql`SELECT COUNT(*)::int AS count FROM user_profiles`;
    const count = (rows as Record<string, unknown>[])[0]?.count ?? 0;
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
