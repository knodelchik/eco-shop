/**
 * POST /api/auth/sign-in   { email, password }
 *
 * Mobile-friendly proxy для Neon Auth signInWithPassword.
 * Повертає { token, user } — мобілка збереже token у SecureStore
 * і слатиме його у Authorization: Bearer header.
 *
 * У продакшні token = id юзера (для soft-auth з auth-guard.ts).
 * Це working approach для курсової — у production-grade застосунку треба
 * генерувати справжній JWT і валідувати його server-side.
 */
import { NextResponse } from 'next/server';
import { neonAuth } from '@/lib/neon-auth';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email ?? '').trim();
    const password = String(body?.password ?? '');

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email і пароль обовʼязкові' },
        { status: 400 }
      );
    }

    const { data, error } = await neonAuth.signInWithPassword({ email, password });

    if (error) {
      const msg =
        typeof error === 'object' && error && 'message' in error
          ? String((error as { message: unknown }).message)
          : 'Login failed';
      return NextResponse.json({ error: msg }, { status: 401 });
    }

    const d = (data ?? {}) as {
      user?: { id?: string; email?: string; name?: string; user_metadata?: { full_name?: string } };
    };

    if (!d.user?.id) {
      return NextResponse.json({ error: 'Не вдалося отримати користувача' }, { status: 500 });
    }

    return NextResponse.json({
      token: d.user.id, // soft-auth token = userId
      user: {
        id: d.user.id,
        email: d.user.email ?? email,
        name: d.user.name ?? d.user.user_metadata?.full_name,
      },
    });
  } catch (e) {
    console.error('POST /api/auth/sign-in failed:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
