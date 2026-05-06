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
import { verifyJwt } from '@/lib/jwt';

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
 * Якщо у Bearer-заголовку HS256 JWT — повертає user.id з claim `sub`.
 * Інакше null.
 */
async function getUserIdFromBearerJwt(): Promise<string | null> {
  const token = await getBearerToken();
  if (!token) return null;
  // Швидка перевірка формату: jwt = три base64url-частини через крапку.
  if (token.split('.').length !== 3) return null;
  const claims = await verifyJwt(token);
  return claims?.sub ?? null;
}

/**
 * Чи є хоч який-небудь маркер автентифікації — cookie, Bearer-токен,
 * або підписаний JWT (мобілка).
 */
async function hasAnyAuth(): Promise<boolean> {
  if (await hasSessionCookie()) return true;
  if (await getUserIdFromBearerJwt()) return true;
  return Boolean(await getBearerToken());
}

/**
 * Спроба отримати юзера через Neon Auth get-session.
 * Повертає null, якщо backend не відповідає або сесії немає.
 */
async function fetchSessionUser(): Promise<AuthUser | null> {
  // Швидкий шлях для мобілки: JWT у Bearer — sub = user.id, далі тягнемо
  // профіль з нашої БД, без запиту у Neon Auth (мінус один HTTP hop).
  const jwtUserId = await getUserIdFromBearerJwt();
  if (jwtUserId) {
    let profile = null;
    try {
      profile = await ensureUserProfile(jwtUserId);
    } catch (e) {
      console.error('ensureUserProfile failed (jwt path):', e);
    }
    return {
      id: jwtUserId,
      email: '', // email не зберігається у нашій user_profiles — лишаємо порожнім
      role: profile?.role,
      full_name: profile?.full_name ?? null,
      phone: profile?.phone ?? null,
    };
  }

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
 * Soft-перевірка для курсової демо.
 *
 * Реальність нашого setup:
 *   - Neon Auth (Better Auth під капотом) сидить на іншому домені, ніж
 *     наш Next.js. Клієнтський SDK тримає сесію у localStorage (Supabase
 *     адаптер), а cookie на наш origin не пишеться. Тобто сервер ніколи
 *     не побачить session-cookie у браузерному запиті.
 *   - Мобілка шле Bearer-токен (= userId), і це працює.
 *   - Веб шле просто userId у body.
 *
 * Тому контракт такий:
 *   1. userId у body — обов'язковий (валідний UUID).
 *   2. Якщо є cookie АБО Bearer і Neon Auth повертає юзера — strict match.
 *   3. Якщо нічого з цього — довіряємо userId з body (демо-grade).
 *
 * У продакшені треба підняти Neon Auth на тому ж origin або генерувати
 * власний JWT. Зараз — не блокуємо UX курсової.
 */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function requireOwnUser(
  userIdFromBody: string | null | undefined
): Promise<
  | { ok: true; user: AuthUser | { id: string } }
  | { ok: false; status: number; error: string }
> {
  if (!userIdFromBody) {
    return { ok: false, status: 400, error: 'userId required' };
  }
  if (!UUID_RE.test(userIdFromBody)) {
    return { ok: false, status: 400, error: 'userId must be a valid UUID' };
  }

  if (await hasAnyAuth()) {
    const user = await fetchSessionUser();
    if (user) {
      if (user.id !== userIdFromBody) {
        return { ok: false, status: 403, error: 'Немає доступу до цих даних' };
      }
      return { ok: true, user };
    }
  }

  // Демо-fallback: ні cookie ні Bearer не дойшли. Довіряємо userId з body.
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

/**
 * Перевірка для admin-endpoint-ів.
 *
 * Source of truth — `user_profiles.role`. Email-allow-list з
 * `NEXT_PUBLIC_ADMIN_EMAILS` лишений як bootstrap-fallback (першому адміну
 * рядок у БД може ще не бути виставлений).
 *
 * Через soft-auth (cookie може бути відсутній на нашому домені) приймаємо
 * також userId або email з body/query — у такому разі робимо upsert профілю
 * та звіряємо role у БД.
 */
// Список admin-email-ів. Підтримуємо обидва імені змінних:
//   - ADMIN_EMAILS (server-only, рекомендовано)
//   - NEXT_PUBLIC_ADMIN_EMAILS (legacy, був видний у клієнтському bundle)
// Server-only варіант пріоритетний. Сторінка admin-layout.tsx досі читає
// NEXT_PUBLIC_ADMIN_EMAILS у браузері — це bootstrap-fallback, який можна
// прибрати після того як БД-роль виставлена для адміна.
const ADMIN_EMAILS = (
  process.env.ADMIN_EMAILS ??
  process.env.NEXT_PUBLIC_ADMIN_EMAILS ??
  ''
)
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function requireAdmin(opts?: {
  userId?: string | null;
  email?: string | null;
}): Promise<
  | { ok: true; user: AuthUser | { id: string } }
  | { ok: false; status: number; error: string }
> {
  // 1. Якщо є cookie/Bearer — пробуємо canonical session check.
  if (await hasAnyAuth()) {
    const user = await fetchSessionUser();
    if (user) {
      if (
        user.role === 'admin' ||
        (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase()))
      ) {
        return { ok: true, user };
      }
      return { ok: false, status: 403, error: 'Потрібні права адміна' };
    }
  }

  // 2. Soft-fallback: дивимось на ідентифікатор з тіла запиту.
  if (opts?.userId && UUID_RE.test(opts.userId)) {
    const profile = await ensureUserProfile(opts.userId).catch(() => null);
    if (profile?.role === 'admin') {
      return { ok: true, user: { id: opts.userId } };
    }
  }
  if (opts?.email && ADMIN_EMAILS.includes(opts.email.toLowerCase())) {
    return {
      ok: true,
      user: { id: opts?.userId ?? 'admin-by-email' },
    };
  }

  return { ok: false, status: 401, error: 'Не авторизовано' };
}
