'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../services/authService';
import AdminSidebar from './AdminSidebar';
import { Loader2 } from 'lucide-react';

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim())
  .filter(Boolean);

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { user } = await authService.getCurrentUser();
        if (!user) {
          router.push('/auth');
          return;
        }

        const isAdminByRole = user.role === 'admin';
        const isAdminByEmail =
          ADMIN_EMAILS.length > 0 && ADMIN_EMAILS.includes(user.email ?? '');

        if (!isAdminByRole && !isAdminByEmail) {
          router.push('/');
          alert('Доступ заборонено: потрібні права адміна');
          return;
        }

        setAuthorized(true);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-neutral-950">
        <Loader2 className="animate-spin w-10 h-10 text-gray-500" />
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-neutral-950 flex flex-col lg:flex-row">
      {/* Сайдбар (твоє нове меню) */}
      <AdminSidebar />

      {/* Основний контент з правильними відступами */}
      {/* pt-[80px] для мобільного, щоб не перекривався хедером */}
      <main className="flex-1 p-4 pt-[80px] lg:pt-8 lg:pl-80 w-full transition-all">
        <div className="max-w-7xl mx-auto space-y-6">{children}</div>
      </main>
    </div>
  );
}
