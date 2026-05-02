'use client';

import { useState, useEffect } from 'react';
import { Phone, Mail, Clock, Loader2, MapPin } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { authService } from '../[locale]/services/authService';
import {
  TelegramIcon,
  YouTubeIcon,
  InstagramIcon,
  FacebookIcon,
} from './icons/SocialIcons';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SOCIAL_LINKS = [
  { Icon: TelegramIcon, href: 'https://t.me/+380501391539', label: 'Telegram' },
  { Icon: InstagramIcon, href: 'https://www.instagram.com/_ecoshop/', label: 'Instagram' },
  { Icon: FacebookIcon, href: 'https://www.facebook.com/EcoShopK', label: 'Facebook' },
  { Icon: YouTubeIcon, href: 'https://www.youtube.com/@and-1717', label: 'YouTube' },
];

export default function ContactSection() {
  const t = useTranslations('Contacts');
  const locale = useLocale();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    website_url: '', // honeypot
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { user } = await authService.getCurrentUser();
        if (user) {
          setFormData((prev) => ({
            ...prev,
            name: user.full_name || '',
            email: user.email || '',
          }));
        }
      } catch (e) {
        console.error('Autoload error:', e);
      }
    };
    loadUserData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const validate = () => {
    const { name, email, subject, message } = formData;
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      toast.error(t('fillAllFields') || 'Заповніть усі поля');
      return false;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      toast.error(t('invalidEmail') || 'Некоректний email');
      return false;
    }
    if (message.trim().length < 10) {
      toast.error(t('messageTooShort') || 'Повідомлення занадто коротке');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.website_url) {
      // honeypot — silent success
      toast.success(t('formSubmitSuccess') || 'Надіслано');
      setFormData((p) => ({ ...p, subject: '', message: '', website_url: '' }));
      return;
    }
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim(),
          lang: locale,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(t('formSubmitSuccess') || 'Надіслано');
        setFormData((p) => ({ ...p, subject: '', message: '' }));
      } else {
        toast.error(data.error || 'Помилка');
      }
    } catch {
      toast.error("Помилка з'єднання");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
      {/* Hero */}
      <header className="mb-16 md:mb-20">
        <div className="section-label mb-4">{t('label')}</div>
        <h1 className="font-display text-5xl md:text-7xl tracking-tight leading-[0.95] max-w-4xl">
          {t('titleFirst')} <br />
          <span className="text-primary">{t('contactTitle')}</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
          {t('subtitle')}
        </p>
      </header>

      <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
        {/* Left — info */}
        <motion.aside
          className="lg:col-span-5 space-y-10"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-6">
              {t('howToContact')}
            </h2>
            <ul className="space-y-6">
              <li className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4" strokeWidth={1.75} />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                    {t('phoneTitle')}
                  </div>
                  <a
                    href="tel:+380501391539"
                    className="font-display text-xl text-foreground hover:text-primary transition-colors"
                  >
                    {t('phoneValue')}
                  </a>
                </div>
              </li>

              <li className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4" strokeWidth={1.75} />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                    {t('emailTitle')}
                  </div>
                  <a
                    href={`mailto:${t('emailValue')}`}
                    className="font-display text-xl text-foreground hover:text-primary transition-colors break-all"
                  >
                    {t('emailValue')}
                  </a>
                </div>
              </li>

              <li className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4" strokeWidth={1.75} />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                    {t('hoursTitle')}
                  </div>
                  <div className="font-display text-xl text-foreground">
                    {t('hoursMonFri')}
                  </div>
                </div>
              </li>

              <li className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4" strokeWidth={1.75} />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                    {t('locationTitle')}
                  </div>
                  <div className="font-display text-xl text-foreground">
                    {t('locationCity')}
                  </div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    {t('locationDeliveryHint')}
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <div className="pt-8 border-t border-border">
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-4">
              {t('followUsTitle')}
            </h2>
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
              {t('followUsDesc')}
            </p>
            <div className="flex items-center gap-2">
              {SOCIAL_LINKS.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-11 h-11 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Decorative gradient block */}
          <div
            className="hidden lg:block aspect-[5/3] rounded-2xl border border-border"
            style={{ background: 'linear-gradient(160deg, oklch(0.92 0.04 130) 0%, oklch(0.45 0.11 150) 130%)' }}
          />
        </motion.aside>

        {/* Right — form */}
        <motion.div
          className="lg:col-span-7"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="bg-card border border-border rounded-3xl p-8 md:p-10">
            <h2 className="font-display text-3xl md:text-4xl tracking-tight mb-3">
              {t('formTitle')}
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              {t('formSubtitle')}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Honeypot */}
              <div className="opacity-0 absolute -z-10 w-0 h-0 overflow-hidden pointer-events-none">
                <input
                  type="text"
                  name="website_url"
                  value={formData.website_url}
                  onChange={handleChange}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium mb-2"
                  >
                    {t('formNameLabel')}
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={t('formNamePlaceholder')}
                    required
                    className="w-full px-4 h-11 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium mb-2"
                  >
                    {t('formEmailLabel')}
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={t('formEmailPlaceholder')}
                    required
                    className="w-full px-4 h-11 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium mb-2"
                >
                  {t('formSubjectLabel')}
                </label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder={t('formSubjectPlaceholder')}
                  required
                  className="w-full px-4 h-11 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium mb-2"
                >
                  {t('formMessageLabel')}
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder={t('formMessagePlaceholder')}
                  required
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 h-12 px-6 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('formSubmitting')}
                  </>
                ) : (
                  t('formSubmit')
                )}
              </button>

              <p className="text-xs text-muted-foreground text-center mt-4">
                {t('privacyHint', { cta: t('formSubmit') })}{' '}
                <a href="#" className="underline underline-offset-2 hover:text-foreground">
                  {t('privacyLink')}
                </a>
                .
              </p>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
