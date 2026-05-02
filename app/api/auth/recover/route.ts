import { NextResponse } from 'next/server';
import { neonAuth } from '@/lib/neon-auth';

/**
 * POST /api/auth/recover  { email, lang? }
 *
 * Делегуємо Neon Auth — він надсилає лист із посиланням на скидання паролю.
 */
export async function POST(req: Request) {
  try {
    const { email, lang } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'email required' }, { status: 400 });
    }

    const requestUrl = new URL(req.url);
    const origin = requestUrl.origin;
    const userLocale = lang || 'uk';

    const { error } = await neonAuth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/${userLocale}/auth/update-password`,
    });

    if (error) {
      const message =
        typeof error === 'object' && error && 'message' in error
          ? String((error as { message: unknown }).message)
          : 'Failed to send recovery email';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Recover Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
