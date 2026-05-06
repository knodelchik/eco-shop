/**
 * Безпечне отримання канонічного base URL.
 *
 * Чому окремий хелпер:
 *   - process.env.NEXT_PUBLIC_BASE_URL легко зіпсувати: trailing space при
 *     копіюванні у Vercel UI, trailing slash, забуте `https://`. PayPal/Mono
 *     відкидають такі URL з невиразними помилками.
 *   - Цей хелпер тримить всі дефенсивні правила в одному місці.
 *
 * Поведінка:
 *   1. Беремо NEXT_PUBLIC_BASE_URL, тримим whitespace і trailing slash.
 *   2. Якщо порожньо — fallback на VERCEL_URL (Vercel автоматично заповнює)
 *      з префіксом `https://` (VERCEL_URL без протоколу).
 *   3. Якщо й цього нема — `http://localhost:3000` (для local dev).
 */
function clean(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

export function getBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_BASE_URL;
  if (explicit && explicit.trim().length > 0) {
    return clean(explicit);
  }
  const vercel = process.env.VERCEL_URL;
  if (vercel && vercel.trim().length > 0) {
    const v = vercel.trim();
    return clean(v.startsWith('http') ? v : `https://${v}`);
  }
  return 'http://localhost:3000';
}
