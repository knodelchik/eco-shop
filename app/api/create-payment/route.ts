import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon-db';
import { createMonoInvoice } from '../../lib/monobank';
import { generateAccessToken, PAYPAL_API_BASE } from '../../lib/paypal';
import { getBaseUrl } from '@/lib/base-url';

const FLAT_SHIPPING_USD = 5;

interface ClientItem {
  id: number;
  title?: string;
  quantity: number;
}

async function getExchangeRate(): Promise<number> {
  try {
    const res = await fetch(
      'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&json',
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    return data[0]?.rate || 42.0;
  } catch (e) {
    console.error('Failed to fetch exchange rate:', e);
    return 42.0;
  }
}

export async function POST(req: Request) {
  try {
    const BASE_URL = getBaseUrl();
    const body = await req.json();
    const { items, shippingAddress, shippingType, method } = body as {
      items: ClientItem[];
      shippingAddress: Record<string, unknown>;
      shippingType: string;
      method: 'paypal' | 'monobank' | 'fondy';
    };

    if (!items?.length) {
      return NextResponse.json({ error: 'Кошик порожній' }, { status: 400 });
    }
    if (!shippingAddress) {
      return NextResponse.json({ error: 'Немає адреси доставки' }, { status: 400 });
    }

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
      if (!dbProduct) {
        return NextResponse.json(
          { error: `Товар з ID ${clientItem.id} не знайдено` },
          { status: 400 }
        );
      }
      const quantity = Number(clientItem.quantity);
      if (quantity <= 0) continue;

      const price = Number(dbProduct.price);
      calculatedTotalUSD += price * quantity;

      orderItemsData.push({
        product_id: Number(dbProduct.id),
        product_title: String(dbProduct.title),
        product_image:
          Array.isArray(dbProduct.images) && dbProduct.images.length > 0
            ? String((dbProduct.images as string[])[0])
            : null,
        quantity,
        unit_price: price,
      });
    }

    const countryCode = String(
      (shippingAddress.country_code as string | undefined) ?? ''
    ).trim().toUpperCase();

    let shippingCost = shippingType === 'Express'
      ? FLAT_SHIPPING_USD * 2
      : FLAT_SHIPPING_USD;
    if (countryCode) {
      try {
        const rows = await sql`
          SELECT standard_price, express_price FROM delivery_settings
          WHERE country_code = ${countryCode} LIMIT 1
        `;
        const row = (rows as Record<string, unknown>[])[0];
        if (row) {
          const std = Number(row.standard_price);
          const exp = Number(row.express_price);
          if (Number.isFinite(std) && Number.isFinite(exp)) {
            shippingCost = shippingType === 'Express' ? exp : std;
          }
        }
      } catch (e) {
        console.warn('delivery_settings lookup failed, using flat-rate:', e);
      }
    }
    const finalAmountUSD = calculatedTotalUSD + shippingCost;

    const userId = (shippingAddress.user_id as string) ?? null;
    const email = (shippingAddress.email as string) ?? '';
    const methodForDb = method === 'fondy' ? 'monobank' : method;

    const orderRows = await sql`
      INSERT INTO orders (user_id, email, status, total, currency, payment_method, shipping_address, notes)
      VALUES (
        ${userId ? userId : null}::uuid,
        ${email},
        'pending',
        ${finalAmountUSD},
        'USD',
        ${methodForDb},
        ${JSON.stringify({
          ...shippingAddress,
          shipping_type: shippingType,
          shipping_cost: shippingCost,
        })}::jsonb,
        ${`Shipping: ${shippingType}`}
      )
      RETURNING id
    `;
    const orderId = Number((orderRows as Record<string, unknown>[])[0].id);

    for (const item of orderItemsData) {
      await sql`
        INSERT INTO order_items (order_id, product_id, product_title, product_image, quantity, unit_price)
        VALUES (${orderId}, ${item.product_id}, ${item.product_title}, ${item.product_image}, ${item.quantity}, ${item.unit_price})
      `;
    }

    if (method === 'paypal') {
      const accessToken = await generateAccessToken();
      const payload = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: String(orderId),
            amount: { currency_code: 'USD', value: finalAmountUSD.toFixed(2) },
          },
        ],
        payment_source: {
          paypal: {
            experience_context: {
              brand_name: 'EcoShop',
              user_action: 'PAY_NOW',
              return_url: `${BASE_URL}/order/result?source=paypal&orderId=${orderId}`,
              cancel_url: `${BASE_URL}/order?status=cancelled`,
            },
          },
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
        console.error('PayPal Error:', orderData);
        throw new Error('Помилка створення платежу PayPal');
      }
      return NextResponse.json({ id: orderData.id, internalOrderId: orderId });
    }

    const rate = await getExchangeRate();
    const amountInCents = Math.round(finalAmountUSD * rate * 100);
    const productsNames = orderItemsData
      .map((i) => `${i.product_title} x${i.quantity}`)
      .join(', ')
      .substring(0, 250);

    const invoiceData = await createMonoInvoice({
      order_id: String(orderId),
      amount: amountInCents,
      ccy: 980,
      redirectUrl: `${BASE_URL}/order/result?source=monobank&orderId=${orderId}`,
      webHookUrl: `${BASE_URL}/api/payment-webhook?secret=${process.env.MONOBANK_WEBHOOK_SECRET}`,
      productName: productsNames || 'EcoShop order',
    });

    if (!invoiceData?.pageUrl) {
      throw new Error('Не вдалося отримати посилання на оплату від Monobank');
    }
    return NextResponse.json({ payment_url: invoiceData.pageUrl });
  } catch (error) {
    console.error('Create Payment Error:', error);
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
