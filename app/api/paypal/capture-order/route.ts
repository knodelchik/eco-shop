import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon-db';
import { generateAccessToken, PAYPAL_API_BASE } from '../../../lib/paypal';

export async function POST(req: Request) {
  try {
    const { orderID } = await req.json();

    const accessToken = await generateAccessToken();
    const url = `${PAYPAL_API_BASE}/v2/checkout/orders/${orderID}/capture`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const captureData = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: captureData }, { status: response.status });
    }

    if (captureData.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    // Оновлюємо замовлення у БД
    const internalOrderId = captureData.purchase_units?.[0]?.reference_id;
    if (internalOrderId) {
      await sql`
        UPDATE orders
        SET status = 'paid',
            payment_id = ${captureData.id},
            updated_at = NOW()
        WHERE id = ${Number(internalOrderId)}
      `;
    }

    return NextResponse.json({ status: 'success', data: captureData });
  } catch (error) {
    console.error('Capture Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
