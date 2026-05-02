'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl'; // Використовуємо useTranslations від next-intl
import { Link } from '@/navigation'; // твій navigation.ts з createNavigation

export default function Navigation() {
  const t = useTranslations('Footer'); // Припускаю, що ключі 'home', 'shop', 'about', 'contact' є у Footer, або Main. Я обрав Footer як більш імовірно

  return (
    <nav className="flex items-center gap-10 text-gray-700 dark:text-gray-300 font-medium">
      <Link
        href="/"
        className="hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        {t('footerHome')} {/* Використовуємо ключі з Footer */}
      </Link>

      <Link
        href="/shop"
        className="hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        {t('footerShop')}
      </Link>

      <div className="w-14 h-14 flex items-center justify-center">
        <Image
          src="/logo.jpg"
          alt="Логотип"
          width={56}
          height={56}
          className="object-contain rounded-full"
        />
      </div>

      <Link
        href="/about"
        className="hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        {t('footerAboutUs')}
      </Link>

      <Link
        href="/contact"
        className="hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        {t('footerContacts')}
      </Link>
    </nav>
  );
}
