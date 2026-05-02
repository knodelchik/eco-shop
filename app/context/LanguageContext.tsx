'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';

type Language = 'uk' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // next-intl автоматично знає, яка зараз мова, базуючись на URL
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const setLanguage = (newLang: Language) => {
    if (newLang === locale) return;

    // Логіка перемикання мови:
    // Ми беремо поточний шлях (наприклад, /en/profile) і замінюємо префікс мови
    // Якщо шлях не містить локалі (наприклад, корінь /), додаємо нову локаль

    let newPath;

    // Розбиваємо шлях на сегменти
    const segments = pathname.split('/');

    // segments[1] - це зазвичай локаль ('uk' або 'en')
    if (segments[1] === 'uk' || segments[1] === 'en') {
      segments[1] = newLang;
      newPath = segments.join('/');
    } else {
      // Якщо локалі немає в URL (таке буває рідко при next-intl, але про всяк випадок)
      newPath = `/${newLang}${pathname}`;
    }

    router.push(newPath);
  };

  return (
    <LanguageContext.Provider
      value={{ language: locale as Language, setLanguage }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
