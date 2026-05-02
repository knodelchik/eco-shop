import { NextResponse } from 'next/server';

/**
 * Auth callback — у Neon Auth (Better Auth під капотом) немає
 * exchangeCodeForSession. OAuth/Email-callback'и обробляються самим
 * Neon Auth сервером і встановлюють cookie сесії автоматично.
 *
 * Цей роут залишається лише для зворотної сумісності — просто перенаправляє
 * користувача далі.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const locale = searchParams.get('locale') || 'uk';
  const next = searchParams.get('next') || '/profile';
  const cleanNext = next.startsWith('/') ? next : `/${next}`;
  return NextResponse.redirect(`${origin}/${locale}${cleanNext}`);
}
