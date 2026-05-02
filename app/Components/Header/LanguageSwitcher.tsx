// components/header/LanguageSwitcher.tsx
'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/navigation';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div className="inline-flex items-center gap-0.5 bg-gray-50 dark:bg-neutral-900/50 rounded-full p-0.5 text-xs font-medium border border-gray-200 dark:border-neutral-800 ">
      <button
        onClick={() => switchLocale('uk')}
        className={`px-2.5 py-1 rounded-full transition-all duration-200 cursor-pointer ${
          locale === 'uk'
            ? 'bg-white dark:bg-neutral-800 text-black dark:text-white shadow-sm'
            : 'text-gray-500 dark:text-neutral-500 hover:text-gray-700 dark:hover:text-neutral-300'
        }`}
      >
        УКР
      </button>

      <button
        onClick={() => switchLocale('en')}
        className={`px-2.5 py-1 rounded-full transition-all duration-200 cursor-pointer ${
          locale === 'en'
            ? 'bg-white dark:bg-neutral-800 text-black dark:text-white shadow-sm'
            : 'text-gray-500 dark:text-neutral-500 hover:text-gray-700 dark:hover:text-neutral-300'
        }`}
      >
        ENG
      </button>
    </div>
  );
}
