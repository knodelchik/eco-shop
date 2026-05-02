'use client';

import { useCurrency } from '../context/CurrencyContext';

interface PriceProps {
  amount: number; // Ціна в USD з бази
  className?: string;
}

export default function Price({ amount, className = '' }: PriceProps) {
  const { formatPrice } = useCurrency();

  // Використовуємо suppressHydrationWarning, бо на сервері ціна може відрізнятися 
  // від клієнта (різна валюта за замовчуванням)
  return (
    <span className={className} suppressHydrationWarning>
      {formatPrice(amount)}
    </span>
  );
}