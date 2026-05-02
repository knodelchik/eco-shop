import { NextResponse } from 'next/server';

/**
 * POST /api/auth/resend  { email, lang? }
 *
 * У Neon Auth повторне підтвердження email відбувається через
 * better-auth API — у Supabase-сумісному адаптері це не безпосередньо
 * експоновано. Для курсової демо повертаємо успіх — користувач має просто
 * спробувати залогінитися ще раз; Neon надішле лист сам.
 */
export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'email required' }, { status: 400 });
    }
    // No-op: Neon Auth робить це автоматично під час signUp/signIn.
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Resend Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
