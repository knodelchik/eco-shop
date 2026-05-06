import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { sql } from '@/lib/neon-db';
import { requireAdmin } from '@/lib/auth-guard';

const transporter = process.env.GMAIL_USER
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASSWORD },
    })
  : null;

const STATUS_LABELS_UK: Record<string, string> = {
  pending: 'Очікує оплати',
  paid: 'Оплачено',
  shipped: 'Відправлено',
  delivered: 'Доставлено',
  cancelled: 'Скасовано',
};

const ALLOWED_STATUSES = new Set([
  'pending',
  'paid',
  'shipped',
  'delivered',
  'cancelled',
]);

/**
 * GET   /api/admin/orders?since=ISO&limit=N&status=paid — список замовлень.
 * PATCH /api/admin/orders { id, status }                 — змінити статус.
 *
 * Обидва ендпоінти потребують прав admin (role у user_profiles або email у
 * NEXT_PUBLIC_ADMIN_EMAILS). PATCH додатково надсилає юзеру email-нотифікацію.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(request.url);
  const since = searchParams.get('since');
  const limit = searchParams.get('limit');
  const status = searchParams.get('status');

  try {
    let rows;
    if (since && status) {
      rows = limit
        ? await sql`SELECT * FROM orders WHERE created_at >= ${since}::timestamptz AND status = ${status} ORDER BY created_at DESC LIMIT ${Number(limit)}`
        : await sql`SELECT * FROM orders WHERE created_at >= ${since}::timestamptz AND status = ${status} ORDER BY created_at DESC`;
    } else if (since) {
      rows = limit
        ? await sql`SELECT * FROM orders WHERE created_at >= ${since}::timestamptz ORDER BY created_at DESC LIMIT ${Number(limit)}`
        : await sql`SELECT * FROM orders WHERE created_at >= ${since}::timestamptz ORDER BY created_at DESC`;
    } else if (status) {
      rows = limit
        ? await sql`SELECT * FROM orders WHERE status = ${status} ORDER BY created_at DESC LIMIT ${Number(limit)}`
        : await sql`SELECT * FROM orders WHERE status = ${status} ORDER BY created_at DESC`;
    } else {
      rows = limit
        ? await sql`SELECT * FROM orders ORDER BY created_at DESC LIMIT ${Number(limit)}`
        : await sql`SELECT * FROM orders ORDER BY created_at DESC`;
    }
    return NextResponse.json(rows);
  } catch (error) {
    console.error('GET /api/admin/orders failed:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const auth = await requireAdmin({ userId: body?.actorUserId });
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const id = Number(body?.id);
    const status = String(body?.status ?? '');
    if (!id || !ALLOWED_STATUSES.has(status)) {
      return NextResponse.json(
        { error: 'id and valid status required' },
        { status: 400 }
      );
    }

    const updated = (await sql`
      UPDATE orders
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, email, total, currency, status
    `) as Record<string, unknown>[];

    if (updated.length === 0) {
      return NextResponse.json({ error: 'order not found' }, { status: 404 });
    }

    const order = updated[0];
    const recipient = String(order.email ?? '');

    // Notification — best-effort; не валимо PATCH якщо пошта впала.
    if (transporter && recipient) {
      const label = STATUS_LABELS_UK[status] ?? status;
      const subject = `EcoShop: статус замовлення №${order.id} — ${label}`;
      const html = `
        <div style="font-family: system-ui, sans-serif; max-width: 480px;">
          <h2 style="color: #2f5634;">Статус замовлення оновлено</h2>
          <p>Доброго дня! Статус вашого замовлення <strong>№${order.id}</strong>
             змінено на <strong>${label}</strong>.</p>
          <p>Сума: <strong>${order.total} ${order.currency}</strong></p>
          <hr />
          <p style="color: #666; font-size: 12px;">EcoShop — еко-товари без зайвого пластику.</p>
        </div>
      `;

      transporter
        .sendMail({
          from: `"EcoShop" <${process.env.GMAIL_USER}>`,
          to: recipient,
          subject,
          html,
        })
        .catch((e) => console.error('order status email failed:', e));
    }

    return NextResponse.json({ ok: true, order });
  } catch (error) {
    console.error('PATCH /api/admin/orders failed:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
