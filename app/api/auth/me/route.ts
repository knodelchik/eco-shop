/**
 * GET /api/auth/me
 *
 * Повертає поточного юзера на основі або session-cookie (web), або
 * Bearer-токена у заголовку Authorization (мобільний клієнт).
 *
 * Використовується мобільним клієнтом eco-shop-mobile при `useAuth.hydrate()`
 * щоб переконатись що збережений токен ще валідний.
 */
import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-guard';

export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json({ user }, { status: 200 });
}
