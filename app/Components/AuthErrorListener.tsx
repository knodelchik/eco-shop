'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthErrorListener() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Цей код працює тільки у браузері
    if (typeof window === 'undefined') return;

    // Перевіряємо хеш URL
    const hash = window.location.hash;

    // Якщо хеш містить ознаки помилки Supabase
    if (hash && (hash.includes('error=') || hash.includes('error_code='))) {
      // 1. Розбираємо хеш, щоб переконатися
      const params = new URLSearchParams(hash.substring(1));
      const error = params.get('error');
      const errorCode = params.get('error_code');

      if (error || errorCode) {
        // 2. Визначаємо поточну мову з URL (uk або en)
        // pathname зазвичай виглядає як "/uk" або "/uk/some-page"
        const segments = pathname.split('/');
        const currentLocale = segments[1] || 'uk';

        // 3. Формуємо правильний шлях до сторінки помилки
        // Ми передаємо весь хеш далі, щоб AuthCodeError його прочитав і показав текст
        const targetUrl = `/${currentLocale}/auth/auth-code-error${hash}`;

        // 4. Робимо миттєву заміну URL (replace, щоб не можна було повернутися назад на помилку)
        router.replace(targetUrl);
      }
    }
  }, [router, pathname]);

  return null; // Цей компонент нічого не рендерить візуально
}
