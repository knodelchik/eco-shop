/**
 * Neon Auth клієнт із Supabase-сумісним адаптером.
 *
 * Завдяки SupabaseAuthAdapter API ідентичний @supabase/supabase-js auth:
 *   - signInWithPassword, signUp, signOut
 *   - getSession, getUser, updateUser
 *   - resetPasswordForEmail, signInWithOAuth
 *   - onAuthStateChange
 *
 * Тому існуючий код, який викликав `supabase.auth.signInWithPassword(...)`,
 * продовжує працювати після заміни імпорту.
 */
import { createAuthClient } from '@neondatabase/auth';
import { SupabaseAuthAdapter } from '@neondatabase/auth/vanilla/adapters';

if (!process.env.NEXT_PUBLIC_NEON_AUTH_URL) {
  throw new Error('NEXT_PUBLIC_NEON_AUTH_URL is missing in .env.local');
}

export const neonAuth = createAuthClient(
  process.env.NEXT_PUBLIC_NEON_AUTH_URL,
  { adapter: SupabaseAuthAdapter() }
);
