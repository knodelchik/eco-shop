import { createNavigation } from 'next-intl/navigation';
import { locales, defaultLocale, localePrefix } from './config'; // Імпорт з конфігу

export const { Link, redirect, usePathname, useRouter } = createNavigation({
  locales,
  defaultLocale,
  localePrefix,
});
