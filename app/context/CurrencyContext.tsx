'use client';

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react';
import { useParams } from 'next/navigation';

export type Currency = 'UAH' | 'USD' | 'EUR';

type CurrencyContextType = {
  currency: Currency;
  setCurrency: (val: Currency) => void;
  rates: Record<Currency, number>;
  formatPrice: (priceInUsd: number) => string;
  convertPrice: (priceInUsd: number) => number;
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined
);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const params = useParams();
  const locale = (params?.locale as string) || 'uk';

  const [currency, setCurrency] = useState<Currency>('UAH');

  const [rates, setRates] = useState<Record<Currency, number>>({
    USD: 1,
    UAH: 44.0, // Приклад курсу
    EUR: 0.92,
  });

  useEffect(() => {
    if (locale === 'uk') {
      setCurrency('UAH');
    } else {
      setCurrency('USD');
    }
  }, [locale]);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch('/api/currency');
        if (res.ok) {
          const data = await res.json();
          setRates(data);
        }
      } catch (e) {
        console.warn('Currency API not available, using default rates');
      }
    };

    fetchRates();
  }, []);

  const convertPrice = (priceInUsd: number) => {
    const rate = rates[currency];
    return priceInUsd * rate;
  };

  const formatPrice = (priceInUsd: number) => {
    const safe = Number(priceInUsd);
    if (!Number.isFinite(safe)) return '—';

    let value = convertPrice(safe);
    if (currency === 'UAH') {
      value = Math.round(value / 10) * 10;
    }

    return new Intl.NumberFormat(locale === 'uk' ? 'uk-UA' : 'en-US', {
      style: 'currency',
      currency: currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: currency === 'UAH' ? 0 : 0,
      maximumFractionDigits: currency === 'UAH' ? 0 : 2,
    }).format(value);
  };

  return (
    <CurrencyContext.Provider
      value={{ currency, setCurrency, rates, formatPrice, convertPrice }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used inside CurrencyProvider');
  return ctx;
};
