'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../../app/[locale]/services/authService';
import { AuthFormData } from '../../app/types/users';
import { useCartStore } from '../../app/[locale]/store/cartStore';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import { Mail, Loader2, RefreshCw, AlertCircle } from 'lucide-react';

interface AuthFormProps {
  type: 'signin' | 'signup';
  onSuccess?: () => void;
  onToggleType?: () => void;
  onForgotPassword?: () => void;
}

export default function AuthForm({ type, onSuccess, onToggleType, onForgotPassword }: AuthFormProps) {
  const t = useTranslations('AuthForm');
  const tAuth = useTranslations('Auth');
  const locale = useLocale();
  const router = useRouter();

  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
    full_name: '',
  });
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMode, setSuccessMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (type === 'signup') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = (await authService.signUp({ ...formData })) as any;

        // Якщо помилка містить "session" / "verify" — це означає що Better Auth
        // потребує OTP-підтвердження email. Не показуємо як error,
        // одразу йдемо на сторінку верифікації.
        if (
          result.error &&
          /session|verify|verification/i.test(result.error) &&
          !/already|exists|registered/i.test(result.error)
        ) {
          toast.success(t('signupSuccessTitle'));
          router.push(`/auth/verify?email=${encodeURIComponent(formData.email)}`);
        } else if (result.error) {
          setError(result.error);
        } else if (result.session && result.user) {
          // Сесія створена одразу — auto-login
          const userId = result.user.id;
          if (userId) {
            await useCartStore.getState().syncCartWithDatabase(userId);
          }
          toast.success(t('signupSuccessTitle'));
          onSuccess?.();
        } else if (result.needsVerification && result.email) {
          // Потрібен OTP-код
          toast.success(t('signupSuccessTitle'));
          router.push(`/auth/verify?email=${encodeURIComponent(result.email)}`);
        } else {
          // Fallback — показати "перевірте пошту"
          setSuccessMode(true);
          toast.success(t('signupSuccessTitle'));
        }
      } else {
        const result = await authService.signIn(formData);
        if (result.error) setError(result.error);
        else if (result.user) {
          await useCartStore.getState().syncCartWithDatabase(result.user.id);
          onSuccess?.();
        }
      }
    } catch {
      setError(t('errors.unexpected'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const result = await authService.resendVerificationEmail(formData.email, locale);
      if (result.error) toast.error(t('errors.resendFailed') || 'Error sending email');
      else toast.success(t('resendSuccess') || 'Email sent again!');
    } catch {
      toast.error('Unexpected error');
    } finally {
      setResending(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (successMode) {
    return (
      <div className="text-center py-4">
        <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-6">
          <Mail className="w-6 h-6" strokeWidth={1.75} />
        </div>
        <h3 className="font-display text-3xl tracking-tight mb-3">{t('success.title')}</h3>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          {t('success.sentTo')} <span className="font-medium text-foreground">{formData.email}</span>.
          <br />
          {t('success.instruction')}
        </p>
        <button
          onClick={handleResend}
          disabled={resending}
          className="inline-flex items-center gap-2 text-sm text-primary hover:opacity-80 disabled:opacity-50 transition-opacity mx-auto mb-6"
        >
          {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {t('resendEmail')}
        </button>
        <div className="pt-6 border-t border-border">
          <button
            onClick={() => setSuccessMode(false)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('success.back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="flex items-start gap-3 p-3 mb-5 rounded-xl bg-destructive/10 border border-destructive/20 text-sm">
          <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <span className="text-destructive">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {type === 'signup' && (
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium mb-2">
              {t('labels.fullName')}
            </label>
            <input
              id="full_name"
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
              placeholder={t('placeholders.fullName')}
              className="w-full h-11 px-4 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            {t('labels.email')}
          </label>
          <input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder={t('placeholders.email')}
            className="w-full h-11 px-4 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="password" className="block text-sm font-medium">
              {t('labels.password')}
            </label>
            {type === 'signin' && onForgotPassword && (
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                {tAuth('forgotPasswordLink')}
              </button>
            )}
          </div>
          <input
            id="password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
            placeholder={t('placeholders.password')}
            className="w-full h-11 px-4 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>

        {type === 'signin' && (
          <div className="text-xs text-muted-foreground text-center -mt-2">
            Не підтвердили пошту?{' '}
            <button
              type="button"
              onClick={() => {
                if (!formData.email) {
                  toast.info('Введіть email вище');
                  return;
                }
                router.push(`/auth/verify?email=${encodeURIComponent(formData.email)}`);
              }}
              className="text-foreground hover:text-primary underline-offset-2 hover:underline transition-colors"
            >
              Ввести код підтвердження
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 h-12 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 active:scale-[0.99]"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : type === 'signup' ? (
            t('buttons.create')
          ) : (
            t('buttons.signin')
          )}
        </button>
      </form>

      <div className="text-center mt-6">
        <button
          type="button"
          onClick={onToggleType}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {type === 'signup' ? t('toggle.haveAccount') : t('toggle.noAccount')}
        </button>
      </div>
    </>
  );
}
