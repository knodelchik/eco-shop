'use client';

/**
 * Адмін-сторінка налаштувань доставки.
 *
 * Для курсового проекту з Neon-схемою таблицю `delivery_settings` не створюємо —
 * у платіжних роутах використовується flat-rate доставка ($5 / Express $10).
 *
 * Якщо у вас буде потреба у складніших правилах — додайте таблицю
 * `delivery_settings(country_code, country_name, standard_price, express_price)`
 * у db/migrations та поверніть оригінальну логіку.
 */
export default function AdminDeliveryPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        Налаштування доставки
      </h1>
      <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-6">
        <p className="text-amber-900 dark:text-amber-200 leading-relaxed">
          Цю сторінку поки що відключено у новій Neon-архітектурі магазину.
          Доставка розраховується flat-rate: <strong>$5</strong> для стандартної
          та <strong>$10</strong> для експрес-варіанту.
        </p>
        <p className="text-sm text-amber-800 dark:text-amber-300 mt-3">
          Щоб увімкнути різні ціни на країну — додайте таблицю
          <code className="font-mono mx-1">delivery_settings</code> у вашу
          Neon-БД та поверніть логіку у{' '}
          <code className="font-mono">app/api/create-payment/route.ts</code>.
        </p>
      </div>
    </div>
  );
}
