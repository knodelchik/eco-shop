import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WishlistItemWithProduct } from '../../types/wishlist';
import { wishlistService } from '../services/wishlistService';
import { useCartStore } from './cartStore';
import { toast } from 'sonner';

interface WishlistState {
  wishlistItems: WishlistItemWithProduct[];
  localWishlist: number[];
  loading: boolean;

  loadWishlist: (userId: string) => Promise<void>;
  addToWishlist: (userId: string | null, productId: number) => Promise<void>;
  removeFromWishlist: (
    userId: string | null,
    productId: number
  ) => Promise<void>;
  isInWishlist: (userId: string | null, productId: number) => Promise<boolean>;

  // ОНОВЛЕНО: додано аргумент t для перекладу
  moveToCart: (userId: string, productId: number, t: any) => Promise<void>;

  clearWishlist: () => void;
  addToLocalWishlist: (productId: number) => void;
  removeFromLocalWishlist: (productId: number) => void;
  isInLocalWishlist: (productId: number) => boolean;
  syncLocalWishlist: (userId: string) => Promise<void>;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      wishlistItems: [],
      localWishlist: [],
      loading: false,

      loadWishlist: async (userId: string) => {
        set({ loading: true });
        try {
          const items = await wishlistService.getWishlist(userId);
          set({ wishlistItems: items });
        } catch (error) {
          console.error('Failed to load wishlist:', error);
        } finally {
          set({ loading: false });
        }
      },

      addToWishlist: async (userId: string | null, productId: number) => {
        if (!userId) {
          get().addToLocalWishlist(productId);
          return;
        }
        try {
          const success = await wishlistService.addToWishlist(
            userId,
            productId
          );
          if (success) {
            await get().loadWishlist(userId);
          }
        } catch (error) {
          console.error('Failed to add to wishlist:', error);
        }
      },

      removeFromWishlist: async (userId: string | null, productId: number) => {
        if (!userId) {
          get().removeFromLocalWishlist(productId);
          return;
        }
        try {
          const success = await wishlistService.removeFromWishlist(
            userId,
            productId
          );
          if (success) {
            set((state) => ({
              wishlistItems: state.wishlistItems.filter(
                (item) => item.product_id !== productId
              ),
            }));
          }
        } catch (error) {
          console.error('Failed to remove from wishlist:', error);
        }
      },

      isInWishlist: async (
        userId: string | null,
        productId: number
      ): Promise<boolean> => {
        if (!userId) {
          return get().isInLocalWishlist(productId);
        }
        return await wishlistService.isInWishlist(userId, productId);
      },

      // ОНОВЛЕНО: метод тепер приймає функцію t
      moveToCart: async (userId: string, productId: number, t: any) => {
        try {
          const itemInWishlist = get().wishlistItems.find(
            (i) => i.product_id === productId
          );

          if (!itemInWishlist) {
            console.error('Item not found in wishlist state');
            return;
          }

          const stock = itemInWishlist.products.stock || 0;
          const cartItem = useCartStore
            .getState()
            .cartItems.find((i) => i.id === productId);
          const currentQty = cartItem ? cartItem.quantity : 0;

          if (currentQty + 1 > stock) {
            // ТУТ ВИКОРИСТОВУЄМО ПЕРЕДАНИЙ t
            const msg = t('limitReached', { max: stock });
            toast.error(msg);

            // ВАЖЛИВО: Кидаємо помилку, щоб toast.promise у компоненті не показав "Успішно"
            throw new Error(msg);
          }

          const success = await wishlistService.moveToCart(userId, productId);

          if (success) {
            set((state) => ({
              wishlistItems: state.wishlistItems.filter(
                (item) => item.product_id !== productId
              ),
            }));

            await useCartStore.getState().loadCartFromDatabase(userId);
          }
        } catch (error) {
          console.error('❌ Failed to move to cart:', error);
          throw error; // Прокидаємо помилку далі для toast.promise
        }
      },

      clearWishlist: () => {
        set({ wishlistItems: [], localWishlist: [] });
      },

      addToLocalWishlist: (productId: number) => {
        set((state) => ({
          localWishlist: [...state.localWishlist, productId],
        }));
      },

      removeFromLocalWishlist: (productId: number) => {
        set((state) => ({
          localWishlist: state.localWishlist.filter((id) => id !== productId),
        }));
      },

      isInLocalWishlist: (productId: number) => {
        return get().localWishlist.includes(productId);
      },

      syncLocalWishlist: async (userId: string) => {
        const { localWishlist } = get();
        if (localWishlist.length === 0) return;

        try {
          for (const productId of localWishlist) {
            await wishlistService.addToWishlist(userId, productId);
          }
          set({ localWishlist: [] });
          await get().loadWishlist(userId);
          console.log('✅ Local wishlist synced with database');
        } catch (error) {
          console.error('❌ Failed to sync local wishlist:', error);
        }
      },
    }),
    {
      name: 'wishlist-storage',
      partialize: (state) => ({
        wishlistItems: state.wishlistItems,
        localWishlist: state.localWishlist,
      }),
    }
  )
);
