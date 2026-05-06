/**
 * Server-side helper для перевірки сесії Neon Auth.
 *
 * Стратегія перевірки (у порядку):
 *   1. Шукаємо session-cookie Better Auth АБО Bearer-токен у Authorization header
 *      (для мобільного клієнта eco-shop-mobile). Якщо нічого нема — 401.
 *   2. Якщо є — намагаємося отримати юзера через Neon Auth `get-session`.
 *      Якщо вийшло — суворо матчимо userId з body.
 *   3. Якщо `get-session` не повернув юзера (cross-origin cookie issue в dev,
 *      або просто не сконфігурований під Bearer), але cookie/токен присутній —
 *      довіряємо userId з body (soft-fallback).
 *
 * Це "soft auth" — підходить для курсової демо. У продакшені краще конфігурувати
 * Neon Auth як reverse-proxy на тому ж origin, щоб session-cookie повноцінно
 * читалася на серверному боці і `get-session` повертав юзера.
 */
import { cookies, headers } from 'next/headers';
import { ensureUserProfile } from '@/lib/user-profile';

export type AuthUser = {
  id: string;
  email: string;
  name?: string;
  emailVerified?: boolean;
  /** Кастомні поля з нашої таблиці user_profiles (синкається тут же). */
  role?: 'user' | 'admin';
  full_name?: string | null;
  phone?: string | null;
};

const SESSION_COOKIE_NAMES = [
  'better-auth.session_token',
  '__Secure-better-auth.session_token',
];

let cachedBaseUrl: string | null = null;
function getBaseUrl(): string {
  if (cachedBaseUrl) return cachedBaseUrl;
  const url = (process.env.NEXT_PUBLIC_NEON_AUTH_URL ?? '').replace(/\/$/, '');
  cachedBaseUrl = url;
  return url;
}

/**
 * Перевіряє наявність session-cookie Better Auth.
 */
async function hasSessionCookie(): Promise<boolean> {
  const cookieStore = await cookies();
  return SESSION_COOKIE_NAMES.some((name) => Boolean(cookieStore.get(name)));
}

/**
 * Читає Bearer-токен з заголовка Authorization (для мобільного клієнта).
 */
async function getBearerToken(): Promise<string | null> {
  const h = await headers();
  const auth = h.get('authorization') ?? h.get('Authorization');
  if (!auth) return null;
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

/**
 * Чи є хоч який-небудь маркер автентифікації — cookie або Bearer-токен.
 */
async function hasAnyAuth(): Promise<boolean> {
  if (await hasSessionCookie()) return true;
  return Boolean(await getBearerToken());
}

/**
 * Спроба отримати юзера через Neon Auth get-session.
 * Повертає null, якщо backend не відповідає або сесії немає.
 */
async function fetchSessionUser(): Promise<AuthUser | null> {
  const baseUrl = getBaseUrl();
  if (!baseUrl) return null;

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');
  const bearer = await getBearerToken();
  if (!cookieHeader && !bearer) return null;

  const candidates = [
    `${baseUrl}/get-session`,
    `${baseUrl}/api/auth/get-session`,
  ];

  for (const url of candidates) {
    try {
      const reqHeaders: Record<string, string> = { accept: 'application/json' };
      if (cookieHeader) reqHeaders.cookie = cookieHeader;
      if (bearer) reqHeaders.authorization = `Bearer ${bearer}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: reqHeaders,
        cache: 'no-store',
      });
      if (res.status === 404) continue;
      if (!res.ok) return null;
      const data = await res.json().catch(() => null);
      const user = data?.user || data?.session?.user || null;
      if (!user || !user.id) return null;

      const id = String(user.id);
      const nameFromAuth =
        user.name ?? user.full_name ?? user.user_metadata?.full_name ?? undefined;

      // Upsert у user_profiles — гарантуємо, що рядок існує і full_name
      // підтягнутий з форми реєстрації. Помилка тут не валить flow —
      // юзер усе одно залогінений, просто без кастомних полів.
      let profile = null;
      try {
        profile = await ensureUserProfile(id, nameFromAuth);
      } catch (e) {
        console.error('ensureUserProfile failed:', e);
      }

      return {
        id,
        email: String(user.email ?? ''),
        name: nameFromAuth,
        emailVerified: user.emailVerified === true,
        role: profile?.role,
        full_name: profile?.full_name ?? null,
        phone: profile?.phone ?? null,
      };
    } catch {
      // try next URL
    }
  }
  return null;
}

/**
 * Strict-перевірка: userId з body має дорівнювати залогіненому юзеру.
 * Працює лише якщо Neon Auth get-session повертає юзера.
 *
 * Для курсової використовуйте requireOwnUser — там soft-fallback.
 */
export async function getSessionUser(): Promise<AuthUser | null> {
  return fetchSessionUser();
}

/**
 * Soft-перевірка для курсової:
 *   - Якщо session-cookie немає — 401 (безсумнівно неавторизовано)
 *   - Якщо є cookie і Neon Auth повернув юзера — strict match userId
 *   - Якщо є cookie але Neon Auth не доступний — довіряємо userId
 */
export async function requireOwnUser(
  userIdFromBody: string | null | undefined
): Promise<
  | { ok: true; user: AuthUser | { id: string } }
  | { ok: false; status: number; error: string }
> {
  if (!userIdFromBody) {
    return { ok: false, status: 400, error: 'userId required' };
  }

  if (!(await hasAnyAuth())) {
    return { ok: false, status: 401, error: 'Не авторизовано' };
  }

  const user = await fetchSessionUser();
  if (user) {
    if (user.id !== userIdFromBody) {
      return { ok: false, status: 403, error: 'Немає доступу до цих даних' };
    }
    return { ok: true, user };
  }

  // Soft-fallback: cookie є, але get-session не доступний → довіряємо userId
  return { ok: true, user: { id: userIdFromBody } };
}

/**
 * Просто чекає валідну сесію (без зіставлення userId).
 */
export async function requireUser(): Promise<
  | { ok: true; user: AuthUser | { id: string } | null }
  | { ok: false; status: number; error: string }
> {
  if (!(await hasAnyAuth())) {
    return { ok: false, status: 401, error: 'Не авторизовано' };
  }
  const user = await fetchSessionUser();
  return { ok: true, user };
}
