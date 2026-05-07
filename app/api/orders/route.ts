import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/neon-db';
import { requireOwnUser } from '@/lib/auth-guard';

export async function GET(request: NextRequest) {
  const userId = new URL(request.url).searchParams.get('userId');
  const auth = await requireOwnUser(userId);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const orders = await sql`
      SELECT * FROM orders
      WHERE user_id = ${userId}::uuid
      ORDER BY created_at DESC
    `;

    const orderIds = (orders as Record<string, unknown>[]).map((o) => o.id);
    let items: Record<string, unknown>[] = [];
    if (orderIds.length > 0) {
      const itemRows = await sql`
        SELECT * FROM order_items WHERE order_id = ANY(${orderIds}::bigint[])
      `;
      items = itemRows as Record<string, unknown>[];
    }

    const result = (orders as Record<string, unknown>[]).map((o) => {
      const shipping =
        typeof o.shipping_address === 'object' && o.shipping_address !== null
          ? (o.shipping_address as Record<string, unknown>)
          : {};
      return {
        ...o,
        id: String(o.id),
        total_amount: Number(o.total ?? 0),
        shipping_type: shipping.shipping_type ?? 'Standard',
        shipping_cost: Number(shipping.shipping_cost ?? 0),
        order_items: items
          .filter((i) => Number(i.order_id) === Number(o.id))
          .map((i) => ({
            ...i,
            id: String(i.id),
            image_url: i.product_image,
            price: Number(i.unit_price ?? 0),
          })),
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/orders failed:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

interface CreateOrderItem {
  id: number | string;
  quantity: number;
}

interface CreateOrderBody {
  userId: string;
  email: string;
  items: CreateOrderItem[];
  shippingAddress: Record<string, unknown>;
  paymentMethod?: 'cod' | 'paypal' | 'monobank';
  notes?: string;
  shippingCost?: number;
}

const FLAT_SHIPPING_USD = 5;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<CreateOrderBody>;
    const {
      userId,
      email,
      items,
      shippingAddress,
      paymentMethod = 'cod',
      notes,
      shippingCost = FLAT_SHIPPING_USD,
    } = body;

    const auth = await requireOwnUser(userId);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    if (!email) {
      return NextResponse.json({ error: 'email required' }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'items required' }, { status: 400 });
    }
    if (!shippingAddress || typeof shippingAddress !== 'object') {
      return NextResponse.json({ error: 'shippingAddress required' }, { status: 400 });
    }

    const itemIds = items.map((i) => Number(i.id));
    const dbProducts = (await sql`
      SELECT id, price, title, images, stock FROM products
      WHERE id = ANY(${itemIds}::bigint[])
    `) as Record<string, unknown>[];

    let subtotalUSD = 0;
    const orderItemsData: {
      product_id: number;
      product_title: string;
      product_image: string | null;
      quantity: number;
      unit_price: number;
    }[] = [];

    for (const clientItem of items) {
      const dbProduct = dbProducts.find((p) => Number(p.id) === Number(clientItem.id));
      if (!dbProduct) {
        return NextResponse.json(
          { error: `Товар з ID ${clientItem.id} не знайдено` },
          { status: 400 }
        );
      }
      const quantity = Number(clientItem.quantity);
      if (quantity <= 0) continue;

      const price = Number(dbProduct.price);
      subtotalUSD += price * quantity;

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

    if (orderItemsData.length === 0) {
      return NextResponse.json({ error: 'Жодного валідного товару' }, { status: 400 });
    }

    const productIds = orderItemsData.map((i) => i.product_id);
    const quantities = orderItemsData.map((i) => i.quantity);

    const decremented = (await sql`
      UPDATE products p
      SET stock = p.stock - x.quantity, updated_at = NOW()
      FROM unnest(${productIds}::bigint[], ${quantities}::int[]) AS x(id, quantity)
      WHERE p.id = x.id AND p.stock >= x.quantity
      RETURNING p.id
    `) as Record<string, unknown>[];

    if (decremented.length !== orderItemsData.length) {
      if (decremented.length > 0) {
        const restoredIds = decremented.map((d) => Number(d.id));
        const restoredQtys = restoredIds.map(
          (id) => orderItemsData.find((i) => i.product_id === id)!.quantity
        );
        await sql`
          UPDATE products p
          SET stock = p.stock + x.quantity
          FROM unnest(${restoredIds}::bigint[], ${restoredQtys}::int[]) AS x(id, quantity)
          WHERE p.id = x.id
        `.catch((e) => console.error('stock rollback failed:', e));
      }
      return NextResponse.json(
        { error: 'Недостатньо товару на складі' },
        { status: 409 }
      );
    }

    const totalUSD = subtotalUSD + shippingCost;

    const orderRows = (await sql`
      INSERT INTO orders (user_id, email, status, total, currency, payment_method, shipping_address, notes)
      VALUES (
        ${userId}::uuid,
        ${email},
        'pending',
        ${totalUSD},
        'USD',
        ${paymentMethod},
        ${JSON.stringify({ ...shippingAddress, shipping_cost: shippingCost })}::jsonb,
        ${notes ?? null}
      )
      RETURNING id, created_at, status, total, currency, payment_method
    `) as Record<string, unknown>[];
    const order = orderRows[0];
    const orderId = Number(order.id);

    for (const item of orderItemsData) {
      await sql`
        INSERT INTO order_items (order_id, product_id, product_title, product_image, quantity, unit_price)
        VALUES (${orderId}, ${item.product_id}, ${item.product_title}, ${item.product_image}, ${item.quantity}, ${item.unit_price})
      `;
    }

    return NextResponse.json({
      orderId,
      total: totalUSD,
      currency: 'USD',
      status: order.status,
      created_at: order.created_at,
    });
  } catch (error) {
    console.error('POST /api/orders failed:', error);
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
