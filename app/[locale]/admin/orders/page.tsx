'use client';

import { useEffect, useState, useMemo } from 'react';
import { format } from 'date-fns';
import { authService } from '../../services/authService';
import { authHeaders } from '../../../lib/web-auth-token';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import Image from 'next/image';
import {
  Package,
  User,
  CreditCard,
  Calendar,
  Truck,
  Save,
  Loader2,
  Filter,
  Search,
  Receipt,
  MapPin,
} from 'lucide-react';
import { toast } from 'sonner';

// --- ДОПОМІЖНІ ФУНКЦІЇ ---

const getStatusColor = (status: string) => {
  switch (status) {
    case 'success':
    case 'paid':
      return 'text-emerald-700 border-emerald-200 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
    case 'shipped':
      return 'text-blue-700 border-blue-200 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
    case 'pending':
      return 'text-amber-700 border-amber-200 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
    case 'completed':
      return 'text-slate-700 border-slate-200 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    case 'cancelled':
    case 'failure':
      return 'text-red-700 border-red-200 bg-red-50 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
    default:
      return 'text-gray-700 border-gray-200 bg-gray-50 dark:text-gray-400 dark:border-gray-700';
  }
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Фільтри та пошук
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Стейт для Sheet (бокова панель)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Стейт для редагування трекінгу
  const [trackingInput, setTrackingInput] = useState('');
  const [serviceInput, setServiceInput] = useState('');
  const [isSavingTracking, setIsSavingTracking] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      // Передаємо поточного адміна у query — server-side requireAdmin
      // валідує по user_profiles.role або NEXT_PUBLIC_ADMIN_EMAILS.
      // Без цього API повертає 401, бо cookie на наш origin не пишеться.
      const { user } = await authService.getCurrentUser();
      const params = new URLSearchParams();
      if (user?.id) params.set('actorUserId', user.id);
      if (user?.email) params.set('actorEmail', user.email);
      const qs = params.toString() ? `?${params}` : '';
      const res = await fetch(`/api/admin/orders${qs}`, {
        headers: authHeaders(),
      });
      if (res.ok) setOrders(await res.json());
      else toast.error('Помилка завантаження замовлень');
    } catch (e) {
      console.error('Error loading orders:', e);
      toast.error('Помилка завантаження замовлень');
    }
    setLoading(false);
  };

  // Логіка фільтрації
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      let matchesStatus = true;

      if (statusFilter !== 'all') {
        if (statusFilter === 'paid') {
          matchesStatus = order.status === 'paid' || order.status === 'success';
        } else {
          matchesStatus = order.status === statusFilter;
        }
      }

      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        order.id.toLowerCase().includes(searchLower) ||
        order.users?.email?.toLowerCase().includes(searchLower) ||
        order.users?.full_name?.toLowerCase().includes(searchLower) ||
        order.shipping_address?.full_name?.toLowerCase().includes(searchLower);

      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, searchQuery]);

  // Оновлення статусу
  const updateStatus = async (orderId: string, newStatus: string) => {
    const { user } = await authService.getCurrentUser();
    const res = await fetch('/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({
        id: orderId,
        status: newStatus,
        actorUserId: user?.id,
        actorEmail: user?.email,
      }),
    });
    if (res.ok) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }));
      }
      toast.success('Статус оновлено');
    } else {
      toast.error('Помилка оновлення статусу');
    }
  };

  // Збереження трекінгу — у Neon-схемі цих полів немає за замовчуванням,
  // тож просто зберігаємо їх у notes (для курсової демо).
  const saveTrackingInfo = async () => {
    if (!selectedOrder) return;
    setIsSavingTracking(true);

    const { user } = await authService.getCurrentUser();
    const res = await fetch('/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({
        id: selectedOrder.id,
        notes: `Tracking: ${trackingInput}; Service: ${serviceInput}`,
        actorUserId: user?.id,
        actorEmail: user?.email,
      }),
    });

    if (res.ok) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === selectedOrder.id
            ? {
                ...o,
                tracking_number: trackingInput,
                shipping_service: serviceInput,
              }
            : o
        )
      );

      setSelectedOrder((prev: any) => ({
        ...prev,
        tracking_number: trackingInput,
        shipping_service: serviceInput,
      }));

      toast.success('Дані доставки збережено');

      // Автоматично ставимо Shipped, якщо статус був pending/paid
      if (['pending', 'success', 'paid'].includes(selectedOrder.status)) {
        await updateStatus(selectedOrder.id, 'shipped');
      }
    } else {
      toast.error('Помилка збереження');
    }
    setIsSavingTracking(false);
  };

  const handleOpenDetails = (order: any) => {
    setSelectedOrder(order);
    setTrackingInput(order.tracking_number || '');
    setServiceInput(order.shipping_service || '');
    setIsDetailsOpen(true);
  };

  // Компонент відображення оплати
  const PaymentDetails = ({ order }: { order: any }) => {
    if (!order.payment_result) return null;

    // PayPal
    if (order.payment_method === 'paypal') {
      const pr = order.payment_result;
      const capture = pr.purchase_units?.[0]?.payments?.captures?.[0];
      const breakdown = capture?.seller_receivable_breakdown;

      return (
        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/30 text-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-100 dark:border-emerald-800/30">
            <span className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
              <span className="text-xs bg-white dark:bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                PAYPAL
              </span>
              {pr.id}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-500 font-mono">
              {capture?.create_time
                ? format(new Date(capture.create_time), 'dd.MM HH:mm')
                : ''}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-y-2 text-xs">
            <div className="text-gray-500">Payer:</div>
            <div className="font-medium text-right text-gray-900 dark:text-white">
              {pr.payer?.name?.given_name} {pr.payer?.name?.surname}
            </div>
            <div className="text-gray-500">Email:</div>
            <div className="font-medium text-right text-gray-900 dark:text-white break-all">
              {pr.payer?.email_address}
            </div>

            {breakdown && (
              <>
                <div className="text-gray-500 pt-2 border-t dark:border-emerald-800/30">
                  Gross:
                </div>
                <div className="font-bold text-right text-gray-900 dark:text-white pt-2 border-t dark:border-emerald-800/30">
                  {breakdown.gross_amount.value}{' '}
                  {breakdown.gross_amount.currency_code}
                </div>
                <div className="text-gray-500">Fee:</div>
                <div className="font-medium text-right text-red-600 dark:text-red-400">
                  -{breakdown.paypal_fee.value}{' '}
                  {breakdown.paypal_fee.currency_code}
                </div>
                <div className="text-gray-500 font-bold">Net:</div>
                <div className="font-bold text-right text-emerald-600 dark:text-emerald-400 text-sm">
                  {breakdown.net_amount.value}{' '}
                  {breakdown.net_amount.currency_code}
                </div>
              </>
            )}
          </div>
        </div>
      );
    }

    // Інші методи (Monobank/Generic)
    return (
      <div className="bg-gray-50 dark:bg-neutral-900 p-4 rounded-xl border border-gray-200 dark:border-neutral-800 text-sm overflow-hidden">
        <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
          <Receipt size={14} /> Транзакція
        </h4>
        <pre className="text-[10px] text-gray-500 whitespace-pre-wrap font-mono">
          {JSON.stringify(order.payment_result, null, 2)}
        </pre>
      </div>
    );
  };

  if (loading)
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Замовлення
        </h1>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Пошук */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Пошук (ID, Email, Ім'я)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-4 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Фільтр */}
          <div className="relative">
            <Filter
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto pl-9 pr-8 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
            >
              <option value="all">Всі статуси</option>
              <option value="pending">Очікують (Pending)</option>
              <option value="paid">Оплачені (Paid)</option>
              <option value="shipped">Відправлені (Shipped)</option>
              <option value="completed">Виконані (Completed)</option>
              <option value="cancelled">Скасовані (Cancelled)</option>
              <option value="failure">Помилка (Failure)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ТАБЛИЦЯ */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow overflow-x-auto border border-gray-100 dark:border-neutral-800">
        <table className="w-full text-left min-w-[800px]">
          <thead className="bg-gray-50 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 uppercase text-xs font-semibold">
            <tr>
              <th className="p-4">ID / Дата</th>
              <th className="p-4">Клієнт</th>
              <th className="p-4">Сума</th>
              <th className="p-4">Статус</th>
              <th className="p-4">Дії</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-neutral-800 text-gray-700 dark:text-gray-300">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  Замовлень за обраними критеріями не знайдено
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <td className="p-4">
                    <div className="font-mono text-sm font-bold text-black dark:text-white">
                      ...{order.id.replace('order_', '').substring(0, 8)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.created_at
                        ? format(new Date(order.created_at), 'dd.MM.yyyy HH:mm')
                        : '-'}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-black dark:text-white">
                      {order.shipping_address?.full_name ||
                        order.users?.full_name ||
                        'Гість'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.users?.email}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-black dark:text-white">
                      {order.total_amount} $
                    </div>
                    <div className="text-xs text-gray-500 uppercase">
                      {order.payment_method}
                    </div>
                  </td>
                  <td className="p-4">
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className={`border rounded-lg px-3 py-1.5 text-xs font-bold uppercase outline-none cursor-pointer transition-colors ${getStatusColor(
                        order.status
                      )}`}
                    >
                      <option value="pending">Очікує (Pending)</option>
                      <option value="paid">Оплачено (Paid)</option>
                      <option value="shipped">Відправлено (Shipped)</option>
                      <option value="completed">Виконано (Completed)</option>
                      <option value="cancelled">Скасовано (Cancelled)</option>
                      <option value="failure">Помилка (Failure)</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleOpenDetails(order)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium hover:underline"
                    >
                      Деталі
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- SHEET (БОКОВА ПАНЕЛЬ) --- */}
      <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        {/* Додав клас sm:max-w-2xl для збільшення ширини панелі */}
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto bg-white dark:bg-neutral-950 text-black dark:text-white border-l dark:border-neutral-800">
          <SheetHeader className="border-b dark:border-neutral-800 pb-4 mb-6">
            <SheetTitle className="text-2xl font-bold flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-600" />
              Деталі замовлення
            </SheetTitle>
            <div className="text-sm text-gray-500 font-mono">
              ID: {selectedOrder?.id}
            </div>
          </SheetHeader>

          {selectedOrder && (
            <div className="space-y-8 pb-10">
              {/* 1. ФІНАНСОВІ ДЕТАЛІ */}
              <PaymentDetails order={selectedOrder} />

              {/* 2. БЛОК ДОСТАВКИ */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-xl border border-blue-100 dark:border-blue-800/50 space-y-4">
                <h3 className="text-sm font-bold uppercase text-blue-800 dark:text-blue-300 flex items-center gap-2">
                  <Truck size={16} /> Доставка & Трекінг
                </h3>

                {/* Тип доставки */}
                <div className="flex justify-between items-center bg-white dark:bg-blue-950/50 p-3 rounded-lg border border-blue-100 dark:border-blue-800/50">
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    Обраний тип доставки:
                  </span>
                  <span className="text-sm font-bold text-blue-900 dark:text-white uppercase tracking-wide">
                    {selectedOrder.shipping_type || 'Standard'}
                  </span>
                </div>

                <div className="grid gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                      Сервіс доставки
                    </label>
                    <input
                      type="text"
                      placeholder="Наприклад: Nova Poshta, DHL..."
                      value={serviceInput}
                      onChange={(e) => setServiceInput(e.target.value)}
                      list="carriers"
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white dark:bg-neutral-900 dark:border-neutral-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    <datalist id="carriers">
                      <option value="Nova Poshta" />
                      <option value="Ukrposhta" />
                      <option value="DHL" />
                      <option value="UPS" />
                      <option value="FedEx" />
                    </datalist>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                      Трек-номер (ТТН)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Введіть номер..."
                        value={trackingInput}
                        onChange={(e) => setTrackingInput(e.target.value)}
                        className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white dark:bg-neutral-900 dark:border-neutral-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                      <button
                        onClick={saveTrackingInfo}
                        disabled={isSavingTracking}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSavingTracking ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <Save size={16} />
                        )}
                        Зберегти
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. ІНФО ПРО СТАТУС */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-neutral-900 p-4 rounded-xl border border-gray-100 dark:border-neutral-800">
                <div>
                  <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Calendar size={12} /> Дата
                  </div>
                  <div className="font-medium text-sm">
                    {format(
                      new Date(selectedOrder.created_at),
                      'dd.MM.yyyy HH:mm'
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <CreditCard size={12} /> Статус
                  </div>
                  <div
                    className={`text-sm font-bold uppercase px-2 py-0.5 rounded-md inline-block ${getStatusColor(
                      selectedOrder.status
                    )}`}
                  >
                    {selectedOrder.status}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Сума</div>
                  <div className="font-bold text-lg">
                    {selectedOrder.total_amount} $
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Метод оплати</div>
                  <div className="uppercase font-medium text-sm">
                    {selectedOrder.payment_method}
                  </div>
                </div>
              </div>

              {/* 4. КЛІЄНТ ТА ПОВНА АДРЕСА */}
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 border-b dark:border-neutral-800 pb-2">
                  <User className="w-5 h-5 text-gray-500" /> Клієнт та Адреса
                </h3>
                <div className="space-y-3 text-sm bg-white dark:bg-neutral-900 p-4 rounded-xl border border-gray-100 dark:border-neutral-800">
                  <div className="flex justify-between border-b border-dashed border-gray-200 dark:border-neutral-800 pb-2">
                    <span className="text-gray-500">Ім'я:</span>
                    <span className="font-medium text-right">
                      {selectedOrder.users?.full_name ||
                        selectedOrder.shipping_address?.recipient ||
                        selectedOrder.shipping_address?.full_name ||
                        'Не вказано'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-gray-200 dark:border-neutral-800 pb-2">
                    <span className="text-gray-500">Email:</span>
                    <span className="font-medium text-right select-all">
                      {selectedOrder.users?.email ||
                        selectedOrder.shipping_address?.email}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-gray-200 dark:border-neutral-800 pb-2">
                    <span className="text-gray-500">Телефон:</span>
                    <span className="font-medium text-right select-all">
                      {selectedOrder.shipping_address?.phone || '-'}
                    </span>
                  </div>

                  {/* Деталі адреси */}
                  <div className="flex justify-between border-b border-dashed border-gray-200 dark:border-neutral-800 pb-2">
                    <span className="text-gray-500">Країна:</span>
                    <span className="font-bold text-right">
                      {selectedOrder.shipping_address?.country_name}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-gray-200 dark:border-neutral-800 pb-2">
                    <span className="text-gray-500">Регіон / Штат:</span>
                    <span className="font-medium text-right">
                      {selectedOrder.shipping_address?.state_name || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-gray-200 dark:border-neutral-800 pb-2">
                    <span className="text-gray-500 flex items-center gap-1">
                      <MapPin size={12} /> Місто:
                    </span>
                    <span className="font-bold text-right text-base">
                      {selectedOrder.shipping_address?.city}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-gray-200 dark:border-neutral-800 pb-2">
                    <span className="text-gray-500">Індекс (ZIP):</span>
                    <span className="font-mono font-bold text-right text-blue-600 dark:text-blue-400 select-all text-base">
                      {selectedOrder.shipping_address?.postal_code}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-gray-500">Вулиця:</span>
                    <span className="font-medium text-right max-w-[60%] text-wrap">
                      {selectedOrder.shipping_address?.address_line1}{' '}
                      {selectedOrder.shipping_address?.address_line2}
                    </span>
                  </div>
                </div>
              </div>

              {/* 5. ТОВАРИ */}
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 border-b dark:border-neutral-800 pb-2">
                  <Package className="w-5 h-5 text-gray-500" /> Товари
                </h3>
                <div className="space-y-3">
                  {selectedOrder.order_items.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex gap-4 items-center bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 p-3 rounded-xl shadow-sm"
                    >
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-50 dark:bg-neutral-800 flex-shrink-0 border border-gray-100 dark:border-neutral-700">
                        {item.image_url && (
                          <Image
                            src={item.image_url}
                            alt=""
                            fill
                            className="object-contain p-1"
                          />
                        )}
                      </div>
                      <div className="flex-1 text-sm">
                        <div className="font-bold text-gray-900 dark:text-white line-clamp-1">
                          {item.product_title}
                        </div>
                        <div className="text-gray-500 mt-1 flex justify-between items-center">
                          <span>{item.quantity} шт.</span>
                          <span className="font-mono font-medium">
                            {item.price} $
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
