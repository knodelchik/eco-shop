'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Link } from '@/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { authService } from '../../services/authService';

const OTP_LENGTH = 6;

function VerifyOtpContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations('Verify');
  const email = searchParams.get('email') ?? '';

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  // Guard від подвійного submit (наприклад paste-event на div + на input).
  const submittingRef = useRef(false);
  // Маркер успіху — щоб блокувати будь-які подальші submit'и
  // (Better Auth інвалідує OTP після першого використання).
  const verifiedRef = useRef(false);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  // Cooldown лічильник для resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  if (!email) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h1 className="font-display text-3xl mb-3">{t('noEmailTitle')}</h1>
          <p className="text-muted-foreground mb-6">{t('noEmailDesc')}</p>
          <Link
            href="/auth?view=signup"
            className="inline-flex items-center gap-2 h-11 px-5 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            <ArrowLeft className="w-4 h-4" /> {t('backToSignup')}
          </Link>
        </div>
      </div>
    );
  }

  const handleChange = (idx: number, value: string) => {
    const clean = value.replace(/\D/g, '').slice(0, 1);
    setDigits((prev) => {
      const next = [...prev];
      next[idx] = clean;
      return next;
    });
    if (clean && idx < OTP_LENGTH - 1) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && idx > 0) inputsRef.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < OTP_LENGTH - 1) inputsRef.current[idx + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const arr = pasted.split('');
    const next = Array(OTP_LENGTH).fill('').map((_, i) => arr[i] ?? '');
    setDigits(next);
    inputsRef.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
    if (pasted.length === OTP_LENGTH) submit(pasted);
  };

  const submit = async (codeOverride?: string) => {
    // Якщо вже верифіковано — нічого не робимо (захист від другого submit).
    if (verifiedRef.current) return;
    // Не дозволяємо паралельні submit'и (paste спрацьовує двічі — на div і на input).
    if (submittingRef.current) return;

    const otp = (codeOverride ?? digits.join('')).trim();
    if (otp.length !== OTP_LENGTH) {
      toast.error(t('fillAll', { n: OTP_LENGTH }));
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || t('invalidCode'));
        setDigits(Array(OTP_LENGTH).fill(''));
        inputsRef.current[0]?.focus();
        return;
      }

      // Успіх — фіксуємо щоб ніхто більше нас не викликав.
      verifiedRef.current = true;
      toast.success(t('successToast'));

      // Перевіряємо чи є сесія, і робимо редірект.
      const { user } = await authService.getCurrentUser();
      if (user) {
        router.push('/profile');
      } else {
        router.push(`/auth?view=signin&email=${encodeURIComponent(email)}`);
      }
    } catch (e) {
      console.error('verify failed:', e);
      toast.error("Помилка з'єднання з сервером");
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setResending(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'email-verification' }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(t('resendSuccess'));
        setCooldown(60);
      } else {
        toast.error(data.error || t('resendFailed'));
      }
    } catch {
      toast.error("Помилка з'єднання");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="hidden lg:flex relative overflow-hidden border-r border-border">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(160deg, oklch(0.92 0.04 130) 0%, oklch(0.45 0.11 150) 130%)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="relative p-16 flex flex-col justify-between w-full text-white">
          <Link href="/" className="logo-typo text-xl flex items-center gap-2 text-white">
            <span
              className="inline-block w-3 h-3 flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '50% 0', transform: 'rotate(-45deg)' }}
              aria-hidden
            />
            <span>EcoShop</span>
          </Link>
          <div className="max-w-md">
            <div className="text-xs uppercase tracking-widest text-white/70 font-semibold mb-4">
              {t('brandLabel')}
            </div>
            <h2 className="font-display text-4xl xl:text-5xl tracking-tight leading-[1.05] mb-6">
              {t('brandTitle')}
            </h2>
            <p className="text-white/85 text-sm leading-relaxed">
              {t('brandDesc')} ({email})
            </p>
          </div>
          <div className="text-xs text-white/60">© 2026 EcoShop</div>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex items-center justify-center px-6 py-16 lg:py-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <Link
            href="/auth?view=signup"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> {t('backToSignup')}
          </Link>

          <div className="section-label mb-3">{t('label')}</div>
          <h1 className="font-display text-4xl md:text-5xl tracking-tight mb-3">
            {t('title')}
          </h1>
          <p className="text-muted-foreground mb-8">
            {t('description')} <span className="text-foreground font-medium">{email}</span>.{' '}
            {t('checkInbox')}
          </p>

          <div className="flex justify-between gap-2 mb-6">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputsRef.current[i] = el; }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={handlePaste}
                disabled={loading}
                className="w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-display bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors disabled:opacity-50 tabular-nums"
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => submit()}
            disabled={loading || digits.join('').length !== OTP_LENGTH}
            className="w-full inline-flex items-center justify-center gap-2 h-12 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 active:scale-[0.99] mb-4"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? t('submitting') : t('submit')}
          </button>

          <div className="flex items-center justify-center text-sm text-muted-foreground">
            {t('notReceived')}
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              className="ml-2 inline-flex items-center gap-1 text-foreground hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              {cooldown > 0 ? t('resendCooldown', { s: cooldown }) : t('resend')}
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}
