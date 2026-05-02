'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import AuthForm from '../../Components/AuthForm';
import { motion, AnimatePresence } from 'framer-motion';
import { authService } from '../services/authService';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { neonAuth } from '@/lib/neon-auth';
import { Link } from '@/navigation';

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('Auth');

  const [checkingSession, setCheckingSession] = useState(true);
  const initialView = searchParams.get('view') === 'signup' ? 'signup' : 'signin';
  const [authType, setAuthType] = useState<'signin' | 'signup' | 'forgot-password'>(initialView);
  const [emailForReset, setEmailForReset] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data } = await neonAuth.getSession();
        const session =
          data && typeof data === 'object' && 'session' in data
            ? (data as { session: unknown }).session
            : data;
        if (session) router.replace('/profile');
        else setCheckingSession(false);
      } catch {
        setCheckingSession(false);
      }
    };
    checkUser();
  }, [router]);

  useEffect(() => {
    const view = searchParams.get('view');
    if (view === 'signup' && authType !== 'signup') setAuthType('signup');
    else if ((view === 'signin' || !view) && authType !== 'signin' && authType !== 'forgot-password') {
      setAuthType('signin');
    }
  }, [searchParams, authType]);

  const handleSuccess = () => router.push('/profile');

  const toggleAuthType = () => {
    const nextType = authType === 'signin' ? 'signup' : 'signin';
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', nextType);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await authService.resetPasswordForEmail(emailForReset, locale);
    if (error) {
      toast.error(t('errorPrefix') + error);
    } else {
      toast.success(t('resetLinkSent'));
      setAuthType('signin');
      setEmailForReset('');
    }
    setLoading(false);
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2">
      {/* Left brand panel */}
      <aside className="hidden lg:flex relative overflow-hidden border-r border-border">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(160deg, oklch(0.92 0.04 130) 0%, oklch(0.45 0.11 150) 130%)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="relative p-16 flex flex-col justify-between w-full text-white">
          <div>
            <Link href="/" className="logo-typo text-xl flex items-center gap-2 text-white">
              <span
                className="inline-block w-3 h-3 flex-shrink-0"
                style={{
                  background: 'rgba(255,255,255,0.95)',
                  borderRadius: '50% 0',
                  transform: 'rotate(-45deg)',
                }}
                aria-hidden
              />
              <span>EcoShop</span>
            </Link>
          </div>

          <div className="max-w-md">
            <div className="text-xs uppercase tracking-widest text-white/70 font-semibold mb-4">
              {t('brandLabel')}
            </div>
            <h2 className="font-display text-4xl xl:text-5xl tracking-tight leading-[1.05] mb-6">
              {t('brandQuote')}
            </h2>
            <p className="text-white/85 text-sm leading-relaxed">
              {t('brandQuoteAuthor')}
            </p>
          </div>

          <div className="text-xs text-white/60">
            {t('brandFooter')}
          </div>
        </div>
      </aside>

      {/* Right form panel */}
      <main className="flex items-center justify-center px-6 py-16 lg:py-24">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {authType === 'forgot-password' ? (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <button
                  onClick={() => setAuthType('signin')}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('backToSignIn')}
                </button>

                <div className="section-label mb-3">{t('forgotLabel') ?? 'Відновлення'}</div>
                <h1 className="font-display text-4xl md:text-5xl tracking-tight mb-3">
                  {t('forgotPasswordTitle')}
                </h1>
                <p className="text-muted-foreground mb-8">
                  {t('forgotPasswordDesc')}
                </p>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label htmlFor="reset-email" className="block text-sm font-medium mb-2">
                      Email
                    </label>
                    <input
                      id="reset-email"
                      type="email"
                      value={emailForReset}
                      onChange={(e) => setEmailForReset(e.target.value)}
                      placeholder={t('emailPlaceholder')}
                      required
                      className="w-full h-11 px-4 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 h-12 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 active:scale-[0.99]"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loading ? t('sending') : t('sendResetLink')}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key={authType}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <div className="section-label mb-3">
                  {authType === 'signup' ? t('signupLabel') : t('signinLabel')}
                </div>
                <h1 className="font-display text-4xl md:text-5xl tracking-tight mb-3">
                  {authType === 'signup' ? t('signupTitle') : t('signinTitle')}
                </h1>
                <p className="text-muted-foreground mb-8">
                  {authType === 'signup' ? t('signupSubtitle') : t('signinSubtitle')}
                </p>

                <AuthForm
                  type={authType as 'signin' | 'signup'}
                  onSuccess={handleSuccess}
                  onToggleType={toggleAuthType}
                  onForgotPassword={() => setAuthType('forgot-password')}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
