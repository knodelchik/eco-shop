import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/neon-db';
import { requireAdmin } from '@/lib/auth-guard';

/**
 * Управління тарифами доставки за країною.
 *
 * Pre-condition: таблиця delivery_settings:
 *   CREATE TABLE delivery_settings (
 *     id BIGSERIAL PRIMARY KEY,
 *     country_code TEXT NOT NULL UNIQUE,
 *     country_name TEXT NOT NULL,
 *     standard_price NUMERIC(10,2) NOT NULL DEFAULT 5,
 *     express_price NUMERIC(10,2) NOT NULL DEFAULT 10,
 *     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 *   );
 *
 * GET    /api/admin/delivery                         — список усіх тарифів
 * POST   /api/admin/delivery  { country_code, country_name, standard_price, express_price }
 *                                                    — upsert
 * DELETE /api/admin/delivery  { country_code }       — видалити
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const auth = await requireAdmin({
    userId: searchParams.get('actorUserId'),
    email: searchParams.get('actorEmail'),
  });
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const rows = await sql`
      SELECT id, country_code, country_name, standard_price, express_price,
             created_at, updated_at
      FROM delivery_settings
      ORDER BY country_name ASC
    `;
    return NextResponse.json(rows);
  } catch (error) {
    console.error('GET /api/admin/delivery failed:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const auth = await requireAdmin({
      userId: body?.actorUserId,
      email: body?.actorEmail,
    });
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const code = String(body?.country_code ?? '').trim().toUpperCase();
    const name = String(body?.country_name ?? '').trim();
    const std = Number(body?.standard_price);
    const exp = Number(body?.express_price);

    if (!code || code.length !== 2 || !name) {
      return NextResponse.json(
        { error: 'country_code (2 chars) and country_name required' },
        { status: 400 }
      );
    }
    if (!Number.isFinite(std) || std < 0 || !Number.isFinite(exp) || exp < 0) {
      return NextResponse.json(
        { error: 'prices must be non-negative numbers' },
        { status: 400 }
      );
    }

    const rows = await sql`
      INSERT INTO delivery_settings (country_code, country_name, standard_price, express_price)
      VALUES (${code}, ${name}, ${std}, ${exp})
      ON CONFLICT (country_code) DO UPDATE SET
        country_name = EXCLUDED.country_name,
        standard_price = EXCLUDED.standard_price,
        express_price = EXCLUDED.express_price,
        updated_at = NOW()
      RETURNING *
    `;
    return NextResponse.json((rows as Record<string, unknown>[])[0]);
  } catch (error) {
    console.error('POST /api/admin/delivery failed:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const auth = await requireAdmin({
      userId: body?.actorUserId,
      email: body?.actorEmail,
    });
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const code = String(body?.country_code ?? '').trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ error: 'country_code required' }, { status: 400 });
    }
    await sql`DELETE FROM delivery_settings WHERE country_code = ${code}`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('DELETE /api/admin/delivery failed:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
