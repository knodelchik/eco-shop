'use client';

import { useEffect, useMemo, useState } from 'react';
import { Country } from 'country-state-city';
import { Loader2, Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '../../services/authService';
import { authHeaders } from '../../../lib/web-auth-token';

interface DeliveryRow {
  id: number;
  country_code: string;
  country_name: string;
  standard_price: number | string;
  express_price: number | string;
  updated_at?: string;
}

const BLOCKED_COUNTRIES = new Set(['RU', 'BY']);

/**
 * Адмін-сторінка налаштувань доставки.
 * Тариф визначається на рівні країни. Якщо для конкретної країни рядка
 * немає у таблиці delivery_settings — `/api/create-payment` падає на
 * flat-rate ($5 standard / $10 express).
 */
export default function AdminDeliveryPage() {
  const [rows, setRows] = useState<DeliveryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [countryCode, setCountryCode] = useState('');
  const [standardPrice, setStandardPrice] = useState('5');
  const [expressPrice, setExpressPrice] = useState('10');
  const [saving, setSaving] = useState(false);

  const countries = useMemo(
    () =>
      Country.getAllCountries()
        .filter((c) => !BLOCKED_COUNTRIES.has(c.isoCode))
        .map((c) => ({ code: c.isoCode, name: c.name })),
    []
  );

  const countryByCode = useMemo(() => {
    const map = new Map<string, string>();
    countries.forEach((c) => map.set(c.code, c.name));
    return map;
  }, [countries]);

  const loadRows = async () => {
    setLoading(true);
    try {
      const { user } = await authService.getCurrentUser();
      const params = new URLSearchParams();
      if (user?.id) params.set('actorUserId', user.id);
      if (user?.email) params.set('actorEmail', user.email);
      const res = await fetch(`/api/admin/delivery?${params}`, {
        headers: authHeaders(),
      });
      if (res.ok) setRows(await res.json());
      else toast.error('Не вдалося завантажити список');
    } catch (e) {
      console.error(e);
      toast.error('Помилка завантаження');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadRows();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!countryCode) {
      toast.error('Оберіть країну');
      return;
    }
    const std = Number(standardPrice);
    const exp = Number(expressPrice);
    if (!Number.isFinite(std) || std < 0 || !Number.isFinite(exp) || exp < 0) {
      toast.error('Ціни мають бути не-від\'ємними числами');
      return;
    }
    setSaving(true);
    try {
      const { user } = await authService.getCurrentUser();
      const res = await fetch('/api/admin/delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          country_code: countryCode,
          country_name: countryByCode.get(countryCode) ?? countryCode,
          standard_price: std,
          express_price: exp,
          actorUserId: user?.id,
          actorEmail: user?.email,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error ?? 'Не вдалося зберегти');
        return;
      }
      toast.success('Тариф збережено');
      await loadRows();
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (code: string) => {
    if (!confirm(`Видалити тариф для ${code}?`)) return;
    try {
      const { user } = await authService.getCurrentUser();
      const res = await fetch('/api/admin/delivery', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          country_code: code,
          actorUserId: user?.id,
          actorEmail: user?.email,
        }),
      });
      if (res.ok) {
        toast.success('Видалено');
        setRows((prev) => prev.filter((r) => r.country_code !== code));
      } else toast.error('Помилка видалення');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Тарифи доставки
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Якщо тариф для країни не задано — використовується flat-rate $5 / $10.
        </p>
      </div>

      {/* Форма додавання / редагування */}
      <form
        onSubmit={onSubmit}
        className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-6 space-y-4"
      >
        <h2 className="font-semibold text-gray-900 dark:text-white">
          Новий тариф / оновити існуючий
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Країна
            </label>
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="w-full h-10 px-3 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">— оберіть —</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Standard, USD
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={standardPrice}
              onChange={(e) => setStandardPrice(e.target.value)}
              className="w-full h-10 px-3 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Express, USD
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={expressPrice}
              onChange={(e) => setExpressPrice(e.target.value)}
              className="w-full h-10 px-3 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Зберегти
        </button>
      </form>

      {/* Список */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 uppercase text-xs">
            <tr>
              <th className="text-left px-4 py-3">Країна</th>
              <th className="text-right px-4 py-3">Standard</th>
              <th className="text-right px-4 py-3">Express</th>
              <th className="px-4 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin inline-block text-gray-400" />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-6 text-gray-500">
                  <Plus className="w-4 h-4 inline-block mr-1" />
                  Тарифів немає — буде застосовано flat-rate
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    {r.country_name}{' '}
                    <span className="text-gray-400 font-normal">({r.country_code})</span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    ${Number(r.standard_price).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    ${Number(r.express_price).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onDelete(r.country_code)}
                      className="text-red-500 hover:text-red-600 p-1"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
