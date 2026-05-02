'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, ArrowRight, ShoppingBag, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCartStore } from '../../store/cartStore';

export default function OrderResultPage() {
  const searchParams = useSearchParams();
  const t = useTranslations('OrderResult');
  const { clearCart } = useCartStore();

  const source = searchParams.get('source'); // 'paypal' або 'monobank'
  const orderId = searchParams.get('orderId'); // Наш внутрішній ID
  
  // Стан завантаження потрібен тільки якщо ми щось перевіряємо.
  // Але якщо ми прийшли від PayPalButtons, то все вже добре.
  const [paymentStatus, setPaymentStatus] = useState<'loading' | 'success' | 'failure'>('loading');

  useEffect(() => {
    // Функція ініціалізації
    const initResult = async () => {
      if (!orderId) {
        setPaymentStatus('failure');
        return;
      }

      // 1. PAYPAL
      if (source === 'paypal') {
        // Якщо ми прийшли сюди, значить компонент PayPalCheckout вже виконав Capture і отримав 'COMPLETED'.
        // Нам не потрібно робити це знову. Просто показуємо успіх.
        setPaymentStatus('success');
        clearCart();
      } 
      // 2. MONOBANK
      else if (source === 'monobank') {
        // Для Монобанку, оскільки це редірект, ми теж показуємо успіх авансом (для UX).
        // Реальний статус прийде на вебхук.
        setPaymentStatus('success');
        clearCart();
      } 
      // 3. НЕВІДОМЕ ДЖЕРЕЛО
      else {
        setPaymentStatus('failure');
      }
    };

    initResult();
  }, [source, orderId, clearCart]);

  // --- UI ---
  
  if (paymentStatus === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <h2 className="font-display text-2xl tracking-tight">
            {t('processingPayment')}
          </h2>
        </div>
      </div>
    );
  }

  const isSuccess = paymentStatus === 'success';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-card p-8 rounded-3xl shadow-2xl border border-border text-center"
      >
        <div className="flex justify-center mb-6">
          {isSuccess ? (
            <div className="w-16 h-16 rounded-full bg-primary/15 text-primary flex items-center justify-center">
              <CheckCircle className="w-8 h-8" strokeWidth={1.75} />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-destructive/15 text-destructive flex items-center justify-center">
              <XCircle className="w-8 h-8" strokeWidth={1.75} />
            </div>
          )}
        </div>

        <h1 className="font-display text-4xl tracking-tight mb-3">
          {isSuccess ? t('successTitle') : t('errorTitle')}
        </h1>

        {isSuccess && orderId && (
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3">
            Замовлення #{orderId}
          </p>
        )}

        <p className="text-muted-foreground mb-8 leading-relaxed">
          {isSuccess ? t('successMessage') : t('errorMessage')}
        </p>

        <div className="space-y-2">
          <Link
            href="/profile?tab=orders"
            className="flex items-center justify-center gap-2 w-full h-12 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            <ShoppingBag className="w-4 h-4" /> {t('goToOrders')}
          </Link>
          <Link
            href="/shop"
            className="flex items-center justify-center gap-2 w-full h-10 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('continueShopping')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}