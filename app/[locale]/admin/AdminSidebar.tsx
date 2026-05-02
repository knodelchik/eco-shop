'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Mail,
  Menu,
  LogOut,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

const menuItems = [
  { href: '/admin', label: 'Дашборд', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Замовлення', icon: ShoppingCart },
  { href: '/admin/products', label: 'Товари', icon: Package },
  { href: '/admin/delivery', label: 'Доставка', icon: Truck },
  { href: '/admin/newsletter', label: 'Розсилка', icon: Mail },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const NavContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-900">
      <div className="p-6 border-b dark:border-neutral-800">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Адмін панель
        </h2>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                isActive
                  ? 'bg-black text-white dark:bg-white dark:text-black shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t dark:border-neutral-800">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
        >
          <LogOut size={20} />
          На сайт
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* === MOBILE HEADER === */}
      {/* ЗМІНА ТУТ: top-[68px] замість top-0. Це опустить його під основний хедер. */}
      {/* z-40, щоб він був під меню кошика основного хедера, якщо воно відкриється */}
      <div className="lg:hidden fixed top-[68px] left-0 right-0 z-40 h-14 bg-gray-50 dark:bg-neutral-900 border-b dark:border-neutral-800 flex items-center justify-between px-4 shadow-sm">
        <span className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
          <LayoutDashboard size={18} /> Меню Адміна
        </span>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[280px] z-[60]">
            {/* z-[60] щоб меню виїжджало поверх всього */}
            <SheetTitle className="sr-only">Меню навігації</SheetTitle>
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* === DESKTOP SIDEBAR === */}
      {/* pt-[80px], щоб сайдбар не ховався під основним хедером на десктопі */}
      <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-neutral-900 border-r dark:border-neutral-800 fixed inset-y-0 left-0 z-40 pt-[80px]">
        <NavContent />
      </aside>
    </>
  );
}
