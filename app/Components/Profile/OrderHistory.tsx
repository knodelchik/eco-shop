'use client';

import { useState, useEffect } from 'react';
import { orderService } from '@/app/[locale]/services/orderService';
import {
  Package,
  ChevronDown,
  Calendar,
  MapPin,
  CreditCard,
  Truck,
  ExternalLink,
  Copy,
} from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

export default function OrderHistory({ userId }: { userId: string }) {
  const t = useTranslations('Profile.OrderHistory');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const { formatPrice } = useCurrency();

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      const data = await orderService.getOrders(userId);
      setOrders(data);
      setLoading(false);
    };
    loadOrders();
  }, [userId]);

  const toggleOrder = (id: string) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  const copyTrackingToClipboard = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    toast.success(t('copied'));
  };

  const getTrackingLink = (trackingNumber: string, manualService?: string) => {
    const number = trackingNumber.replace(/\s/g, '');
    const service = manualService?.toLowerCase().trim() || '';

    const baseUrl = `https://t.17track.net/en#nums=${number}`;

    if (service.includes('nova') || service === 'нп')
      return `${baseUrl}&fc=100072`;
    if (service.includes('ukr')) return `${baseUrl}&fc=100098`;
    if (service.includes('dhl')) return `${baseUrl}&fc=100001`;
    if (service.includes('ups')) return `${baseUrl}&fc=100002`;
    if (service.includes('fedex')) return `${baseUrl}&fc=100004`;
    if (service.includes('usps')) return `${baseUrl}&fc=100003`;

    const isNovaPoshtaNumber = /^[125]\d{13}$/.test(number);
    if (isNovaPoshtaNumber) return `${baseUrl}&fc=100072`;

    return baseUrl;
  };

  // ЄДИНА ЛОГІКА КОЛЬОРІВ (Як і в Адмінці)
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
      case 'paid': // Додаємо підтримку нового статусу
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'shipped':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'pending':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'completed':
        // Виконано (Архівовано) - нейтральний сірий
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
      case 'failure':
      case 'cancelled':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-neutral-400';
    }
  };

  const getStatusText = (status: string) => {
    return t(`status.${status}`) || status;
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">{t('loading')}</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="bg-card rounded-2xl shadow-lg border border-border p-12 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
          <Package size={32} />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">
          {t('emptyTitle')}
        </h3>
        <p className="text-muted-foreground">{t('emptyDesc')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground px-2">
        {t('title')}
      </h2>

      <div className="space-y-4">
        {orders.map((order) => {
          const trackingLink = order.tracking_number
            ? getTrackingLink(order.tracking_number, order.shipping_service)
            : null;

          const serviceDisplay =
            order.shipping_service ||
            order.shipping_type ||
            t('defaultService');

          return (
            <div
              key={order.id}
              className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* HEADER */}
              <div
                onClick={() => toggleOrder(order.id)}
                className="p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50 dark:bg-neutral-900"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-xl ${getStatusColor(order.status)}`}
                  >
                    {order.status === 'shipped' ? (
                      <Truck size={24} />
                    ) : (
                      <Package size={24} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-foreground">
                        {t('orderNumber')}{' '}
                        {order.id.split('_')[1] || order.id.substring(0, 8)}
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span className="font-medium text-gray-900 dark:text-neutral-200">
                        {formatPrice(order.total_amount)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-4">
                  <ChevronDown
                    className={`text-gray-400 transition-transform duration-300 ${
                      expandedOrderId === order.id ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </div>

              {/* ДЕТАЛІ */}
              <AnimatePresence>
                {expandedOrderId === order.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border"
                  >
                    <div className="p-5 space-y-6">
                      {/* === БЛОК ТРЕКІНГУ === */}
                      {order.tracking_number && trackingLink && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white dark:bg-blue-950 rounded-lg text-blue-600 dark:text-blue-400 shadow-sm">
                              <Truck size={20} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-blue-600 dark:text-blue-300 uppercase tracking-wide mb-0.5">
                                {t('trackingInfo')}
                              </p>
                              <div className="flex items-center gap-2">
                                <p className="text-base font-mono text-foreground select-all break-all">
                                  <span className="font-bold mr-2 text-blue-800 dark:text-blue-200">
                                    {serviceDisplay}:
                                  </span>
                                  {order.tracking_number}
                                </p>

                                <button
                                  onClick={(e) =>
                                    copyTrackingToClipboard(
                                      e,
                                      order.tracking_number
                                    )
                                  }
                                  className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
                                  title={t('copy')}
                                >
                                  <Copy size={14} />
                                </button>
                              </div>
                            </div>
                          </div>

                          <a
                            href={trackingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-all shadow-sm hover:shadow-md active:scale-95 whitespace-nowrap"
                          >
                            {t('trackButton')} <ExternalLink size={16} />
                          </a>
                        </div>
                      )}
                      
                      <div className="space-y-3 pt-2">
                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                          {t('itemsHeader')} ({order.order_items.length})
                        </h4>
                        {order.order_items.map((item: any) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-4 py-2 border-b border-gray-50 dark:border-neutral-800/50 last:border-0"
                          >
                            <div className="relative w-16 h-16 rounded-lg bg-muted overflow-hidden shrink-0 border border-border">
                              {item.image_url && (
                                <Image
                                  src={item.image_url}
                                  alt={item.product_title}
                                  fill
                                  className="object-contain p-1"
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {item.product_title}
                              </p>
                              <p className="text-xs text-gray-500">
                                {item.quantity} {t('quantityUnit')} x{' '}
                                {formatPrice(item.price)}
                              </p>
                            </div>
                            <div className="font-medium text-foreground">
                              {formatPrice(item.quantity * item.price)}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-border">
                        <div className="flex gap-3">
                          <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {t('deliveryAddress')}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {order.shipping_address?.country_name},{' '}
                              {order.shipping_address?.city}
                            </p>
                            <p className="text-xs text-gray-400">
                              {order.shipping_address?.address_line1}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <CreditCard className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {t('payment')}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1 capitalize">
                              {order.shipping_type} •{' '}
                              {order.shipping_cost > 0
                                ? formatPrice(order.shipping_cost)
                                : t('freeShipping')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}