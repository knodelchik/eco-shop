// components/header/SettingsDropdown.tsx
'use client';

import { Settings, Moon, Sun, Monitor } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from 'next-themes';
import { useCurrency } from '../../context/CurrencyContext';
// 1. Прибираємо старий імпорт translations
import { useTranslations } from 'next-intl'; // Додаємо новий хук

export default function SettingsDropdown() {
  const { setTheme, theme } = useTheme();
  const { currency, setCurrency } = useCurrency();

  // 2. Отримуємо функцію t для секції 'Settings'
  const t = useTranslations('Settings');

  // 3. Замінюємо tSettings.currencyUAH на t('currencyUAH') і так далі
  const currencies = [
    { code: 'UAH' as const, label: t('currencyUAH') },
    { code: 'USD' as const, label: t('currencyUSD') },
    { code: 'EUR' as const, label: t('currencyEUR') },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={t('ariaLabelSettings')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white dark:hover:text-black transition-colors cursor-pointer"
        >
          <Settings className="w-6 h-6" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {/* === Валюта === */}
        <DropdownMenuLabel>{t('currencyTitle')}</DropdownMenuLabel>
        {currencies.map(({ code, label }) => (
          <DropdownMenuItem
            key={code}
            onClick={() => setCurrency(code)}
            className="cursor-pointer"
          >
            <span className="flex-1">{label}</span>
            {currency === code && <span className="ml-2">✓</span>}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {/* === Тема === */}
        <DropdownMenuLabel>{t('themeTitle')}</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className="cursor-pointer"
        >
          <Sun className="mr-2 w-4 h-4" />
          <span className="flex-1">{t('themeLight')}</span>
          {theme === 'light' && <span className="ml-2">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className="cursor-pointer"
        >
          <Moon className="mr-2 w-4 h-4" />
          <span className="flex-1">{t('themeDark')}</span>
          {theme === 'dark' && <span className="ml-2">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className="cursor-pointer"
        >
          <Monitor className="mr-2 w-4 h-4" />
          <span className="flex-1">{t('themeSystem')}</span>
          {theme === 'system' && <span className="ml-2">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
