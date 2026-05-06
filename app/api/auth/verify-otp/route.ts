import { NextResponse } from 'next/server';
import { ensureUserProfile } from '@/lib/user-profile';
import { signJwt } from '@/lib/jwt';

/**
 * POST /api/auth/verify-otp { email, otp }
 *
 * Server-side proxy до Better Auth (Neon Auth) `email-otp/verify-email`.
 * Підтверджує email-адресу за 6-значним кодом, який Neon надіслав на пошту.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = body?.email;
    const otp = body?.otp ?? body?.code; // мобілка шле `code`, веб — `otp`
    if (!email || !otp) {
      return NextResponse.json({ error: 'email і otp обовʼязкові' }, { status: 400 });
    }

    const baseUrl = (process.env.NEXT_PUBLIC_NEON_AUTH_URL ?? '').replace(/\/$/, '');
    if (!baseUrl) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_NEON_AUTH_URL не налаштовано' },
        { status: 500 }
      );
    }

    // Better Auth може приймати endpoint без префіксу або з /api/auth.
    // Пробуємо обидва варіанти у порядку ймовірності.
    const candidates = [
      `${baseUrl}/email-otp/verify-email`,
      `${baseUrl}/api/auth/email-otp/verify-email`,
    ];

    let lastErr: { status: number; body: unknown } | null = null;

    for (const url of candidates) {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        // Витягуємо user з відповіді (формат у Better Auth варіюється)
        const user = data?.user ?? data?.session?.user ?? null;
        const nameFromAuth =
          user?.name ?? user?.full_name ?? user?.user_metadata?.full_name;

        // Гарантуємо рядок у user_profiles після підтвердження email.
        // Не залежить від cookies — повертає юзеру коректний full_name.
        if (user?.id) {
          try {
            await ensureUserProfile(String(user.id), nameFromAuth);
          } catch (e) {
            console.error('ensureUserProfile after verify-otp failed:', e);
          }
        }

        const token = user?.id ? await signJwt({ sub: String(user.id) }) : null;

        return NextResponse.json({
          success: true,
          token,
          user: user
            ? {
                id: String(user.id),
                email: String(user.email ?? email),
                name: nameFromAuth,
                emailVerified: true,
              }
            : null,
          data,
        });
      }

      // 404 → пробуємо наступний URL; інші помилки → повертаємо
      if (res.status !== 404) {
        return NextResponse.json(
          { error: data?.message || 'Невірний код підтвердження' },
          { status: res.status }
        );
      }
      lastErr = { status: res.status, body: data };
    }

    return NextResponse.json(
      {
        error:
          'Не знайдено OTP-endpoint у Neon Auth. Перевірте налаштування Email Verification у Neon Console.',
        debug: lastErr,
      },
      { status: 502 }
    );
  } catch (error) {
    console.error('verify-otp failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
