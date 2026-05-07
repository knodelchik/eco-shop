import { NextResponse } from 'next/server';
import { ensureUserProfile } from '@/lib/user-profile';
import { signJwt } from '@/lib/jwt';

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
      `${baseUrl}/sign-in/email`,
      `${baseUrl}/api/auth/sign-in/email`,
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
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        const user = data?.user ?? data?.session?.user ?? null;
        if (!user?.id) {
          return NextResponse.json(
            { error: 'Не вдалося отримати користувача' },
            { status: 500 }
          );
        }
        const emailVerified =
          user.emailVerified === true || Boolean(user.email_confirmed_at);
        if (!emailVerified) {
          return NextResponse.json(
            { needsVerification: true, email: String(user.email ?? email) },
            { status: 200 }
          );
        }

        const nameFromAuth =
          user.name ?? user.full_name ?? user.user_metadata?.full_name;
        try {
          await ensureUserProfile(String(user.id), nameFromAuth);
        } catch (e) {
          console.error('ensureUserProfile after sign-in failed:', e);
        }

        const token = await signJwt({ sub: String(user.id) });

        return NextResponse.json({
          token,
          user: {
            id: String(user.id),
            email: String(user.email ?? email),
            name: nameFromAuth,
            emailVerified: true,
          },
        });
      }

      if (res.status !== 404) {
        const errMsg = String(data?.message ?? '');
        if (/verif|confirm/i.test(errMsg)) {
          return NextResponse.json(
            { needsVerification: true, email },
            { status: 200 }
          );
        }
        return NextResponse.json(
          { error: errMsg || 'Невірний email або пароль' },
          { status: res.status }
        );
      }
      lastErr = { status: res.status, body: data };
    }

    return NextResponse.json(
      {
        error: 'Не знайдено sign-in endpoint у Neon Auth',
        debug: lastErr,
      },
      { status: 502 }
    );
  } catch (e) {
    console.error('POST /api/auth/sign-in failed:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
