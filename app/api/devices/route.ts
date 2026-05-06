import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/neon-db';
import { requireOwnUser } from '@/lib/auth-guard';

/**
 * Реєстрація мобільного пристрою для push-нотифікацій.
 *
 * POST   /api/devices  { userId, expoPushToken, platform: 'ios'|'android' }
 * DELETE /api/devices  { userId, expoPushToken }
 *
 * Pre-condition: таблиця user_devices повинна існувати:
 *   CREATE TABLE user_devices (
 *     id BIGSERIAL PRIMARY KEY,
 *     user_id UUID NOT NULL,
 *     expo_push_token TEXT NOT NULL,
 *     platform TEXT,
 *     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *     UNIQUE (user_id, expo_push_token)
 *   );
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, expoPushToken, platform } = body ?? {};
    const auth = await requireOwnUser(userId);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    if (!expoPushToken || typeof expoPushToken !== 'string') {
      return NextResponse.json({ error: 'expoPushToken required' }, { status: 400 });
    }

    await sql`
      INSERT INTO user_devices (user_id, expo_push_token, platform)
      VALUES (${userId}::uuid, ${expoPushToken}, ${platform ?? null})
      ON CONFLICT (user_id, expo_push_token) DO NOTHING
    `;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('POST /api/devices failed:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, expoPushToken } = body ?? {};
    const auth = await requireOwnUser(userId);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    if (!expoPushToken) {
      return NextResponse.json({ error: 'expoPushToken required' }, { status: 400 });
    }
    await sql`
      DELETE FROM user_devices
      WHERE user_id = ${userId}::uuid AND expo_push_token = ${expoPushToken}
    `;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('DELETE /api/devices failed:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
