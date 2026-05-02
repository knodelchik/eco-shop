'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { Moon, Sun, Monitor, ArrowRight } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import {
  FacebookIcon,
  InstagramIcon,
  TelegramIcon,
  YouTubeIcon,
} from './icons/SocialIcons';
import { Link } from '@/navigation';
import { toast } from 'sonner';
import { authService } from '@/app/[locale]/services/authService';

export default function Footer() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const locale = useLocale();

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const tFooter = useTranslations('Footer');

  useEffect(() => setMounted(true), []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    try {
      const { user } = await authService.getCurrentUser();
      if (!user) {
        toast.error(tFooter('subscribeLoginRequired'));
        setSubmitting(false);
        return;
      }
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        body: JSON.stringify({ email, lang: locale }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(tFooter('subscribeSuccess'));
        setEmail('');
      } else {
        if (res.status === 409 || data.message?.includes('already')) {
          toast.info(tFooter('subscribeAlreadySubscribed'));
        } else {
          toast.error(tFooter('subscribeError'));
        }
      }
    } catch {
      toast.error(tFooter('subscribeError'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <footer className="border-t border-border bg-background mt-24">
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Top: 4 columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="logo-typo text-xl flex items-center gap-2 text-foreground mb-4">
              <span className="logo-leaf" aria-hidden="true" />
              <span>EcoShop</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mb-5">
              {tFooter('tagline')}
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://t.me/+380501391539"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <TelegramIcon className="h-4 w-4" />
              </a>
              <a
                href="https://www.instagram.com/_ecoshop/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <InstagramIcon className="h-4 w-4" />
              </a>
              <a
                href="https://www.facebook.com/EcoShopK"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <FacebookIcon className="h-4 w-4" />
              </a>
              <a
                href="https://www.youtube.com/@and-1717"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <YouTubeIcon className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-4">
              {tFooter('footerShop')}
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/shop?category=sharpeners" className="text-foreground/80 hover:text-foreground transition-colors">
                  {tFooter('footerKnifeSharpeners')}
                </Link>
              </li>
              <li>
                <Link href="/shop?category=stones" className="text-foreground/80 hover:text-foreground transition-colors">
                  {tFooter('footerWhetstones')}
                </Link>
              </li>
              <li>
                <Link href="/shop?category=accessories" className="text-foreground/80 hover:text-foreground transition-colors">
                  {tFooter('footerAccessories')}
                </Link>
              </li>
              <li>
                <Link href="/shop" className="text-foreground/80 hover:text-foreground transition-colors">
                  {tFooter('footerOurProducts')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-4">
              {tFooter('footerSupport')}
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/contact" className="text-foreground/80 hover:text-foreground transition-colors">
                  {tFooter('footerDelivery')}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-foreground/80 hover:text-foreground transition-colors">
                  {tFooter('footerContacts')}
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-foreground/80 hover:text-foreground transition-colors">
                  {tFooter('footerAboutUs')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-4">
              {tFooter('subscribeTitle') ?? 'Розсилка'}
            </h3>
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
              {tFooter('subscribeDescription') ?? 'Раз на місяць — нові товари і еко-гайди.'}
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={tFooter('subscribePlaceholder')}
                className="flex-1 min-w-0 px-3 py-2 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                required
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-3 py-2 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center"
                aria-label="Subscribe"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom row */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} EcoShop · {tFooter('footerRights') ?? 'Курсова робота'}</div>

          {/* Theme switcher */}
          <div className="flex items-center gap-1 bg-card border border-border rounded-full p-1">
            <button
              onClick={() => setTheme('light')}
              className={`p-1.5 rounded-full transition-colors ${theme === 'light' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              aria-label="Light theme"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`p-1.5 rounded-full transition-colors ${theme === 'system' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              aria-label="System theme"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`p-1.5 rounded-full transition-colors ${theme === 'dark' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              aria-label="Dark theme"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
