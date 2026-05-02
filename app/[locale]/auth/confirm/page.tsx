'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { neonAuth } from '@/lib/neon-auth';

/**
 * Сторінка-приймачка після підтвердження email.
 * Neon Auth (Better Auth) сам обробляє verify-link і ставить cookie сесії
 * до того, як ми сюди потрапляємо. Лишається лише перевірити сесію
 * та відправити користувача на /profile.
 */
export default function AuthConfirm() {
  const router = useRouter();
  const t = useTranslations('AuthConfirm');
  const [status, setStatus] = useState<'loading' | 'success'>('loading');

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const { data } = await neonAuth.getSession();
        const session =
          data && typeof data === 'object' && 'session' in data
            ? (data as { session: unknown }).session
            : data;
        if (session) {
          setStatus('success');
          setTimeout(() => {
            router.push('/profile');
            router.refresh();
          }, 1200);
          return;
        }
        router.replace('/auth?view=signin');
      } catch (e) {
        console.error('Auth confirm error:', e);
        router.replace('/auth?view=signin');
      }
    };

    handleAuth();
  }, [router]);

  if (status !== 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950 p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-spin" />
          <p className="text-muted-foreground font-medium">
            {t?.('checking') ?? 'Перевіряємо вашу сесію...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-card rounded-2xl shadow-xl p-8 max-w-sm w-full text-center border border-border"
      >
        <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {t?.('success') ?? 'Вітаємо!'}
        </h1>
        <p className="text-muted-foreground">
          {t?.('redirecting') ?? 'Перенаправляємо вас у профіль...'}
        </p>
      </motion.div>
    </div>
  );
}
