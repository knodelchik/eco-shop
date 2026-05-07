import { cookies, headers } from 'next/headers';
import { ensureUserProfile } from '@/lib/user-profile';
import { verifyJwt } from '@/lib/jwt';

export type AuthUser = {
  id: string;
  email: string;
  name?: string;
  emailVerified?: boolean;
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

async function hasSessionCookie(): Promise<boolean> {
  const cookieStore = await cookies();
  return SESSION_COOKIE_NAMES.some((name) => Boolean(cookieStore.get(name)));
}

async function getBearerToken(): Promise<string | null> {
  const h = await headers();
  const auth = h.get('authorization') ?? h.get('Authorization');
  if (!auth) return null;
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

async function getUserIdFromBearerJwt(): Promise<string | null> {
  const token = await getBearerToken();
  if (!token) return null;
  if (token.split('.').length !== 3) return null;
  const claims = await verifyJwt(token);
  return claims?.sub ?? null;
}

async function hasAnyAuth(): Promise<boolean> {
  if (await hasSessionCookie()) return true;
  if (await getUserIdFromBearerJwt()) return true;
  return Boolean(await getBearerToken());
}

async function fetchSessionUser(): Promise<AuthUser | null> {
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

export async function getSessionUser(): Promise<AuthUser | null> {
  return fetchSessionUser();
}

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

  return { ok: true, user: { id: userIdFromBody } };
}

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
