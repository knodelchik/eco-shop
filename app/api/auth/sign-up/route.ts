/**
 * POST /api/auth/sign-up   { email, password, name? }
 *
 * Mobile-friendly proxy для Neon Auth signUp.
 * Веб використовує клієнтський neonAuth.signUp напряму, але мобілка
 * не може запустити Better Auth client → ходимо через цей роут.
 *
 * Відповідь:
 *   - { needsVerification: true, email }  — якщо треба OTP-код
 *   - { token, user }                     — якщо session видана одразу (рідко)
 */
import { NextResponse } from 'next/server';
import { neonAuth } from '@/lib/neon-auth';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email ?? '').trim();
    const password = String(body?.password ?? '');
    const name = body?.name ?? body?.full_name ?? undefined;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email і пароль обовʼязкові' },
        { status: 400 }
      );
    }

    let result: { data?: unknown; error?: unknown } = {};
    try {
      result = await neonAuth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      // Better Auth кидає виключення коли email-verification увімкнено —
      // це OK, просто повідомляємо що треба ввести OTP
      if (/session|verify|verification/i.test(msg)) {
        return NextResponse.json({ needsVerification: true, email });
      }
      if (/already|exists|registered/i.test(msg)) {
        return NextResponse.json(
          { error: 'Користувач з таким email вже зареєстрований' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: msg || 'Помилка реєстрації' },
        { status: 500 }
      );
    }

    const { data, error } = result;
    if (error) {
      const msg =
        typeof error === 'object' && error && 'message' in error
          ? String((error as { message: unknown }).message)
          : 'Sign up failed';

      // не помилка — нормальний flow з email-verification
      if (/session|verify|verification|email/i.test(msg) && !/already|exists/i.test(msg)) {
        return NextResponse.json({ needsVerification: true, email });
      }
      if (/already|exists|registered/i.test(msg)) {
        return NextResponse.json(
          { error: 'Користувач з таким email вже зареєстрований' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const d = (data ?? {}) as { user?: { id?: string; email?: string }; session?: unknown };
    if (d.session && d.user?.id) {
      // Якщо одразу видали session — повертаємо її (мобілка збереже як токен).
      // Token у Better Auth — це cookie value session_token.
      return NextResponse.json({
        // у Better Auth токен = session.token; підставляємо userId fallback
        token: d.user.id,
        user: { id: d.user.id, email: d.user.email },
      });
    }

    // За замовчуванням — потрібен OTP
    return NextResponse.json({ needsVerification: true, email });
  } catch (e) {
    console.error('POST /api/auth/sign-up failed:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
