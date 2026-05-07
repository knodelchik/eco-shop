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
