'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Menu,
  X,
  Sun,
  Moon,
  Monitor,
  Heart,
  ShoppingCart,
  User,
  LogOut,
  Globe,
  DollarSign,
  ChevronRight,
  LayoutDashboard,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslations, useLocale } from 'next-intl';
import { useCurrency } from '@/app/context/CurrencyContext';
import { User as UserType } from '../../types/users';

interface BurgerMenuProps {
  user: UserType | null;
  onSignOut: () => void;
  onCartOpen?: () => void;
  onWishlistOpen?: () => void;
  onOpen?: () => void;
  cartCount?: number;
  wishlistCount?: number;
}

export default function BurgerMenu({
  user,
  onSignOut,
  onCartOpen,
  onWishlistOpen,
  onOpen,
  cartCount = 0,
  wishlistCount = 0,
}: BurgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('BurgerMenu');
  const { currency, setCurrency } = useCurrency();

  const navigationItems = [
    { label: t('navigation.home'), path: `/${locale}` },
    { label: t('navigation.shop'), path: `/${locale}/shop` },
    { label: t('navigation.about'), path: `/${locale}/about` },
    { label: t('navigation.contact'), path: `/${locale}/contact` },
  ];

  useEffect(() => setMounted(true), []);

  const handleNavigation = (path: string) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
    router.push(path);
    setIsOpen(false);
  };

  const handleLanguageChange = (newLocale: string) => {
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';
    router.push(`/${newLocale}${pathWithoutLocale}`);
    setIsOpen(false);
  };

  const handleCartClick = () => {
    setIsOpen(false);
    setTimeout(() => {
      if (onCartOpen) {
        onCartOpen();
      }
    }, 300);
  };

  const handleWishlistClick = () => {
    setIsOpen(false);
    setTimeout(() => {
      if (onWishlistOpen) {
        onWishlistOpen();
      }
    }, 300);
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <div className="lg:hidden">
      {/* Кнопка відкриття меню */}
      <button
        onClick={() => {
          onOpen?.();
          setIsOpen(true);
        }}
        className="p-2 rounded-lg bg-white dark:bg-black hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors active:scale-95"
        aria-label={t('openMenu')}
      >
        <Menu className="h-6 w-6" />
      </button>

      {isOpen && (
        <>
          {/* Фон (Backdrop) */}
          <div
            className="fixed inset-0 z-40 animate-in fade-in duration-300 bg-black/50"
            onClick={() => setIsOpen(false)}
          />

          {/* КОНТЕЙНЕР МЕНЮ: flex flex-col важливий для притискання футера */}
          <div className="fixed top-0 right-0 h-screen h-[100dvh] w-[80vw] max-w-sm bg-white dark:bg-neutral-900 shadow-2xl z-[999] border-l border-gray-200 dark:border-neutral-700 flex flex-col">
            {/* 1. ХЕДЕР (Фіксований зверху) */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-700 flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                {t('menu')}
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors active:scale-95"
                aria-label={t('closeMenu')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 2. СКРОЛ-ЗОНА (Займає весь вільний простір: flex-1) */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {/* Інформація про користувача */}
              {user && (
                <button
                  onClick={() => handleNavigation(`/${locale}/profile`)}
                  className="w-full p-4 border-b border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors text-left active:scale-[0.98]"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-neutral-300 to-neutral-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-neutral-800 dark:text-white truncate">
                        {user.full_name || t('user.defaultName')}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                        {user.email}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  </div>
                </button>
              )}

              {/* Навігація */}
              <div className="p-4 border-b border-gray-200 dark:border-neutral-700">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase mb-3 tracking-wide">
                  {t('sections.navigation')}
                </h3>
                <nav className="space-y-1">
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => handleNavigation(`/${locale}/admin`)}
                      className="w-full flex items-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-sm font-semibold active:scale-95 mb-2"
                    >
                      <LayoutDashboard className="h-4 w-4 mr-3" />
                      Адмін Панель
                    </button>
                  )}

                  {navigationItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                      <button
                        key={item.path}
                        onClick={() => handleNavigation(item.path)}
                        className={`w-full flex items-center p-3 rounded-lg transition-colors text-sm active:scale-95 ${
                          isActive
                            ? 'bg-neutral-200/80 dark:bg-neutral-500/20 text-black-600 dark:text-white font-semibold'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-neutral-300 font-medium'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Швидкий доступ */}
              <div className="p-4 border-b border-gray-200 dark:border-neutral-700">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase mb-3 tracking-wide">
                  {t('sections.quickAccess')}
                </h3>
                <div className="space-y-1">
                  <button
                    onClick={handleWishlistClick}
                    className="w-full flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors text-black dark:text-white text-sm active:scale-95"
                  >
                    <Heart className="h-4 w-4 mr-3 flex-shrink-0" />
                    <span className="flex-1 text-left">
                      {t('quickAccess.wishlist')}
                    </span>
                    {wishlistCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-medium">
                        {wishlistCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={handleCartClick}
                    className="w-full flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors text-black dark:text-white text-sm active:scale-95"
                  >
                    <ShoppingCart className="h-4 w-4 mr-3 flex-shrink-0" />
                    <span className="flex-1 text-left">
                      {t('quickAccess.cart')}
                    </span>
                    {cartCount > 0 && (
                      <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 font-medium">
                        {cartCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Налаштування (Тема, Мова, Валюта) */}
              <div className="p-4 border-b border-gray-200 dark:border-neutral-700">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase mb-3 tracking-wide">
                  {t('sections.settings')}
                </h3>
                {/* Тема */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-black dark:text-white mb-2">
                    {t('settings.theme.label')}
                  </p>
                  <div className="flex items-center border border-gray-200 dark:border-neutral-700 rounded-xl overflow-hidden">
                    {[
                      {
                        icon: <Sun className="h-4 w-4" />,
                        key: 'light',
                        label: t('settings.theme.light'),
                      },
                      {
                        icon: <Monitor className="h-4 w-4" />,
                        key: 'system',
                        label: t('settings.theme.system'),
                      },
                      {
                        icon: <Moon className="h-4 w-4" />,
                        key: 'dark',
                        label: t('settings.theme.dark'),
                      },
                    ].map((themeOption) => (
                      <button
                        key={themeOption.key}
                        onClick={() => setTheme(themeOption.key)}
                        className={`flex-1 p-3 text-xs transition-colors flex items-center justify-center space-x-1 active:scale-95 ${
                          theme === themeOption.key
                            ? 'bg-neutral-200 dark:dark:bg-neutral-500/20 text-gray-900 dark:text-white font-semibold'
                            : 'hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-600 dark:text-neutral-400'
                        }`}
                        title={themeOption.label}
                      >
                        {themeOption.icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Мова */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-black dark:text-white mb-2 flex items-center">
                    <Globe className="h-4 w-4 mr-1" />
                    {t('settings.language.label')}
                  </p>
                  <div className="flex items-center border border-gray-200 dark:border-neutral-700 rounded-xl overflow-hidden">
                    {[
                      { label: 'УКР', value: 'uk' },
                      { label: 'ENG', value: 'en' },
                    ].map((lang) => (
                      <button
                        key={lang.value}
                        onClick={() => handleLanguageChange(lang.value)}
                        className={`flex-1 p-3 text-xs transition-colors flex items-center justify-center space-x-1 active:scale-95 ${
                          locale === lang.value
                            ? 'bg-neutral-200 dark:bg-neutral-500/20 text-gray-900 dark:text-white font-semibold'
                            : 'hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-600 dark:text-neutral-400'
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Валюта */}
                <div>
                  <p className="text-xs font-medium text-black dark:text-white mb-2 flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    {t('settings.currency.label')}
                  </p>
                  <div className="flex items-center border border-gray-200 dark:border-neutral-700 rounded-xl overflow-hidden">
                    {['UAH', 'USD', 'EUR'].map((cur) => (
                      <button
                        key={cur}
                        onClick={() =>
                          setCurrency(cur as 'UAH' | 'USD' | 'EUR')
                        }
                        className={`flex-1 p-3 text-xs transition-colors flex items-center justify-center space-x-1 active:scale-95 ${
                          currency === cur
                            ? 'bg-neutral-200 dark:bg-neutral-500/20 text-gray-900 dark:text-white font-semibold'
                            : 'hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-600 dark:text-neutral-400'
                        }`}
                      >
                        {cur}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Акаунт */}
              <div className="p-4 border-b border-gray-200 dark:border-neutral-700">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase mb-3 tracking-wide">
                  {t('sections.account')}
                </h3>
                {user ? (
                  <button
                    onClick={onSignOut}
                    className="w-full flex items-center p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400 text-sm active:scale-95"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    {t('account.signOut')}
                  </button>
                ) : (
                  <div className="space-y-2">
                    {/* Кнопка Входу */}
                    <button
                      onClick={() => handleNavigation(`/${locale}/auth`)}
                      className="w-full flex items-center justify-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors text-gray-700 dark:text-neutral-200 text-sm active:scale-95 border border-gray-200 dark:border-neutral-700"
                    >
                      <User className="h-4 w-4 mr-2" />
                      {t('account.signIn')}
                    </button>

                    {/* Кнопка Реєстрації */}
                    <button
                      onClick={() =>
                        handleNavigation(`/${locale}/auth?view=signup`)
                      }
                      className="w-full flex items-center justify-center p-3 rounded-lg bg-gradient-to-r from-neutral-200 to-neutral-300 text-neutral-700 dark:from-neutral-600 dark:to-neutral-800 dark:text-white transition-all text-sm font-medium active:scale-95"
                    >
                      {t('account.signUp')}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 3. ФУТЕР (Закріплений знизу) */}
            <div className="p-4 bg-gray-50 dark:bg-neutral-900/90 border-t border-gray-200 dark:border-neutral-700 flex-shrink-0 pb-8">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
                © {new Date().getFullYear()} {t('footer.copyright')}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
