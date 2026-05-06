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
  const { searchParams } = new URL(request.url);
  // Веб-клієнт пробрасає actorUserId/actorEmail з authService.getCurrentUser()
  // (cookie на наш origin не пишеться — бо Neon Auth на іншому домені).
  const auth = await requireAdmin({
    userId: searchParams.get('actorUserId'),
    email: searchParams.get('actorEmail'),
  });
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

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

    const orders = rows as Record<string, unknown>[];

    // Збагачуємо profile-info і items, нормалізуємо до форми, якої очікує
    // app/[locale]/admin/orders/page.tsx:
    //   - id як string (там виклик .replace/.toLowerCase)
    //   - users: { full_name, email, phone } — підтягуємо з user_profiles
    //   - total_amount — alias на total
    //   - shipping_type — підтягуємо з jsonb shipping_address
    //   - order_items: [{ image_url, price, ... }] — alias на product_image/unit_price
    const userIds = orders
      .map((o) => o.user_id)
      .filter((u): u is string => typeof u === 'string' && u.length > 0);

    const profilesRows = userIds.length
      ? ((await sql`
          SELECT user_id, full_name, phone
          FROM user_profiles
          WHERE user_id = ANY(${userIds}::uuid[])
        `) as Record<string, unknown>[])
      : [];
    const profileById = new Map(profilesRows.map((p) => [String(p.user_id), p]));

    const orderIds = orders.map((o) => o.id);
    const itemRows = orderIds.length
      ? ((await sql`
          SELECT * FROM order_items WHERE order_id = ANY(${orderIds}::bigint[])
        `) as Record<string, unknown>[])
      : [];

    const result = orders.map((o) => {
      const profile = profileById.get(String(o.user_id ?? ''));
      const shipping =
        typeof o.shipping_address === 'object' && o.shipping_address !== null
          ? (o.shipping_address as Record<string, unknown>)
          : {};

      return {
        ...o,
        id: String(o.id),
        // legacy alias на total для сумісності з UI
        total_amount: Number(o.total ?? 0),
        shipping_type: shipping.shipping_type ?? 'Standard',
        users: {
          full_name:
            (profile?.full_name as string | undefined) ??
            (shipping.full_name as string | undefined) ??
            (shipping.recipient as string | undefined) ??
            null,
          email: o.email,
          phone:
            (profile?.phone as string | undefined) ??
            (shipping.phone as string | undefined) ??
            null,
        },
        order_items: itemRows
          .filter((i) => Number(i.order_id) === Number(o.id))
          .map((i) => ({
            ...i,
            id: String(i.id),
            // legacy aliases
            image_url: i.product_image,
            price: Number(i.unit_price ?? 0),
          })),
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/admin/orders failed:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const auth = await requireAdmin({
      userId: body?.actorUserId,
      email: body?.actorEmail,
    });
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const id = Number(body?.id);
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    // Дозволяємо оновлювати status, notes — або обидва. Note-only update
    // використовується сторінкою для збереження трекінгу (kludge до того,
    // як з'явиться окрема таблиця shipments).
    const hasStatus = typeof body?.status === 'string' && body.status.length > 0;
    const hasNotes = typeof body?.notes === 'string';

    if (!hasStatus && !hasNotes) {
      return NextResponse.json(
        { error: 'either status or notes required' },
        { status: 400 }
      );
    }

    if (hasStatus && !ALLOWED_STATUSES.has(String(body.status))) {
      return NextResponse.json(
        { error: 'invalid status value' },
        { status: 400 }
      );
    }

    // Якщо переходимо у cancelled — треба повернути stock на склад.
    // Робимо це ДО UPDATE статусу, щоб не плутатись з повторними cancel.
    let stockReturned = false;
    if (hasStatus && body.status === 'cancelled') {
      const prev = (await sql`
        SELECT status FROM orders WHERE id = ${id} LIMIT 1
      `) as Record<string, unknown>[];
      const prevStatus = String(prev[0]?.status ?? '');
      // Stock повертаємо лише якщо замовлення було активне (не вже скасоване).
      if (prevStatus && prevStatus !== 'cancelled') {
        await sql`
          UPDATE products p
          SET stock = p.stock + i.quantity, updated_at = NOW()
          FROM order_items i
          WHERE i.order_id = ${id} AND p.id = i.product_id
        `;
        stockReturned = true;
      }
    }

    let updated: Record<string, unknown>[];
    if (hasStatus && hasNotes) {
      updated = (await sql`
        UPDATE orders
        SET status = ${String(body.status)},
            notes = ${String(body.notes)},
            updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, email, total, currency, status, notes
      `) as Record<string, unknown>[];
    } else if (hasStatus) {
      updated = (await sql`
        UPDATE orders
        SET status = ${String(body.status)}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, email, total, currency, status, notes
      `) as Record<string, unknown>[];
    } else {
      updated = (await sql`
        UPDATE orders
        SET notes = ${String(body.notes)}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, email, total, currency, status, notes
      `) as Record<string, unknown>[];
    }

    if (updated.length === 0) {
      return NextResponse.json({ error: 'order not found' }, { status: 404 });
    }
    void stockReturned;

    const order = updated[0];
    const recipient = String(order.email ?? '');

    // Email шлемо тільки коли реально змінили status. Note-only update —
    // тиха операція (тільки для адміна, не повідомляємо юзера).
    if (hasStatus && transporter && recipient) {
      const status = String(body.status);
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
