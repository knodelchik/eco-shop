'use client';

import { User, LogOut, LayoutDashboard } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import { User as UserType } from '../../types/users';

interface UserDropdownProps {
  user: UserType | null;
  onSignOut: () => void;
}

export default function UserDropdown({ user, onSignOut }: UserDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100 cursor-pointer focus:outline-none">
          <User className="w-6 h-6" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800"
      >
        {user ? (
          <AuthenticatedMenu user={user} onSignOut={onSignOut} />
        ) : (
          <UnauthenticatedMenu />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AuthenticatedMenu({
  user,
  onSignOut,
}: {
  user: UserType;
  onSignOut: () => void;
}) {
  const t = useTranslations('UserDropdown');

  // Перевірка на адміна
  const isAdmin = user.role === 'admin';

  return (
    <>
      <DropdownMenuLabel className="text-gray-900 dark:text-white">
        {t('myAccount')}
      </DropdownMenuLabel>

      {/* Цей пункт з'явиться ТІЛЬКИ у адміна */}
      {isAdmin && (
        <DropdownMenuItem asChild>
          <Link
            href="/admin"
            className="cursor-pointer w-full flex items-center font-semibold text-blue-600 dark:text-blue-400"
          >
            <LayoutDashboard className="mr-2 w-4 h-4" />
            Адмін панель
          </Link>
        </DropdownMenuItem>
      )}

      <DropdownMenuItem asChild>
        <Link
          href="/profile"
          className="cursor-pointer w-full text-gray-700 dark:text-gray-200"
        >
          {t('profile')}
        </Link>
      </DropdownMenuItem>

      <DropdownMenuSeparator className="bg-gray-100 dark:bg-neutral-800" />

      <DropdownMenuItem
        onClick={onSignOut}
        className="text-red-600 focus:text-red-600 cursor-pointer w-full"
      >
        <LogOut className="mr-2 w-4 h-4" />
        {t('signOut')}
      </DropdownMenuItem>
    </>
  );
}

function UnauthenticatedMenu() {
  const t = useTranslations('UserDropdown');

  return (
    <>
      <DropdownMenuLabel className="text-gray-900 dark:text-white">
        {t('account')}
      </DropdownMenuLabel>

      {/* Кнопка ВХІД */}
      <DropdownMenuItem asChild>
        <Link
          href="/auth?view=signin"
          className="cursor-pointer w-full text-gray-700 dark:text-gray-200"
        >
          {t('signIn')}
        </Link>
      </DropdownMenuItem>

      {/* Кнопка РЕЄСТРАЦІЯ - додано ?view=signup */}
      <DropdownMenuItem asChild>
        <Link
          href="/auth?view=signup"
          className="cursor-pointer w-full text-gray-700 dark:text-gray-200"
        >
          {t('signUp')}
        </Link>
      </DropdownMenuItem>
    </>
  );
}
