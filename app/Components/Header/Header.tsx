 
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import { useCartStore } from '../../[locale]/store/cartStore';
import { useWishlistStore } from '../../[locale]/store/wishlistStore';
import { authService } from '../../[locale]/services/authService';
import { User } from '../../types/users';
import SettingsDropdown from './SettingsDropdown';
import UserDropdown from './UserDropdown';
import WishlistDropdown from './WishlistDropdown';
import CartSheet from '../CartSheet';
import BurgerMenu from './BurgerMenu';
import MobileCartSheet from '../MobileCartSeet';
import MobileWishlistSheet from '../MobileWishlistSheet';
import LanguageSwitcher from './LanguageSwitcher';

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [, setLoading] = useState(true);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [isMobileWishlistOpen, setIsMobileWishlistOpen] = useState(false);
  const t = useTranslations('Footer');

  const { loadWishlist, clearWishlist } = useWishlistStore();
  const router = useRouter();

  const handleAuthChange = useCallback(
    async (event: string, session: any) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Додаємо role з метаданих, якщо воно там є, або з бази
        const userData: User = {
          id: session.user.id,
          email: session.user.email ?? '',
          full_name: session.user.user_metadata?.full_name,
          role: session.user.user_metadata?.role || 'user', // Важливо для адмінки
          created_at: session.user.created_at,
          updated_at: session.user.updated_at,
        };
        setUser(userData);
        useCartStore.getState().loadCartFromDatabase(session.user.id);
        loadWishlist(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        useCartStore.getState().clearCart();
        clearWishlist();
      }
      setLoading(false);
    },
    [loadWishlist, clearWishlist]
  );

  const handleSignOut = useCallback(async () => {
    try {
      await authService.signOut();
      setUser(null);
      useCartStore.getState().clearCart();
      clearWishlist();
      router.push('/');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [clearWishlist, router]);

  useEffect(() => {
    let mounted = true;
    const initAuth = async () => {
      try {
        const { user } = await authService.getCurrentUser();
        if (mounted && user) {
          setUser(user);
          await useCartStore.getState().loadCartFromDatabase(user.id);
          await loadWishlist(user.id);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    const { data: listener } =
      authService.supabase.auth.onAuthStateChange(handleAuthChange);
    initAuth();
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [handleAuthChange, loadWishlist, clearWishlist]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-background/85 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="logo-typo text-xl flex items-center gap-2 text-foreground">
            <span className="logo-leaf" aria-hidden="true" />
            <span>EcoShop</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 text-sm">
            <Link
              href="/"
              className="px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {t('footerHome')}
            </Link>
            <Link
              href="/shop"
              className="px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {t('footerShop')}
            </Link>
            <Link
              href="/about"
              className="px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {t('footerAboutUs')}
            </Link>
            <Link
              href="/contact"
              className="px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {t('footerContacts')}
            </Link>
          </nav>

          {/* Right cluster — desktop */}
          <div className="hidden lg:flex items-center gap-1 text-foreground">
            <LanguageSwitcher />
            <SettingsDropdown />
            <UserDropdown user={user} onSignOut={handleSignOut} />
            <WishlistDropdown user={user} />
            <CartSheet />
          </div>

          {/* Burger (mobile/tablet) */}
          <div className="lg:hidden flex items-center gap-2">
            <BurgerMenu
              user={user}
              onSignOut={handleSignOut}
              onOpen={() => {
                setIsMobileCartOpen(false);
                setIsMobileWishlistOpen(false);
              }}
              onCartOpen={() => {
                setIsMobileWishlistOpen(false);
                setIsMobileCartOpen(true);
              }}
              onWishlistOpen={() => {
                setIsMobileCartOpen(false);
                setIsMobileWishlistOpen(true);
              }}
            />
          </div>
        </div>
      </header>

      <MobileCartSheet
        isOpen={isMobileCartOpen}
        onClose={() => setIsMobileCartOpen(false)}
      />
      <MobileWishlistSheet
        isOpen={isMobileWishlistOpen}
        onClose={() => setIsMobileWishlistOpen(false)}
      />
    </>
  );
}
