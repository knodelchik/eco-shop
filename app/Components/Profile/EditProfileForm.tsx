'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { User } from '@/app/types/users';
import { authService } from '@/app/[locale]/services/authService';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pencil,
  User as UserIcon,
  Phone,
  Mail,
  X,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface EditProfileFormProps {
  user: User;
}

export default function EditProfileForm({ user }: EditProfileFormProps) {
  const t = useTranslations('Profile.Edit');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);

  const [fullName, setFullName] = useState(user.full_name || '');
  const [phone, setPhone] = useState(user.phone || '');

  const isEmailConfirmed = !!user.email_confirmed_at;

  const handleResendEmail = async () => {
    setResendingEmail(true);
    const { error } = await authService.resendVerificationEmail(user.email);
    if (error) toast.error(error);
    else toast.success(t('verificationEmailSent', { email: user.email }));
    setResendingEmail(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await authService.updateProfile(user.id, {
        full_name: fullName,
        phone,
        email: user.email,
      });
      if (error) {
        console.error('Profile update error:', error);
        toast.error(`Помилка: ${error}`);
      } else {
        toast.success(t('saveSuccess'));
        setIsEditing(false);
        window.location.reload();
      }
    } catch (err) {
      console.error('System Error:', err);
      toast.error(t('unexpectedError'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFullName(user.full_name || '');
    setPhone(user.phone || '');
    setIsEditing(false);
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="font-display text-3xl tracking-tight">{t('title')}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Особиста інформація — видима тільки вам.
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/70 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" /> {t('editButton')}
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!isEditing ? (
          <motion.div
            key="view"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <ViewRow
              icon={<Mail className="w-4 h-4" />}
              label={t('emailLabel')}
              value={user.email}
              right={
                isEmailConfirmed ? (
                  <span className="inline-flex items-center gap-1 text-xs text-primary">
                    <CheckCircle2 className="w-3 h-3" /> {t('statusConfirmed')}
                  </span>
                ) : (
                  <button
                    onClick={handleResendEmail}
                    disabled={resendingEmail}
                    className="inline-flex items-center gap-1 text-xs text-destructive hover:opacity-80 transition-opacity"
                  >
                    {resendingEmail ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <AlertCircle className="w-3 h-3" />
                    )}
                    {resendingEmail ? t('sending') : t('verifyEmailButton')}
                  </button>
                )
              }
            />

            <ViewRow
              icon={<UserIcon className="w-4 h-4" />}
              label={t('fullNameLabel')}
              value={user.full_name}
              fallback={t('notSpecified')}
            />

            <ViewRow
              icon={<Phone className="w-4 h-4" />}
              label={t('phoneLabel')}
              value={user.phone}
              fallback={t('notSpecified')}
            />
          </motion.div>
        ) : (
          <motion.form
            key="edit"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">
                {t('emailLabel')} <span className="text-xs">{t('cantChange')}</span>
              </label>
              <div className="h-11 px-4 bg-muted/50 rounded-xl flex items-center text-sm text-muted-foreground">
                {user.email}
              </div>
            </div>

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium mb-2">
                {t('fullNameLabel')}
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('fullNamePlaceholder')}
                className="w-full h-11 px-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-2">
                {t('phoneLabel')}
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('phonePlaceholder')}
                className="w-full h-11 px-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
              <p className="text-xs text-muted-foreground mt-2">{t('phoneHelper')}</p>
            </div>

            <div className="flex items-center gap-2 pt-3">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 h-11 px-5 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {loading ? t('saving') : t('saveButton')}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 h-11 px-5 bg-muted text-foreground rounded-xl font-medium hover:bg-muted/70 transition-colors"
              >
                <X className="w-4 h-4" />
                {t('cancelButton')}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

function ViewRow({
  icon,
  label,
  value,
  fallback,
  right,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
  fallback?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-border last:border-0">
      <div className="w-10 h-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
          {label}
        </div>
        <div className="font-medium text-foreground truncate">
          {value || (
            <span className="text-muted-foreground italic font-normal">{fallback ?? '—'}</span>
          )}
        </div>
      </div>
      {right && <div className="flex-shrink-0">{right}</div>}
    </div>
  );
}
