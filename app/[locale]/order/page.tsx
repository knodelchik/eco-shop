'use client';

import { useCartStore } from '../store/cartStore';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl'; 
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/navigation';
import { authService } from '../services/authService';
import { addressService } from '../services/adressService';
import { Address } from '../../types/address';
import { toast } from 'sonner';
import {
  Truck,
  ChevronDown,
  Plus,
  MapPin,
  Clock,
  Plane,
  CreditCard,
} from 'lucide-react';
import { useCurrency } from '@/app/context/CurrencyContext';
import PayPalCheckout from '../../Components/PayPalCheckout';

const createSlug = (str: string) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-');

export default function OrderPage() {
  const t = useTranslations('Order');
  const locale = useLocale(); 
  
  const { cartItems } = useCartStore();
  const { formatPrice, rates } = useCurrency();

  const [paymentMethod, setPaymentMethod] = useState<'monobank' | 'paypal'>(
    'monobank'
  );
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null
  );
  const [isAddressMenuOpen, setIsAddressMenuOpen] = useState(false);

  const [deliverySettings, setDeliverySettings] = useState<any[]>([]);
  const [shippingType, setShippingType] = useState<'Standard' | 'Express'>(
    'Standard'
  );
  const [shippingCost, setShippingCost] = useState(0);

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      const { user } = await authService.getCurrentUser();
      if (user) {
        setUser(user);
        const userAddresses = await addressService.getAddresses(user.id);
        setAddresses(userAddresses);
        if (userAddresses.length > 0) {
          const defaultAddr =
            userAddresses.find((a) => a.is_default) || userAddresses[0];
          setSelectedAddressId(defaultAddr.id);
        }
      }
      try {
        const res = await fetch('/api/delivery');
        if (res.ok) {
          const list = await res.json();
          setDeliverySettings(Array.isArray(list) ? list : []);
        } else {
          setDeliverySettings([]);
        }
      } catch {
        setDeliverySettings([]);
      }
      setLoading(false);
    };
    initData();
  }, []);

  const calculateShippingPrice = (
    countryCode: string,
    type: 'Standard' | 'Express'
  ): number => {
    const code = (countryCode ?? '').toUpperCase();
    const row = deliverySettings.find(
      (r) => String(r.country_code ?? '').toUpperCase() === code
    );
    if (row) {
      const value = type === 'Express' ? Number(row.express_price) : Number(row.standard_price);
      if (Number.isFinite(value)) return value;
    }
    return type === 'Express' ? 10 : 5;
  };

  useEffect(() => {
    if (!selectedAddressId) {
      setShippingCost(0);
      return;
    }
    const address = addresses.find((a) => a.id === selectedAddressId);
    if (!address) return;

    const cost = calculateShippingPrice(address.country_code, shippingType);
    if (cost === null) {
      toast.error(t('errorDeliveryUnavailable'));
      if (shippingType === 'Express') {
        setShippingType('Standard');
      } else {
        setShippingCost(0);
      }
    } else {
      setShippingCost(cost);
    }
  }, [selectedAddressId, addresses, shippingType, deliverySettings]);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const total = subtotal + shippingCost;
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  const getCostForUI = (type: 'Standard' | 'Express') => {
    if (!selectedAddress) return 0;
    return calculateShippingPrice(selectedAddress.country_code, type);
  };

  const standardCost = getCostForUI('Standard');
  const expressCost = getCostForUI('Express');

  const validateOrder = () => {
    if (!user) {
      toast.error(t('errorAuth'));
      return false;
    }
    if (!user.email_confirmed_at) {
      toast.error(t('errorEmail'));
      return false;
    }
    if (!selectedAddressId || !selectedAddress) {
      toast.error(t('errorSelectAddress'));
      return false;
    }
    return true;
  };

  const handleMonobankPayment = async () => {
    if (!validateOrder()) return;

    setProcessing(true);
    try {
      const totalUAH = total * rates['UAH'];

      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems,
          method: 'monobank',
          shippingAddress: selectedAddress,
          shippingCost: shippingCost,
          amountUSD: total,
          amountUAH: totalUAH,
          shippingType,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('paymentError'));

      if (data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        toast.error(t('errorPaymentLink'));
      }
    } catch (error: any) {
      console.error('Monobank Payment Error:', error);
      toast.error(error.message || t('errorServer'));
    } finally {
      setProcessing(false);
    }
  };

  if (cartItems.length === 0) return <EmptyCartState t={t} />;

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        {t('processing')}
      </div>
    );

  return (
    <div className="min-h-screen bg-background w-full py-4 lg:py-12 transition-colors">
      <div className="px-3 md:px-6 lg:p-6 max-w-6xl mx-auto space-y-4 lg:space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2 lg:mb-8"
        >
          <h1 className="text-2xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-neutral-200 dark:to-white bg-clip-text text-transparent">
            {t('title')}
          </h1>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* ЛІВА ЧАСТИНА: Товари */}
          <div className="lg:col-span-2 space-y-4 lg:space-y-6">
            <h2 className="text-lg lg:text-xl font-bold text-foreground mb-2 lg:mb-4">
              {t('yourOrder')}
            </h2>
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {cartItems.map((item, index) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    index={index}
                    formatPrice={formatPrice}
                    t={t}
                    locale={locale} 
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* ПРАВА ЧАСТИНА: Сайдбар */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-3xl shadow-xl p-4 lg:p-6 border border-border lg:sticky lg:top-6">
              {/* Блок адреси */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('deliveryAddress')}
                </label>
                {addresses.length === 0 ? (
                  <Link
                    href="/profile?tab=addresses"
                    className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl text-yellow-700 dark:text-yellow-500 hover:bg-yellow-100 transition-colors text-sm font-medium cursor-pointer"
                  >
                    <Plus size={16} /> {t('addAddress')}
                  </Link>
                ) : (
                  <div className="relative">
                    <button
                      onClick={() => setIsAddressMenuOpen(!isAddressMenuOpen)}
                      className="w-full flex items-center justify-between p-3 bg-muted border border-border rounded-xl hover:border-gray-400 transition-colors text-left cursor-pointer"
                    >
                      {selectedAddress ? (
                        <div className="flex items-center gap-2 overflow-hidden w-full">
                          <MapPin
                            size={18}
                            className="text-gray-500 shrink-0 "
                          />
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-foreground block text-sm lg:text-base truncate">
                              {selectedAddress.city},{' '}
                              {selectedAddress.country_name}
                            </span>
                            <span className="text-xs text-gray-500 block truncate">
                              {selectedAddress.address_line1}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-500">
                          {t('selectAddress')}
                        </span>
                      )}
                      <ChevronDown
                        size={16}
                        className={`text-gray-400 shrink-0 ml-2 transition-transform ${
                          isAddressMenuOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    <AnimatePresence>
                      {isAddressMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-800 border border-border rounded-xl shadow-xl z-20 overflow-hidden"
                        >
                          <div className="max-h-60 overflow-y-auto py-1">
                            {addresses.map((addr) => (
                              <button
                                key={addr.id}
                                onClick={() => {
                                  setSelectedAddressId(addr.id);
                                  setIsAddressMenuOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors flex flex-col ${
                                  selectedAddressId === addr.id
                                    ? 'bg-blue-50 dark:bg-blue-900/20'
                                    : ''
                                }`}
                              >
                                <span className="font-medium text-foreground text-sm">
                                  {addr.country_code} - {addr.city}
                                </span>
                                <span className="text-xs text-gray-500 truncate w-full">
                                  {addr.address_line1}
                                </span>
                              </button>
                            ))}
                            <div className="border-t border-gray-100 dark:border-neutral-700 mt-1 pt-1">
                              <Link
                                href="/profile?tab=addresses"
                                className="flex items-center gap-2 px-4 py-3 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-neutral-700"
                              >
                                <Plus size={14} /> {t('addNewAddress')}
                              </Link>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Блок доставки */}
              {selectedAddressId && (
                <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('shippingMethod')}
                  </label>
                  <div className="space-y-2">
                    {/* Standard */}
                    <button
                      onClick={() => setShippingType('Standard')}
                      disabled={standardCost === null}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer ${
                        shippingType === 'Standard'
                          ? 'border-black bg-gray-50 dark:border-white dark:bg-neutral-800'
                          : 'border-border hover:border-gray-300 dark:hover:border-neutral-600'
                      } ${
                        standardCost === null
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div
                          className={`p-2 rounded-full flex-shrink-0 ${
                            shippingType === 'Standard'
                              ? 'bg-white dark:bg-neutral-700 shadow-sm'
                              : 'bg-muted'
                          }`}
                        >
                          <Clock
                            size={18}
                            className="text-foreground"
                          />
                        </div>
                        <div className="text-left overflow-hidden">
                          <span className="block font-semibold text-sm text-foreground truncate">
                            {t('standard')}
                          </span>
                          <span className="text-xs text-gray-500 truncate block">
                            {t('standardDesc')}
                          </span>
                        </div>
                      </div>
                      <span className="font-medium text-foreground text-sm whitespace-nowrap ml-2">
                        {standardCost === 0
                          ? t('freeShipping')
                          : standardCost === null
                          ? t('na')
                          : formatPrice(standardCost)}
                      </span>
                    </button>

                    {/* Express */}
                    <button
                      onClick={() => setShippingType('Express')}
                      disabled={expressCost === null}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer  ${
                        shippingType === 'Express'
                          ? 'border-black bg-gray-50 dark:border-white dark:bg-neutral-800'
                          : 'border-border hover:border-gray-300 dark:hover:border-neutral-600 '
                      } ${
                        expressCost === null
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div
                          className={`p-2 rounded-full flex-shrink-0 ${
                            shippingType === 'Express'
                              ? 'bg-white dark:bg-neutral-700 shadow-sm'
                              : 'bg-muted'
                          }`}
                        >
                          <Plane
                            size={18}
                            className="text-foreground"
                          />
                        </div>
                        <div className="text-left overflow-hidden">
                          <span className="block font-semibold text-sm text-foreground truncate">
                            {t('express')}
                          </span>
                          <span className="text-xs text-gray-500 truncate block">
                            {t('expressDesc')}
                          </span>
                        </div>
                      </div>
                      <span className="font-medium text-foreground text-sm whitespace-nowrap ml-2">
                        {expressCost === 0
                          ? t('freeShipping')
                          : expressCost === null
                          ? t('na')
                          : formatPrice(expressCost)}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Підсумок */}
              <h2 className="text-lg lg:text-xl font-bold text-foreground mb-4 border-t border-border pt-4">
                {t('orderSummary')}
              </h2>
              <div className="space-y-2 mb-4 pb-4 border-b border-border text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>{t('subtotal')}</span>
                  <span className="text-foreground font-medium">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-1">
                    {t('shipping')} <Truck size={14} />
                  </span>
                  <span
                    className={`font-medium ${
                      shippingCost === 0
                        ? 'text-green-600'
                        : 'text-foreground'
                    }`}
                  >
                    {shippingCost === 0
                      ? t('freeShipping')
                      : formatPrice(shippingCost)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center font-bold text-xl lg:text-2xl mb-6">
                <span className="text-foreground">
                  {t('totalLabel')}
                </span>
                <span>{formatPrice(total)}</span>
              </div>

              {/* Вибір методу оплати */}
              <div className="mb-6">
                <span className="block font-semibold text-xs lg:text-sm text-muted-foreground mb-2 uppercase tracking-wide">
                  {t('paymentMethodLabel')}
                </span>

                {/* Сітка кнопок */}
                <div className="grid grid-cols-2 gap-3 relative z-10">
                  {/* Кнопка PLATA BY MONO */}
                  <button
                    className={`relative h-[56px] px-2 lg:px-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-center overflow-hidden ${
                      paymentMethod === 'monobank'
                        ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300 dark:bg-neutral-900 dark:border-neutral-700'
                    }`}
                    onClick={() => setPaymentMethod('monobank')}
                    aria-label="Оплата через plata by mono"
                  >
                    <div className="relative w-full h-full max-w-[130px]">
                      <Image
                        src="/images/plata.svg"
                        alt="plata by mono"
                        fill
                        className={`object-contain transition-all ${
                          paymentMethod === 'monobank'
                            ? 'invert dark:invert-0'
                            : 'dark:invert'
                        }`}
                      />
                    </div>
                  </button>

                  {/* Кнопка PayPal */}
                  <button
                    className={`relative h-[56px] px-2 lg:px-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-center overflow-hidden ${
                      paymentMethod === 'paypal'
                        ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300 dark:bg-neutral-900 dark:border-neutral-700'
                    }`}
                    onClick={() => setPaymentMethod('paypal')}
                    aria-label="PayPal"
                  >
                    <div className="relative w-full h-full max-w-[70px]">
                      <Image
                        src="/images/paypal_logo.png"
                        alt="PayPal"
                        fill
                        className={`object-contain transition-all ${
                          paymentMethod === 'paypal'
                            ? 'brightness-0 invert dark:brightness-0 dark:invert-0'
                            : 'dark:brightness-0 dark:invert'
                        }`}
                      />
                    </div>
                  </button>
                </div>

                {/* --- ДОДАТКОВА ІНФОРМАЦІЯ ДЛЯ PLATA BY MONO --- */}
                <AnimatePresence>
                  {paymentMethod === 'monobank' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -10, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 p-3 bg-muted/50 rounded-xl border border-border flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs lg:text-sm text-gray-600 dark:text-gray-300 relative z-0">
                        {/* Логотипи карток */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Visa */}
                          <div className="relative w-10 h-6">
                            <Image
                              src="/images/visa_white.png"
                              alt="Visa"
                              fill
                              className="object-contain invert dark:invert-0"
                            />
                          </div>
                          {/* Mastercard */}
                          <div className="relative w-10 h-6">
                            <Image
                              src="/images/mastercard.png"
                              alt="Mastercard"
                              fill
                              className="object-contain"
                            />
                          </div>
                        </div>

                        {/* Текст з перекладом і форматуванням */}
                        <p className="leading-tight">
                          {t.rich('paymentPromo', {
                            bold: (chunks) => (
                              <span className="font-medium text-foreground">
                                {chunks}
                              </span>
                            ),
                            line: (chunks) => (
                              <>
                                <br className="sm:hidden" />
                                {chunks}
                              </>
                            ),
                          })}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* КНОПКИ ОПЛАТИ (Умовний рендеринг) */}
              {paymentMethod === 'paypal' ? (
                selectedAddressId ? (
                  <PayPalCheckout
                    amountUSD={total}
                    cartItems={cartItems}
                    shippingAddress={selectedAddress}
                    shippingCost={shippingCost}
                    shippingType={shippingType}
                  />
                ) : (
                  <div className="text-center text-sm text-red-500 py-2">
                    {t('errorSelectAddress')}
                  </div>
                )
              ) : (
                <button
                  onClick={handleMonobankPayment}
                  disabled={processing || !selectedAddressId}
                  className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2 text-base cursor-pointer"
                >
                  {processing ? (
                    t('processing')
                  ) : (
                    <>
                      <CreditCard size={20} />
                      {t('payButton')} {formatPrice(total)}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartItem({ item, index, formatPrice, t, locale }: any) {
  const slug = createSlug(item.title);
  return (
    <Link href={`/shop/${slug}?from=order`} className="block">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        className="flex items-start lg:items-center gap-3 lg:gap-4 p-3 lg:p-4 bg-card border border-border rounded-2xl hover:shadow-md transition-all"
      >
        <div className="relative w-16 h-16 lg:w-24 lg:h-24 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
          <Image
            src={item.images[0]}
            alt={item.title}
            fill
            className="object-contain"
          />
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
          <p className="font-semibold text-sm lg:text-lg text-foreground line-clamp-2 leading-tight">
            {/* ✅ 4. Логіка вибору мови */}
            {locale === 'uk' ? (item.title_uk || item.title) : item.title}
          </p>
          <p className="text-muted-foreground mt-1 text-xs lg:text-base">
            {t('quantityLabel')}: {item.quantity}
          </p>
        </div>
        <div className="text-right font-bold text-sm lg:text-lg text-foreground whitespace-nowrap">
          {formatPrice(item.price * item.quantity)}
        </div>
      </motion.div>
    </Link>
  );
}

function EmptyCartState({ t }: any) {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 bg-background">
      <div className="text-center px-4">
        <p className="text-lg lg:text-xl text-muted-foreground">
          {t('emptyCart')}
        </p>
      </div>
    </div>
  );
}