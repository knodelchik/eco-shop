import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { locales, defaultLocale, localePrefix } from './config';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix,
});

/**
 * Middleware:
 *  1. next-intl — підставляє правильну локаль (`/en/...`, `/uk/...`)
 *  2. Захист `/auth/update-password` — лише якщо є cookie сесії Neon Auth
 *
 * Перевірку сесії робимо просто за наявністю cookie `better-auth.session_token`
 * (Neon Auth під капотом — Better Auth). Глибока валідація відбувається
 * на серверних компонентах через `neonAuth.getSession()`.
 */
export default async function middleware(request: NextRequest) {
  // 1. Ігноруємо системні файли та API
  if (
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Локалізація через next-intl
  const response = intlMiddleware(request);

  // 3. Захист маршрутів — перевіряємо лише наявність cookie
  if (request.nextUrl.pathname.includes('/auth/update-password')) {
    // Better Auth (під Neon Auth) зберігає сесію у cookie
    const sessionCookie =
      request.cookies.get('better-auth.session_token') ??
      request.cookies.get('__Secure-better-auth.session_token');

    if (!sessionCookie) {
      const pathname = request.nextUrl.pathname;
      const pathLocale =
        locales.find((l) => pathname.startsWith(`/${l}`)) || defaultLocale;

      const url = request.nextUrl.clone();
      url.pathname = `/${pathLocale}/auth`;
      url.searchParams.set('view', 'signin');

      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
};
