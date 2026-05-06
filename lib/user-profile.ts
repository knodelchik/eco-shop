/**
 * Серверний хелпер для роботи з кастомним профілем користувача.
 *
 * Контекст: Neon Auth тримає базові auth-поля (email, password hash, etc.)
 * у власній таблиці `neon_auth.users_sync`, яку ми не контролюємо. Кастомні
 * поля магазину (full_name, phone, role) живуть у нашій `user_profiles`.
 *
 * Проблема: коли користувач реєструється через Neon Auth, рядок у
 * `user_profiles` НЕ створюється автоматично — лише при першому виклику
 * PATCH /api/profile. Через це не можна виставити role='admin' SQL-ом, бо
 * рядка ще не існує.
 *
 * Рішення: lazy-upsert при першому запиті GET /api/profile (і будь-якому
 * іншому місці, що покладається на наявність рядка). ON CONFLICT DO NOTHING
 * атомарно і без race conditions.
 */
import 'server-only';
import { sql } from '@/lib/neon-db';

export interface UserProfileRow {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  role: 'user' | 'admin';
}

/**
 * Гарантує, що в `user_profiles` існує рядок для userId. Повертає актуальні
 * дані профілю. Якщо рядок треба було створити — створює з default role='user'.
 */
export async function ensureUserProfile(userId: string): Promise<UserProfileRow> {
  // Атомарний upsert — якщо рядок уже є, нічого не змінюємо.
  // role вказуємо явно щоб не залежати від колоночного DEFAULT.
  await sql`
    INSERT INTO user_profiles (user_id, role)
    VALUES (${userId}::uuid, 'user')
    ON CONFLICT (user_id) DO NOTHING
  `;

  const rows = (await sql`
    SELECT user_id, full_name, phone, role
    FROM user_profiles
    WHERE user_id = ${userId}::uuid
    LIMIT 1
  `) as Record<string, unknown>[];

  const row = rows[0];
  return {
    user_id: String(row.user_id),
    full_name: row.full_name ? String(row.full_name) : null,
    phone: row.phone ? String(row.phone) : null,
    role: (row.role === 'admin' ? 'admin' : 'user') as 'user' | 'admin',
  };
}
