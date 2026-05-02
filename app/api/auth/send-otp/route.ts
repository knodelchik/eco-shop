import { NextResponse } from 'next/server';

/**
 * POST /api/auth/send-otp { email, type? }
 *
 * Просить Neon Auth знову надіслати 6-значний OTP-код на email.
 * type:
 *   - 'email-verification' (default) — для підтвердження пошти при реєстрації
 *   - 'sign-in' — для логіну через OTP
 *   - 'forget-password' — для скидання паролю
 */
export async function POST(req: Request) {
  try {
    const { email, type = 'email-verification' } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'email обовʼязковий' }, { status: 400 });
    }

    const baseUrl = (process.env.NEXT_PUBLIC_NEON_AUTH_URL ?? '').replace(/\/$/, '');
    if (!baseUrl) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_NEON_AUTH_URL не налаштовано' },
        { status: 500 }
      );
    }

    const candidates = [
      `${baseUrl}/email-otp/send-verification-otp`,
      `${baseUrl}/api/auth/email-otp/send-verification-otp`,
    ];

    for (const url of candidates) {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        return NextResponse.json({ success: true, data });
      }
      if (res.status !== 404) {
        return NextResponse.json(
          { error: data?.message || 'Не вдалося надіслати код' },
          { status: res.status }
        );
      }
    }

    return NextResponse.json(
      { error: 'OTP-endpoint не знайдено. Увімкніть Email OTP у Neon Console.' },
      { status: 502 }
    );
  } catch (error) {
    console.error('send-otp failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
