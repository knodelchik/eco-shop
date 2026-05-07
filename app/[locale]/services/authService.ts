import { neonAuth } from '@/lib/neon-auth';
import { User, AuthFormData } from '../../types/users';
import { setJwt } from '../../lib/web-auth-token';

async function fetchAndStoreJwt(email: string, password: string): Promise<void> {
  try {
    const res = await fetch('/api/auth/sign-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return;
    const data = await res.json();
    if (typeof data?.token === 'string' && data.token.split('.').length === 3) {
      setJwt(data.token);
    }
  } catch {
    // ignore
  }
}

export const authService = {
  supabase: { auth: neonAuth },

  async signUp({
    email,
    password,
    full_name,
  }: {
    email: string;
    password: string;
    full_name?: string;
  }) {
     
    let result: any = null;
    try {
      result = await neonAuth.signUp({
        email,
        password,
        options: {
          data: { full_name },
          emailRedirectTo:
            typeof window !== 'undefined'
              ? `${window.location.origin}/auth/confirm`
              : undefined,
        },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exists')) {
        return {
          user: null,
          session: null,
          error: 'Користувач з таким email вже зареєстрований',
        };
      }
      if (msg.includes('session') || msg.includes('verify')) {
        return {
          user: null,
          session: null,
          error: null,
          needsVerification: true,
          email,
        };
      }
      return {
        user: null,
        session: null,
        error: msg || "Помилка з'єднання з сервером",
      };
    }

    const { data, error } = result || {};

    if (error) {
      const msg =
        typeof error === 'object' && error && 'message' in error
          ? String((error as { message: unknown }).message)
          : 'Sign up failed';

      if (/session|verify|verification|email/i.test(msg) &&
          !/already|exists|registered/i.test(msg)) {
        return {
          user: null,
          session: null,
          error: null,
          needsVerification: true,
          email,
        };
      }

      if (/already|exists|registered/i.test(msg)) {
        return {
          user: null,
          session: null,
          error: 'Користувач з таким email вже зареєстрований',
        };
      }

      return { user: null, session: null, error: msg };
    }

    const user = data?.user;
    const session = data?.session;
    const emailVerified = user?.emailVerified === true || user?.email_confirmed_at;

    if (session && emailVerified && user?.id) {
      try {
        await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, full_name }),
        });
      } catch {
        // ignore
      }
      return { user, session, error: null };
    }

    return {
      user: user ?? null,
      session: null,
      error: null,
      needsVerification: true,
      email,
    };
  },

  async signIn({ email, password }: AuthFormData): Promise<{
    user: User | null;
    session: unknown;
    error: string | null;
  }> {
    try {
      const { data, error } = await neonAuth.signInWithPassword({ email, password });
      if (error) {
        const msg =
          typeof error === 'object' && error && 'message' in error
            ? String((error as { message: unknown }).message)
            : 'Login failed';
        return { user: null, session: null, error: msg };
      }
      void fetchAndStoreJwt(email, password);
      return {
        user: (data?.user as unknown as User) ?? null,
        session: data?.session ?? null,
        error: null,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Login failed';
      return { user: null, session: null, error: msg };
    }
  },

  async signOut(): Promise<{ error: string | null }> {
    try {
      setJwt(null);
      const { error } = await neonAuth.signOut();
      const msg =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message: unknown }).message)
          : null;
      return { error: msg };
    } catch (e) {
      setJwt(null);
      return { error: e instanceof Error ? e.message : null };
    }
  },

  async getCurrentUser(): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data, error } = await neonAuth.getUser();
      if (error) {
        const msg =
          typeof error === 'object' && error && 'message' in error
            ? String((error as { message: unknown }).message)
            : null;
        return { user: null, error: msg };
      }
      const u = (data?.user ?? data) as unknown;
      if (!u || typeof u !== 'object') return { user: null, error: null };

      const user = u as Record<string, unknown>;
      const userId = String(user.id);

      let profile: { full_name?: string; phone?: string; role?: string } = {};
      try {
        const res = await fetch(`/api/profile?userId=${encodeURIComponent(userId)}`);
        if (res.ok) profile = await res.json();
      } catch {
        // ігноруємо — повернемо без кастомних полів
      }

      const mapped: User = {
        ...(user as object),
        id: userId,
        email: String(user.email ?? ''),
        full_name:
          profile.full_name ??
          (user as { user_metadata?: { full_name?: string } }).user_metadata?.full_name ??
          (user.name as string | undefined) ??
          '',
        phone: profile.phone ?? (user.phone as string) ?? '',
        email_confirmed_at:
          (user.email_confirmed_at as string | undefined) ??
          ((user.emailVerified as boolean) ? new Date().toISOString() : null),
        role: profile.role ?? 'user',
      } as unknown as User;
      return { user: mapped, error: null };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to fetch user';
      return { user: null, error: msg };
    }
  },

  async getUserProfile(
    userId: string
  ): Promise<{ profile: User | null; error: string | null }> {
    const { user, error } = await this.getCurrentUser();
    if (error || !user) return { profile: null, error: error };
    if (user.id !== userId) {
      return { profile: null, error: 'Access denied' };
    }
    return { profile: user, error: null };
  },

  async updateProfile(
    userId: string,
    updates: Partial<User>
  ): Promise<{ profile: User | null; error: string | null }> {
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          full_name: updates.full_name,
          phone: updates.phone,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { profile: null, error: data.error || 'Не вдалося оновити профіль' };
      }

      if (updates.full_name) {
        try {
          await neonAuth.updateUser({ data: { name: updates.full_name } });
        } catch {
          // ігноруємо — у нас вже збережено у user_profiles
        }
      }

      const { user } = await this.getCurrentUser();
      return { profile: user, error: null };
    } catch (e) {
      return { profile: null, error: e instanceof Error ? e.message : null };
    }
  },

  async resetPasswordForEmail(
    email: string,
    lang?: string
  ): Promise<{ error: string | null }> {
    try {
      const userLocale = lang || 'uk';
      const redirectTo =
        typeof window !== 'undefined'
          ? `${window.location.origin}/${userLocale}/auth/update-password`
          : undefined;

      const { error } = await neonAuth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        const msg =
          typeof error === 'object' && error && 'message' in error
            ? String((error as { message: unknown }).message)
            : 'Не вдалося відправити лист';
        return { error: msg };
      }
      return { error: null };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Помилка з'єднання з сервером" };
    }
  },

  async updatePassword(newPassword: string): Promise<{ error: string | null }> {
    try {
      const { error } = await neonAuth.updateUser({ password: newPassword });
      const msg =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message: unknown }).message)
          : null;
      return { error: msg };
    } catch (e) {
      return { error: e instanceof Error ? e.message : null };
    }
  },

  async resendVerificationEmail(
    email: string,
    lang?: string
  ): Promise<{ error: string | null }> {
    try {
      const res = await fetch('/api/auth/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, lang }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || 'Не вдалося відправити лист' };
      return { error: null };
    } catch {
      return { error: "Помилка з'єднання з сервером" };
    }
  },
};
