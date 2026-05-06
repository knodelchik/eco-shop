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
  // Для PayPal redirect-flow тут приходить token = PayPal-OrderId.
  // Якщо є — треба викликати capture-order, інакше платіж лишиться у статусі
  // "approved" і гроші не спишуться.
  const paypalToken = searchParams.get('token');

  const [paymentStatus, setPaymentStatus] = useState<'loading' | 'success' | 'failure'>('loading');

  useEffect(() => {
    const initResult = async () => {
      if (!orderId) {
        setPaymentStatus('failure');
        return;
      }

      // 1. PAYPAL
      if (source === 'paypal') {
        if (paypalToken) {
          // Redirect-flow: треба capture. Якщо capture запустив PayPalButtons
          // (компонентний JS-flow) — token у URL не буде, і ми просто
          // показуємо успіх (capture відбувся всередині компонента).
          try {
            const res = await fetch('/api/paypal/capture-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderID: paypalToken }),
            });
            if (!res.ok) {
              setPaymentStatus('failure');
              return;
            }
          } catch (e) {
            console.error('PayPal capture failed:', e);
            setPaymentStatus('failure');
            return;
          }
        }
        setPaymentStatus('success');
        clearCart();
      }
      // 2. MONOBANK
      else if (source === 'monobank') {
        // Для Mono — webhook оновить статус paid асинхронно. Показуємо success
        // авансом для UX. Якщо платіж не пройшов, webhook поставить cancelled.
        setPaymentStatus('success');
        clearCart();
      }
      // 3. НЕВІДОМЕ ДЖЕРЕЛО
      else {
        setPaymentStatus('failure');
      }
    };

    initResult();
  }, [source, orderId, paypalToken, clearCart]);

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