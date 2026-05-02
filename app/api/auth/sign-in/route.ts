/**
 * POST /api/auth/sign-in   { email, password }
 *
 * Mobile-friendly proxy для Neon Auth (Better Auth) email-password sign-in.
 * Робить direct fetch на Neon Auth REST API з ЯВНИМ Origin-хедером —
 * інакше Better Auth кидає "missing or null origin".
 *
 * Повертає { token, user } для мобільного клієнта.
 */
import { NextResponse } from 'next/server';

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

    // Origin для Better Auth — наш власний домен. Беремо з Vercel-env або з headers.
    const origin =
      process.env.NEXT_PUBLIC_BASE_URL ??
      req.headers.get('origin') ??
      `https://${req.headers.get('host')}`;

    // Better Auth може мати ендпоінт або без префіксу, або з /api/auth.
    // Пробуємо обидва варіанти.
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
        return NextResponse.json({
          token: String(user.id),
          user: {
            id: String(user.id),
            email: String(user.email ?? email),
            name: user.name ?? user.full_name ?? user.user_metadata?.full_name,
            emailVerified: user.emailVerified === true || Boolean(user.email_confirmed_at),
          },
        });
      }

      if (res.status !== 404) {
        return NextResponse.json(
          { error: data?.message || 'Невірний email або пароль' },
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
