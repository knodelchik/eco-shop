import { NextResponse } from 'next/server';
import { neonAuth } from '@/lib/neon-auth';

/**
 * POST /api/auth/signup  { email, password, full_name? }
 *
 * Neon Auth (під капотом Better Auth) сам надсилає підтвердження пошти,
 * тому свій nodemailer тут більше не потрібен.
 */
export async function POST(req: Request) {
  try {
    const { email, password, full_name } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const { data, error } = await neonAuth.signUp({
      email,
      password,
      options: { data: { full_name } },
    });

    if (error) {
      const message =
        typeof error === 'object' && error && 'message' in error
          ? String((error as { message: unknown }).message)
          : 'Sign up failed';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: data?.user ?? null });
  } catch (error) {
    console.error('Signup Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
