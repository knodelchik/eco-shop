/**
 * Серверний хелпер для синхронізації Neon Auth-юзера з нашою таблицею
 * `user_profiles`. Neon Auth тримає auth-поля (email, password hash) у
 * власних таблицях, а кастомні поля магазину (full_name, phone, role)
 * живуть у нашій `user_profiles`.
 *
 * Контракт:
 *   - Викликається з `auth-guard.ts:fetchSessionUser` ПРИ КОЖНОМУ session-
 *     check-у (через requireOwnUser або /api/auth/me). Це гарантовано
 *     спрацьовує одразу після того, як юзер вперше отримує сесію.
 *   - Якщо Neon Auth повернув `name` (з форми реєстрації) — записуємо у
 *     full_name. На existing-row робимо COALESCE: якщо full_name був NULL,
 *     бекфілимо; якщо вже заповнений — не перетираємо те, що юзер міг
 *     відредагувати у профілі.
 *   - role встановлюється тільки при першому INSERT. Подальші upsert-и
 *     НЕ перетирають role (адмін лишається адміном).
 */
import 'server-only';
import { sql } from '@/lib/neon-db';

export interface UserProfileRow {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  role: 'user' | 'admin';
}

export async function ensureUserProfile(
  userId: string,
  defaultName?: string | null
): Promise<UserProfileRow> {
  const seedName = defaultName && defaultName.trim().length > 0 ? defaultName.trim() : null;

  // Один round-trip: upsert з COALESCE на full_name + повертаємо актуальний рядок.
  // EXCLUDED.full_name = новий seedName; user_profiles.full_name = поточне значення.
  // COALESCE(current, new) → якщо current уже встановлений, не чіпаємо.
  const rows = (await sql`
    INSERT INTO user_profiles (user_id, full_name, role)
    VALUES (${userId}::uuid, ${seedName}, 'user')
    ON CONFLICT (user_id) DO UPDATE SET
      full_name = COALESCE(user_profiles.full_name, EXCLUDED.full_name),
      updated_at = CASE
        WHEN user_profiles.full_name IS NULL AND EXCLUDED.full_name IS NOT NULL
          THEN NOW()
        ELSE user_profiles.updated_at
      END
    RETURNING user_id, full_name, phone, role
  `) as Record<string, unknown>[];

  const row = rows[0];
  return {
    user_id: String(row.user_id),
    full_name: row.full_name ? String(row.full_name) : null,
    phone: row.phone ? String(row.phone) : null,
    role: (row.role === 'admin' ? 'admin' : 'user') as 'user' | 'admin',
  };
}
