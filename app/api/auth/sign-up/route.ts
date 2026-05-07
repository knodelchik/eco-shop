import { NextResponse } from 'next/server';
import { ensureUserProfile } from '@/lib/user-profile';
import { signJwt } from '@/lib/jwt';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email ?? '').trim();
    const password = String(body?.password ?? '');
    const name = body?.name ?? body?.full_name ?? '';

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email і пароль обовʼязкові' },
        { status: 400 }
      );
    }

    const baseUrl = (process.env.NEXT_PUBLIC_NEON_AUTH_URL ?? '').replace(/\/$/, '');
    if (!baseUrl) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_NEON_AUTH_URL не налаштовано' },
        { status: 500 }
      );
    }

    const origin =
      process.env.NEXT_PUBLIC_BASE_URL ??
      req.headers.get('origin') ??
      `https://${req.headers.get('host')}`;

    const candidates = [
      `${baseUrl}/sign-up/email`,
      `${baseUrl}/api/auth/sign-up/email`,
    ];

    let lastErr: { status: number; body: unknown } | null = null;

    for (const url of candidates) {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: origin,
          Referer: origin,
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        const user = data?.user ?? data?.session?.user ?? null;
        const emailVerified =
          user?.emailVerified === true || Boolean(user?.email_confirmed_at);

        if (user?.id) {
          try {
            await ensureUserProfile(String(user.id), name || null);
          } catch (e) {
            console.error('ensureUserProfile after sign-up failed:', e);
          }
        }

        if (!user?.id || !emailVerified) {
          return NextResponse.json({ needsVerification: true, email });
        }

        const token = await signJwt({ sub: String(user.id) });
        return NextResponse.json({
          token,
          user: {
            id: String(user.id),
            email: String(user.email ?? email),
            name: user.name ?? user.full_name,
            emailVerified: true,
          },
        });
      }

      const msg = data?.message ?? '';
      if (/already|exists|registered/i.test(String(msg))) {
        return NextResponse.json(
          { error: 'Користувач з таким email вже зареєстрований' },
          { status: 409 }
        );
      }

      if (/session|verify|verification/i.test(String(msg))) {
        return NextResponse.json({ needsVerification: true, email });
      }

      if (res.status !== 404) {
        return NextResponse.json(
          { error: msg || 'Помилка реєстрації' },
          { status: res.status }
        );
      }
      lastErr = { status: res.status, body: data };
    }

    return NextResponse.json(
      {
        error: 'Не знайдено sign-up endpoint у Neon Auth',
        debug: lastErr,
      },
      { status: 502 }
    );
  } catch (e) {
    console.error('POST /api/auth/sign-up failed:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
