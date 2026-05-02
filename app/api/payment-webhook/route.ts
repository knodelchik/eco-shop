import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon-db';
import nodemailer from 'nodemailer';

const transporter = process.env.GMAIL_USER
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASSWORD },
    })
  : null;

/**
 * Webhook для платіжного провайдера (Monobank-like).
 * Оновлює статус замовлення у Neon і повідомляє адміна.
 */
export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');

    if (secret !== process.env.MONOBANK_WEBHOOK_SECRET) {
      console.warn('Unauthorized webhook attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { status, reference } = body as { status: string; reference: string };

    let newStatus: 'pending' | 'paid' | 'cancelled' = 'pending';
    if (status === 'success') newStatus = 'paid';
    else if (status === 'failure') newStatus = 'cancelled';

    await sql`
      UPDATE orders
      SET status = ${newStatus}, payment_id = ${body.invoiceId ?? null}, updated_at = NOW()
      WHERE id = ${Number(reference)}
    `;

    // Завантажуємо замовлення для notification
    const orderRows = await sql`SELECT * FROM orders WHERE id = ${Number(reference)} LIMIT 1`;
    const orderItems = await sql`SELECT * FROM order_items WHERE order_id = ${Number(reference)}`;

    const fullOrder = (orderRows as Record<string, unknown>[])[0];
    if (fullOrder && transporter) {
      try {
        await sendAdminNotification(
          String(reference),
          fullOrder,
          orderItems as Record<string, unknown>[],
          newStatus,
          body
        );
      } catch (emailError) {
        console.error('Nodemailer error:', emailError);
      }
    }

    // Зменшуємо stock для оплачених
    if (newStatus === 'paid') {
      for (const item of orderItems as Record<string, unknown>[]) {
        await sql`
          UPDATE products
          SET stock = GREATEST(0, stock - ${Number(item.quantity)})
          WHERE id = ${Number(item.product_id)}
        `;
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function sendAdminNotification(
  orderId: string,
  order: Record<string, unknown>,
  items: Record<string, unknown>[],
  status: string,
  webhookBody: Record<string, unknown>
) {
  let subjectPrefix = '⏳ Оновлення замовлення';
  let statusColor = '#eab308';
  let statusMessage = `Статус: ${status}`;

  if (status === 'paid') {
    subjectPrefix = '✅ ОПЛАЧЕНО';
    statusColor = '#52B788';
    statusMessage = 'Успішна оплата! Готуйте до відправки.';
  } else if (status === 'cancelled') {
    subjectPrefix = '⚠️ НЕВДАЛА СПРОБА';
    statusColor = '#ef4444';
    statusMessage = 'Оплата не пройшла.';
  }

  const itemsListHtml = items
    .map(
      (item) =>
        `<li><strong>${String(item.product_title)}</strong> — ${Number(item.quantity)} шт. × $${Number(item.unit_price)}</li>`
    )
    .join('');

  let addressString = 'Не вказано';
  if (order.shipping_address) {
    const addr = order.shipping_address as Record<string, string>;
    addressString = `${addr.country_name || ''}, ${addr.city || ''}, ${addr.address_line1 || ''} ${addr.postal_code || ''}`;
    if (addr.phone) addressString += `<br><strong>Тел.:</strong> ${addr.phone}`;
  }

  await transporter!.sendMail({
    to: process.env.ADMIN_EMAIL,
    from: `"EcoShop Orders" <${process.env.GMAIL_USER}>`,
    subject: `${subjectPrefix} #${orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px;">
        <div style="background-color: ${statusColor}; color: white; padding: 15px; text-align: center; border-radius: 5px;">
          <h2>${statusMessage}</h2>
        </div>
        <p><strong>ID:</strong> ${orderId}</p>
        <p><strong>Сума:</strong> $${Number(order.total)}</p>
        <h3>👤 Клієнт</h3>
        <p>Email: ${String(order.email)}</p>
        <h3>📍 Доставка</h3>
        <p>${addressString}</p>
        <h3>🛒 Товари</h3>
        <ul>${itemsListHtml}</ul>
        <p style="font-size: 12px; color: #999;">Invoice: ${String(webhookBody.invoiceId || '-')}</p>
      </div>`,
  });
}
