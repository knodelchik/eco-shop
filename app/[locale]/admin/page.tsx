'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  DollarSign,
  Package,
  ShoppingBag,
  Users,
  TrendingUp,
  Calendar,
  RefreshCw,
  CreditCard,
  ArrowUpRight,
  ChevronDown
} from 'lucide-react';
import {
  ComposedChart,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays, startOfDay, differenceInDays } from 'date-fns';
import Link from 'next/link';

// --- Опції діапазонів ---
const DATE_RANGES = [
  { label: '7 днів', value: 7 },
  { label: '30 днів', value: 30 },
  { label: '90 днів (3 міс)', value: 90 },
  { label: '180 днів (6 міс)', value: 180 },
  { label: '365 днів (Рік)', value: 365 },
  { label: 'За весь час', value: 'all' }, // ✅ Додано опцію
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'success':
    case 'paid':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'shipped':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'pending':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    case 'completed':
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    case 'cancelled':
    case 'failure':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-neutral-400';
  }
};

export default function AdminDashboard() {
  // ✅ Змінено тип стейту, щоб приймати 'all'
  const [dateRange, setDateRange] = useState<number | 'all'>(30);
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
  const dateMenuRef = useRef<HTMLDivElement>(null);

  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    pendingOrders: 0,
    totalUsers: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Закриття меню при кліку зовні
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dateMenuRef.current && !dateMenuRef.current.contains(event.target as Node)) {
        setIsDateMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      // Завантажуємо всі замовлення з нашого API і фільтруємо локально
      const params = new URLSearchParams();
      if (dateRange !== 'all') {
        const startDate = startOfDay(subDays(new Date(), dateRange));
        params.set('since', startDate.toISOString());
      }
      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const allOrders = res.ok ? ((await res.json()) as Array<{
        total_amount?: number;
        total?: number;
        status: string;
        created_at: string;
      }>) : [];

      // total може приходити як total або total_amount залежно від схеми
      const normalized = allOrders.map((o) => ({
        ...o,
        total_amount: Number(o.total_amount ?? o.total ?? 0),
      }));

      const usersRes = await fetch('/api/admin/users-count');
      const usersCount = usersRes.ok ? (await usersRes.json()).count : 0;

      const paidStatuses = ['success', 'paid', 'shipped', 'completed', 'delivered'];
      const paidOrders = normalized.filter((o) => paidStatuses.includes(o.status));
      const pendingCount = normalized.filter((o) => o.status === 'pending').length;

      const revenue = paidOrders.reduce((sum: number, o: { total_amount: number }) => sum + Number(o.total_amount), 0);
      const aov = paidOrders.length > 0 ? revenue / paidOrders.length : 0;

      setStats({
        totalRevenue: revenue,
        totalOrders: normalized.length,
        averageOrderValue: aov,
        pendingOrders: pendingCount,
        totalUsers: usersCount || 0,
      });

      // --- Побудова графіка ---
      const chartMap = new Map();
      
      // ✅ Визначаємо реальну кількість днів для графіка
      let daysCount = typeof dateRange === 'number' ? dateRange : 30;
      
      if (dateRange === 'all') {
        if (paidOrders.length > 0) {
          const firstOrderDate = new Date(paidOrders[0].created_at);
          // Рахуємо різницю днів між першим замовленням і сьогодні
          daysCount = differenceInDays(new Date(), firstOrderDate) + 1;
        } else {
          daysCount = 30; // Дефолт якщо замовлень немає
        }
      }

      // Заповнюємо карту пустими датами
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = subDays(new Date(), i);
        // Форматування дати для ключа
        const key = format(d, 'dd.MM');
        
        if (!chartMap.has(key)) {
            // Додаємо timestamp для правильного сортування, якщо знадобиться
            chartMap.set(key, { name: key, revenue: 0, count: 0, timestamp: d.getTime() });
        }
      }

      paidOrders.forEach((order) => {
        const orderDate = new Date(order.created_at);
        const key = format(orderDate, 'dd.MM');
        
        if (chartMap.has(key)) {
            const current = chartMap.get(key);
            chartMap.set(key, {
                ...current,
                revenue: current.revenue + Number(order.total_amount),
                count: current.count + 1
            });
        }
      });

      setChartData(Array.from(chartMap.values()));

      // Останні замовлення
      const recentRes = await fetch('/api/admin/orders?limit=5');
      const lastOrders = recentRes.ok ? await recentRes.json() : [];
      setRecentOrders(lastOrders || []);
    } catch (error) {
      console.error('Dashboard Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadDashboardData();
    // Realtime у Neon тут не реалізовано — користувач може натиснути "Оновити".
  }, [loadDashboardData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleRangeChange = (value: number | 'all') => {
    setDateRange(value);
    setIsDateMenuOpen(false);
    setLoading(true);
  };

  if (loading) return <div className="p-12 text-center text-gray-500 animate-pulse">Завантаження аналітики...</div>;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Дашборд</h1>
            <p className="text-sm text-gray-500 mt-1">
              Огляд: {dateRange === 'all' ? 'За весь час' : `Останні ${dateRange} днів`}
            </p>
        </div>

        <div className="flex w-full sm:w-auto gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Оновити
          </button>

          {/* Випадаюче меню дат */}
          <div className="relative flex-1 sm:flex-none" ref={dateMenuRef}>
            <button
              onClick={() => setIsDateMenuOpen(!isDateMenuOpen)}
              className="w-full justify-between sm:justify-center text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-neutral-900 px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-800 flex items-center gap-2 shadow-sm hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-500" />
                <span className="whitespace-nowrap font-medium">
                  {DATE_RANGES.find(r => r.value === dateRange)?.label || `${dateRange} днів`}
                </span>
              </div>
              <ChevronDown size={14} className={`text-gray-400 transition-transform ${isDateMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDateMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="py-1">
                  {DATE_RANGES.map((range) => (
                    <button
                      key={range.value}
                      // @ts-ignore
                      onClick={() => handleRangeChange(range.value)}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer flex items-center justify-between
                        ${dateRange === range.value 
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-medium' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800'
                        }`}
                    >
                      {range.label}
                      {dateRange === range.value && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title={`Дохід`}
          value={`${stats.totalRevenue.toLocaleString()} $`}
          icon={<DollarSign size={22} />}
          color="emerald"
        />
        <StatCard
          title="Замовлень"
          value={stats.totalOrders}
          icon={<ShoppingBag size={22} />}
          color="blue"
        />
        <StatCard
          title="Середній чек"
          value={`${stats.averageOrderValue.toFixed(1)} $`}
          icon={<CreditCard size={22} />}
          color="violet"
        />
        <StatCard
          title="Очікують"
          value={stats.pendingOrders}
          icon={<Package size={22} />}
          color="amber"
        />
        <StatCard
          title="Всього Клієнтів"
          value={stats.totalUsers}
          icon={<Users size={22} />}
          color="indigo"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Графік */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-500" />
                Динаміка продажів
             </h3>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                
                {/* ✅ ОНОВЛЕНА ВІСЬ X */}
                <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6b7280', fontSize: 11 }} 
                    dy={10}
                    // Ця властивість гарантує, що між підписами буде мінімум 30px
                    minTickGap={30} 
                />
                
                <YAxis 
                    yAxisId="left"
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#10b981', fontSize: 11 }}
                    tickFormatter={(val) => `${val}`}
                    width={40}
                />
                
                <YAxis 
                    yAxisId="right"
                    orientation="right"
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#3b82f6', fontSize: 11 }}
                    width={30}
                />
                
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#f9fafb',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                  itemStyle={{ fontSize: '12px', padding: '2px 0' }}
                  labelStyle={{ marginBottom: '8px', color: '#9ca3af' }}
                />
                
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }}/>
                
                <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    name="Дохід ($)"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    activeDot={{ r: 6, strokeWidth: 0 }}
                />

                <Bar 
                    yAxisId="right"
                    dataKey="count" 
                    name="Замовлень" 
                    // Тонші стовпчики для довгих періодів
                    barSize={dateRange === 'all' || (typeof dateRange === 'number' && dateRange > 60) ? 6 : 12} 
                    fill="#3b82f6" 
                    radius={[4, 4, 4, 4]}
                    opacity={0.8}
                />
                
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-1 bg-white dark:bg-neutral-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Останні дії
            </h3>
            <Link
              href="/admin/orders"
              className="group flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              Всі замовлення <ArrowUpRight size={14} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {recentOrders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
                  <ShoppingBag size={32} className="mb-2 opacity-50" />
                  <p className="text-sm">Замовлень ще немає</p>
              </div>
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="group flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-800/30 hover:bg-white dark:hover:bg-neutral-800 hover:shadow-sm transition-all"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-gray-900 dark:text-white text-sm truncate max-w-[120px]">
                        {order.users?.full_name || 'Гість'}
                        </p>
                        <span className="text-[10px] text-gray-500 bg-gray-200 dark:bg-neutral-700 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            {order.payment_method}
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      {format(new Date(order.created_at), 'dd.MM, HH:mm')}
                    </p>
                  </div>
                  
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-gray-900 dark:text-white text-sm">
                      {order.total_amount} $
                    </p>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md uppercase font-bold inline-block mt-1 ${getStatusColor(order.status)}`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  const colors: any = {
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
    indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
    violet: 'bg-violet-100 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400',
  };

  return (
    <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 transition-all hover:shadow-md hover:-translate-y-1">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {title}
        </h3>
        <div className={`p-2.5 rounded-xl ${colors[color]}`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white truncate">
        {value}
      </p>
    </div>
  );
}