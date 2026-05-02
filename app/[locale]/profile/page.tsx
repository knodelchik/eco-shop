'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/navigation';
import { authService } from '../services/authService';
import { User } from '../../types/users';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User as UserIcon,
  MapPin,
  Heart,
  Lock,
  LogOut,
  History,
} from 'lucide-react';

import AddressManager from '../../Components/Profile/AddressManager';
import EditProfileForm from '@/app/Components/Profile/EditProfileForm';
import WishlistPage from '@/app/Components/Profile/WishlistPage';
import ChangePasswordForm from '@/app/Components/Profile/ChangePasswordForm';
import OrderHistory from '@/app/Components/Profile/OrderHistory';

type ProfileTab = 'profile' | 'orders' | 'addresses' | 'wishlist' | 'security';

function ProfilePageContent() {
  const t = useTranslations('Profile');
  const t_wishlist = useTranslations('Wishlist');
  const t_user_dropdown = useTranslations('UserDropdown');

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get('tab') as ProfileTab) || 'profile';

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      const { user: authUser } = await authService.getCurrentUser();
      if (!authUser) {
        router.push('/auth');
        return;
      }
      const { profile } = await authService.getUserProfile(authUser.id);
      setUser({ ...authUser, ...profile } as User);
      setLoading(false);
    };
    checkAuth();

    const { data: { subscription } } = authService.supabase.auth.onAuthStateChange((event: string) => {
      if (event === 'SIGNED_OUT') router.push('/auth');
    });
    return () => subscription.unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    setLoading(true);
    await authService.signOut();
  };

  const handleTabChange = (tab: ProfileTab) => router.push(`/profile?tab=${tab}`);

  const tabs = [
    { id: 'profile', label: t('title'), Icon: UserIcon },
    { id: 'orders', label: t('tabOrders'), Icon: History },
    { id: 'addresses', label: t('tabAddresses'), Icon: MapPin },
    { id: 'wishlist', label: t_wishlist('title'), Icon: Heart },
    { id: 'security', label: t('tabSecurity'), Icon: Lock },
  ] as const;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-[260px_1fr] gap-10">
          <aside className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 skel" />
            ))}
          </aside>
          <main className="space-y-4">
            <div className="h-10 w-1/2 skel" />
            <div className="h-32 skel" />
          </main>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
      {/* Page header */}
      <div className="mb-10">
        <div className="section-label mb-3">{t('label')}</div>
        <h1 className="font-display text-4xl md:text-5xl tracking-tight">
          {t('greeting')}, <span className="text-primary">{user.full_name?.split(' ')[0] || user.email.split('@')[0]}</span>
        </h1>
        <p className="text-muted-foreground mt-2">{user.email}</p>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-10">
        {/* Sidebar */}
        <aside>
          <nav className="space-y-1 sticky top-24">
            {tabs.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => handleTabChange(id as ProfileTab)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                  activeTab === id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground/80 hover:text-foreground hover:bg-muted'
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={1.75} />
                <span>{label}</span>
              </button>
            ))}
            <div className="pt-3 mt-3 border-t border-border">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-4 h-4" strokeWidth={1.75} />
                <span>{t_user_dropdown('signOut')}</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Content */}
        <main>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'profile' && <EditProfileForm user={user} />}
              {activeTab === 'orders' && <OrderHistory userId={user.id} />}
              {activeTab === 'addresses' && <AddressManager userId={user.id} userPhone={user.phone} />}
              {activeTab === 'wishlist' && <WishlistPage userId={user.id} />}
              {activeTab === 'security' && <ChangePasswordForm user={user} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense>
      <ProfilePageContent />
    </Suspense>
  );
}
