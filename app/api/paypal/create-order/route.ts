import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon-db';
import { generateAccessToken, PAYPAL_API_BASE } from '../../../lib/paypal';
import { getBaseUrl } from '@/lib/base-url';

/**
 * Створює замовлення у нашій БД (Neon) і відповідне PayPal-замовлення.
 *
 * Схема орендів спрощена для курсової: фіксована доставка $5 (flat rate).
 * Якщо потрібні країнні правила — додайте таблицю delivery_settings.
 */
const FLAT_SHIPPING_USD = 5;

interface ClientItem {
  id: number;
  title: string;
  quantity: number;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, shippingAddress, shippingType } = body as {
      items: ClientItem[];
      shippingAddress: Record<string, unknown>;
      shippingType: string;
    };

    if (!items?.length || !shippingAddress) {
      return NextResponse.json({ error: "Відсутні обов'язкові дані" }, { status: 400 });
    }

    // 1. Беремо актуальні ціни з БД (захист від маніпуляцій клієнта)
    const itemIds = items.map((i) => i.id);
    const dbProducts = await sql`
      SELECT id, price, title, images, stock FROM products
      WHERE id = ANY(${itemIds}::bigint[])
    `;

    let calculatedTotalUSD = 0;
    const orderItemsData: {
      product_id: number;
      product_title: string;
      product_image: string | null;
      quantity: number;
      unit_price: number;
    }[] = [];

    for (const clientItem of items) {
      const dbProduct = (dbProducts as Record<string, unknown>[]).find(
        (p) => Number(p.id) === clientItem.id
      );
      if (!dbProduct) throw new Error(`Товар ${clientItem.title} не знайдено`);

      const price = Number(dbProduct.price);
      const itemTotal = price * clientItem.quantity;
      calculatedTotalUSD += itemTotal;

      orderItemsData.push({
        product_id: Number(dbProduct.id),
        product_title: String(dbProduct.title),
        product_image: Array.isArray(dbProduct.images) && dbProduct.images.length > 0
          ? String((dbProduct.images as string[])[0])
          : null,
        quantity: clientItem.quantity,
        unit_price: price,
      });
    }

    const shippingCost = shippingType === 'Express' ? FLAT_SHIPPING_USD * 2 : FLAT_SHIPPING_USD;
    const finalAmountUSD = calculatedTotalUSD + shippingCost;

    // 2. Створюємо замовлення в Neon
    const userId = (shippingAddress.user_id as string) || null;
    const email = (shippingAddress.email as string) || '';

    const orderRows = await sql`
      INSERT INTO orders (user_id, email, status, total, currency, payment_method, shipping_address, notes)
      VALUES (
        ${userId ? userId : null}::uuid,
        ${email},
        'pending',
        ${finalAmountUSD},
        'USD',
        'paypal',
        ${JSON.stringify({ ...shippingAddress, shipping_type: shippingType, shipping_cost: shippingCost })}::jsonb,
        ${`Shipping: ${shippingType}`}
      )
      RETURNING id
    `;
    const orderId = Number((orderRows as Record<string, unknown>[])[0].id);

    // 3. Items
    for (const item of orderItemsData) {
      await sql`
        INSERT INTO order_items (order_id, product_id, product_title, product_image, quantity, unit_price)
        VALUES (${orderId}, ${item.product_id}, ${item.product_title}, ${item.product_image}, ${item.quantity}, ${item.unit_price})
      `;
    }

    // 4. PayPal
    const accessToken = await generateAccessToken();
    const payload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: String(orderId),
          amount: { currency_code: 'USD', value: finalAmountUSD.toFixed(2) },
          description: `EcoShop order #${orderId}`,
        },
      ],
      application_context: {
        brand_name: 'EcoShop',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
        return_url: `${getBaseUrl()}/order/result`,
        cancel_url: `${getBaseUrl()}/cart`,
      },
    };

    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const orderData = await response.json();
    if (!response.ok) {
      console.error('PayPal error:', orderData);
      throw new Error(JSON.stringify(orderData));
    }
    return NextResponse.json({ id: orderData.id, orderId });
  } catch (error) {
    console.error('PayPal Create Order Error:', error);
    const message = error instanceof Error ? error.message : 'Error creating order';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
