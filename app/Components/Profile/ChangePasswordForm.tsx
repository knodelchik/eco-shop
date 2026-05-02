'use client';

import { useState } from 'react';
import { authService } from '@/app/[locale]/services/authService';
import { toast } from 'sonner';
import { User } from '@/app/types/users';
import { Lock, KeyRound, LogOut, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ChangePasswordFormProps {
  user: User;
}

export default function ChangePasswordForm({ user }: ChangePasswordFormProps) {
  const t = useTranslations('Profile.Security');
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error(t('errors.passwordLength'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('errors.passwordMismatch'));
      return;
    }
    setLoading(true);
    try {
      const { error: verifyError } = await authService.signIn({
        email: user.email,
        password: currentPassword,
      });
      if (verifyError) {
        toast.error(t('errors.wrongCurrentPassword'));
        setLoading(false);
        return;
      }
      const { error: updateError } = await authService.updatePassword(newPassword);
      if (updateError) toast.error(updateError);
      else {
        toast.success(t('success.passwordChanged'));
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch {
      toast.error(t('errors.updateError'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const { error } = await authService.resetPasswordForEmail(user.email);
    if (error) toast.error(error);
    else toast.success(t('success.resetEmailSent', { email: user.email }));
  };

  const handleGlobalSignOut = async () => {
    if (confirm(t('confirmGlobalSignOut'))) {
      const { error } = await authService.signOut();
      if (error) toast.error(error);
      else toast.success(t('success.globalSignOut'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Зміна пароля */}
      <section className="bg-card border border-border rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Lock className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <h2 className="font-display text-2xl tracking-tight">{t('title')}</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">{t('labels.currentPassword')}</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full h-11 px-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{t('labels.newPassword')}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full h-11 px-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            <p className="text-xs text-muted-foreground mt-2">{t('passwordHint')}</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{t('labels.confirmPassword')}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full h-11 px-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={loading || !currentPassword || !newPassword}
              className="inline-flex items-center justify-center gap-2 h-11 px-5 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? t('saving') : t('saveButton')}
            </button>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <KeyRound className="w-4 h-4" />
              {t('forgotPassword')}
            </button>
          </div>
        </form>
      </section>

      {/* Глобальний вихід */}
      <section className="bg-card border border-border rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
            <LogOut className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <h2 className="font-display text-2xl tracking-tight">{t('globalSignOut.title')}</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          {t('globalSignOut.description')}
        </p>
        <button
          onClick={handleGlobalSignOut}
          className="inline-flex items-center justify-center gap-2 h-11 px-5 bg-destructive/10 text-destructive rounded-xl font-medium hover:bg-destructive/15 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          {t('globalSignOut.button')}
        </button>
      </section>
    </div>
  );
}
