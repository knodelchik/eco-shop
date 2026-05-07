import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/neon-db';
import { requireOwnUser } from '@/lib/auth-guard';
import { ensureUserProfile } from '@/lib/user-profile';

export async function GET(request: NextRequest) {
  const userId = new URL(request.url).searchParams.get('userId');
  const auth = await requireOwnUser(userId);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const profile = await ensureUserProfile(userId as string);
    return NextResponse.json(profile);
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
