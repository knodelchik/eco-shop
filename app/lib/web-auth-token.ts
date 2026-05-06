/**
 * Клієнтський токен-стор для веба.
 *
 * Модель auth: Neon Auth client SDK тримає сесію у localStorage під своїми
 * ключами (Supabase-формат), але cookie на наш origin не пишеться. Тому наш
 * /api ніколи не бачить session-cookie у браузерному запиті.
 *
 * Цей модуль додає ПАРАЛЕЛЬНИЙ шар: після sign-in отримуємо HS256 JWT з
 * /api/auth/sign-in і кладемо у localStorage. Усі запити до /api можуть
 * прокидати його як `Authorization: Bearer ...`. На сервері auth-guard
 * перевіряє підпис → видобуває user.id. Це справжній auth (на відміну від
 * userId-в-body soft-auth, який можна підмінити).
 */

const KEY = 'ecoshop.jwt';

export function getJwt(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setJwt(token: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (token) window.localStorage.setItem(KEY, token);
    else window.localStorage.removeItem(KEY);
  } catch {
    // ignore: private browsing може блокувати localStorage
  }
}

/**
 * Headers для fetch — порожні, якщо токена нема. Можна спокійно
 * розпорошувати у будь-який запит.
 */
export function authHeaders(): Record<string, string> {
  const token = getJwt();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
