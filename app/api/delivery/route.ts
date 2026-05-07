import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon-db';

export async function GET() {
  try {
    const rows = await sql`
      SELECT country_code, country_name, standard_price, express_price
      FROM delivery_settings
      ORDER BY country_name ASC
    `;
    return NextResponse.json(rows);
  } catch (e) {
    console.warn('GET /api/delivery: table likely missing, returning empty:', e);
    return NextResponse.json([]);
  }
}
