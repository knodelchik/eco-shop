import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon-db';

/**
 * GET /api/delivery — публічний прайс-лист доставки.
 *
 * Не auth-захищено бо тарифи доставки відомі покупцю до checkout-у.
 * Якщо таблиці delivery_settings ще нема — повертаємо порожній масив,
 * клієнт сам падає на flat-rate.
 */
export async function GET() {
  try {
    const rows = await sql`
      SELECT country_code, country_name, standard_price, express_price
      FROM delivery_settings
      ORDER BY country_name ASC
    `;
    return NextResponse.json(rows);
  } catch (e) {
    // Таблиці може не існувати — це нормально, повертаємо порожньо.
    console.warn('GET /api/delivery: table likely missing, returning empty:', e);
    return NextResponse.json([]);
  }
}
