import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/neon-db';
import { requireOwnUser } from '@/lib/auth-guard';

/**
 * Маршрути для роботи з адресами користувача.
 *
 * GET    /api/addresses?userId=...
 * POST   /api/addresses { userId, ...AddressFormData }
 * PATCH  /api/addresses { userId, addressId, setDefault: true }
 * DELETE /api/addresses { userId, addressId }
 */

export async function GET(request: NextRequest) {
  const userId = new URL(request.url).searchParams.get('userId');
  const auth = await requireOwnUser(userId);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const rows = await sql`
      SELECT * FROM user_addresses
      WHERE user_id = ${userId}::uuid
      ORDER BY is_default DESC, created_at DESC
    `;
    return NextResponse.json(rows);
  } catch (error) {
    console.error('GET /api/addresses failed:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      userId,
      country_code,
      country_name,
      state_code = null,
      state_name = null,
      city,
      address_line1,
      address_line2 = null,
      postal_code,
      phone,
      is_default = false,
    } = await request.json();

    const auth = await requireOwnUser(userId);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    if (!country_code || !city || !address_line1 || !postal_code || !phone) {
      return NextResponse.json({ error: 'missing fields' }, { status: 400 });
    }

    if (is_default) {
      await sql`UPDATE user_addresses SET is_default = false WHERE user_id = ${userId}::uuid`;
    }

    const rows = await sql`
      INSERT INTO user_addresses
        (user_id, country_code, country_name, state_code, state_name,
         city, address_line1, address_line2, postal_code, phone, is_default)
      VALUES
        (${userId}::uuid, ${country_code}, ${country_name}, ${state_code}, ${state_name},
         ${city}, ${address_line1}, ${address_line2}, ${postal_code}, ${phone}, ${is_default})
      RETURNING *
    `;
    return NextResponse.json((rows as Record<string, unknown>[])[0]);
  } catch (error) {
    console.error('POST /api/addresses failed:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId, addressId, setDefault } = await request.json();
    const auth = await requireOwnUser(userId);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (!addressId) {
      return NextResponse.json({ error: 'addressId required' }, { status: 400 });
    }

    if (setDefault) {
      await sql`UPDATE user_addresses SET is_default = false WHERE user_id = ${userId}::uuid`;
      await sql`
        UPDATE user_addresses SET is_default = true
        WHERE id = ${addressId} AND user_id = ${userId}::uuid
      `;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('PATCH /api/addresses failed:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId, addressId } = await request.json();
    const auth = await requireOwnUser(userId);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (!addressId) {
      return NextResponse.json({ error: 'addressId required' }, { status: 400 });
    }
    await sql`
      DELETE FROM user_addresses
      WHERE id = ${addressId} AND user_id = ${userId}::uuid
    `;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('DELETE /api/addresses failed:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
