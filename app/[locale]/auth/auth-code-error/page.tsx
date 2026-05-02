'use client';

import { Link } from '@/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, RefreshCw, Mail, LogIn } from 'lucide-react';
import { neonAuth } from '@/lib/neon-auth';

function AuthCodeErrorContent() {
  const t = useTranslations('AuthError');
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();

  // Стан завантаження (поки ми розбираємося з токеном)
  const [isProcessing, setIsProcessing] = useState(true);

  // Стан помилки (показуємо ТІЛЬКИ якщо токен не спрацював)
  const [showError, setShowError] = useState(false);

  // Дані помилки для відображення
  const [errorDetails, setErrorDetails] = useState({
    type: 'default', // 'expired' | 'default'
    message: '',
  });

  // Форма
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const handleAuth = async () => {
      // У Neon Auth токени з email-link обробляються самим Auth-сервером,
      // тож від нас потрібно лише перевірити, чи вже є сесія.
      try {
        const { data } = await neonAuth.getSession();
        const session =
          data && typeof data === 'object' && 'session' in data
            ? (data as { session: unknown }).session
            : data;
        if (session) {
          toast.success(t('successVerified') || 'Success!');
          router.replace('/auth/update-password');
          return;
        }
      } catch (e) {
        console.error('Session check failed:', e);
      }

      // 3. ЯКЩО НІЧОГО НЕ СПРАЦЮВАЛО -> АНАЛІЗУЄМО ПОМИЛКУ
      let errorData = {
        error: searchParams.get('error'),
        desc: searchParams.get('error_description'),
        code: searchParams.get('error_code'),
      };

      // Перевіряємо хеш на наявність повідомлень про помилки (Supabase іноді кидає їх туди)
      if (typeof window !== 'undefined' && window.location.hash) {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        if (params.get('error') || params.get('error_code')) {
          errorData = {
            error: params.get('error') || errorData.error,
            desc: params.get('error_description') || errorData.desc,
            code: params.get('error_code') || errorData.code,
          };
        }
      }

      // Класифікуємо помилку
      const isExpired =
        errorData.code === 'otp_expired' ||
        errorData.desc?.includes('expired') ||
        errorData.error === 'no_code_received';

      setErrorDetails({
        type: isExpired ? 'expired' : 'default',
        message: errorData.desc || '',
      });

      // Показуємо екран помилки
      setIsProcessing(false);
      setShowError(true);
    };

    // Запускаємо логіку
    handleAuth();
  }, [searchParams, router, t]);

  // === ОБРОБНИК ПОВТОРНОЇ ВІДПРАВКИ ===
  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsResending(true);
    try {
      const res = await fetch('/api/auth/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, lang: locale }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || t('resendFailed') || 'Error sending email');
      } else {
        toast.success(t('resendSuccess') || 'Email sent successfully!');
        setEmail('');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setIsResending(false);
    }
  };

  // === ЛОАДЕР (Поки працюємо з токеном) ===
  // Якщо ми ще думаємо (isProcessing) АБО ми не показуємо помилку (значить все ок, йде редірект)
  if (isProcessing || !showError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-gray-500" />
          <p className="text-sm text-gray-500">Авторизація...</p>
        </div>
      </div>
    );
  }

  // === ЕКРАН 1: ПОСИЛАННЯ ЗАСТАРІЛО (EXPIRED) ===
  if (errorDetails.type === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950 px-4">
        <div className="max-w-md w-full bg-card rounded-[2rem] shadow-xl p-8 text-center border border-border">
          <div className="mx-auto w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-6">
            <Mail className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-3">
            {t('title.expired') || 'Посилання недійсне'}
          </h1>

          <p className="text-muted-foreground mb-8 leading-relaxed text-sm">
            {t('message.expired_suggestion') ||
              'Це посилання вже було використано. Спробуйте увійти або надішліть запит знову.'}
          </p>

          <div className="space-y-3">
            <Link
              href="/auth?view=signin"
              className="w-full bg-black text-white dark:bg-white dark:text-black py-3.5 rounded-xl font-bold hover:opacity-90 transition flex items-center justify-center gap-2"
            >
              <LogIn size={18} />
              {t('actions.tryLogin') || 'Спробувати увійти'}
            </Link>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-gray-500">
                  Або
                </span>
              </div>
            </div>

            <form onSubmit={handleResend} className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('enterEmailToResend') || 'Email'}
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-primary/30 outline-none text-sm transition-all"
              />
              <button
                type="submit"
                disabled={isResending || !email}
                className="w-full bg-gray-100 text-gray-900 dark:bg-neutral-800 dark:text-white py-3 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-neutral-700 transition flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
              >
                {isResending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {t('resendButton') || 'Надіслати посилання знову'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // === ЕКРАН 2: ІНШІ ПОМИЛКИ (DEFAULT) ===
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950 px-4">
      <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8 text-center border border-border">
        <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-red-600 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {t(`title.default`) || 'Помилка'}
          </h1>
          <p className="text-muted-foreground">
            {errorDetails.message || t(`message.default`)}
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/auth/signup"
            className="block w-full border border-border text-foreground py-3 px-4 rounded-lg font-medium hover:bg-muted transition"
          >
            {t('actions.requestNewLink')}
          </Link>
          <Link
            href="/"
            className="block w-full text-gray-500 hover:text-black dark:hover:text-white text-sm py-2 transition"
          >
            {t('actions.goHome')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthCodeError() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin" />
        </div>
      }
    >
      <AuthCodeErrorContent />
    </Suspense>
  );
}
