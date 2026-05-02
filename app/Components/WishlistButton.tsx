'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useWishlistStore } from '../[locale]/store/wishlistStore';
import { authService } from '../[locale]/services/authService';

interface WishlistButtonProps {
  productId: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export default function WishlistButton({
  productId,
  size = 'md',
  className = '',
  onClick,
}: WishlistButtonProps) {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);
  // Прапорець "ми вже на клієнті" — щоб уникнути hydration mismatch.
  // На сервері localStorage недоступний, тож SSR-render показує "не в обраному".
  // Після mount-у на клієнті дозволяємо показувати реальний стан.
  const [mounted, setMounted] = useState(false);

  const {
    addToWishlist,
    removeFromWishlist,
    wishlistItems,
    isInLocalWishlist,
  } = useWishlistStore();

  useEffect(() => {
    setMounted(true);

    const checkUser = async () => {
      const { user } = await authService.getCurrentUser();
      if (user) setUser({ id: user.id });
      else setUser(null);
    };

    checkUser();

    const {
      data: { subscription },
    } = authService.supabase.auth.onAuthStateChange((event: string, session: { user?: { id: string } } | null) => {
      if (session?.user) setUser({ id: session.user.id });
      else setUser(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isInWishlistRaw = user
    ? wishlistItems.some(
        (item) => item.product_id === productId && item.user_id === user.id
      )
    : isInLocalWishlist(productId);

  // До hydration віддаємо false — це гарантує однаковий HTML на сервері й клієнті
  const isInWishlist = mounted ? isInWishlistRaw : false;

  const handleClick = async (e: React.MouseEvent) => {
    if (onClick) onClick(e);
    setLoading(true);
    try {
      if (isInWishlist) {
        await removeFromWishlist(user?.id || null, productId);
      } else {
        await addToWishlist(user?.id || null, productId);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  // 💖 курсор — додати в обране
  const addCursorSVG = `data:image/svg+xml;base64,${btoa(
    `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" opacity="0.9">
      <defs>
        <linearGradient id="heartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:rgb(252,165,165);stop-opacity:1"/>
          <stop offset="100%" style="stop-color:rgb(239,68,68);stop-opacity:1"/>
        </linearGradient>
      </defs>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
        2 5.42 4.42 3 7.5 3
        c1.74 0 3.41.81 4.5 2.09
        C13.09 3.81 14.76 3 16.5 3
        19.58 3 22 5.42 22 8.5
        c0 3.78-3.4 6.86-8.55 11.54
        L12 21.35z"
        fill="url(#heartGrad)" stroke="white" stroke-width="1.3"/>
    </svg>`
  )}`;

  // 💔 курсор — видалити з обраного (контрастний, хрестик усередині)
  const removeCursorSVG = `data:image/svg+xml;base64,${btoa(
    `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
      2 5.42 4.42 3 7.5 3
      c1.74 0 3.41.81 4.5 2.09
      C13.09 3.81 14.76 3 16.5 3
      19.58 3 22 5.42 22 8.5
      c0 3.78-3.4 6.86-8.55 11.54
      L12 21.35z"
      fill="white" stroke="red" stroke-width="2" filter="drop-shadow(0 0 2px rgba(0,0,0,0.3))"/>
    <line x1="8" y1="9" x2="16" y2="17" stroke="red" stroke-width="2.2" stroke-linecap="round"/>
    <line x1="16" y1="9" x2="8" y2="17" stroke="red" stroke-width="2.2" stroke-linecap="round"/>
  </svg>`
  )}`;

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        cursor: isInWishlist
          ? `url("${removeCursorSVG}") 2 2, pointer`
          : `url("${addCursorSVG}") 2 2, pointer`,
      }}
      className={`
        ${sizeClasses[size]} 
        flex items-center justify-center 
        rounded-full border transition-all
        ${
          isInWishlist
            ? 'bg-red-500 border-red-500 text-white'
            : 'bg-white border-gray-300 text-gray-400 hover:border-red-300 hover:text-red-400 dark:bg-neutral-800 dark:border-neutral-400 dark:hover:border-red-500'
        }
        ${className}
      `}
      aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart
        className={`
          ${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'}
          ${isInWishlist ? 'fill-current' : ''}
          transition-all duration-300
        `}
      />
    </button>
  );
}
