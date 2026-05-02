import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/neon-db';
import { requireOwnUser } from '@/lib/auth-guard';

/**
 * GET   /api/profile?userId=...  — отримати додаткові поля профілю
 * PATCH /api/profile { userId, full_name?, phone? } — оновити profil
 *
 * Кастомні поля користувача (повне ім'я, телефон, роль) зберігаються
 * у таблиці `user_profiles`. Базові поля (email, тощо) керуються
 * Neon Auth і живуть у `neon_auth.users_sync`.
 */
export async function GET(request: NextRequest) {
  const userId = new URL(request.url).searchParams.get('userId');
  const auth = await requireOwnUser(userId);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const rows = await sql`
      SELECT user_id, full_name, phone, role, created_at, updated_at
      FROM user_profiles
      WHERE user_id = ${userId}::uuid
      LIMIT 1
    `;
    const list = rows as Record<string, unknown>[];
    if (list.length === 0) {
      // Профілю ще немає — повертаємо порожні значення
      return NextResponse.json({
        user_id: userId,
        full_name: null,
        phone: null,
        role: 'user',
      });
    }
    return NextResponse.json(list[0]);
  } catch (error) {
    console.error('GET /api/profile failed:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId, full_name, phone } = await request.json();
    const auth = await requireOwnUser(userId);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    // UPSERT — створює запис, якщо його ще не було, або оновлює
    await sql`
      INSERT INTO user_profiles (user_id, full_name, phone)
      VALUES (${userId}::uuid, ${full_name ?? null}, ${phone ?? null})
      ON CONFLICT (user_id) DO UPDATE SET
        full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
        phone = COALESCE(EXCLUDED.phone, user_profiles.phone),
        updated_at = NOW()
    `;
    const rows = await sql`
      SELECT user_id, full_name, phone, role FROM user_profiles
      WHERE user_id = ${userId}::uuid
    `;
    return NextResponse.json((rows as Record<string, unknown>[])[0]);
  } catch (error) {
    console.error('PATCH /api/profile failed:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
