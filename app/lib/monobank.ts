// app/lib/monobank.ts

const MONO_API_URL = 'https://api.monobank.ua/api/merchant/invoice/create';
const MONO_TOKEN = process.env.MONOBANK_TOKEN!;

export async function createMonoInvoice(orderData: {
  order_id: string;
  amount: number; // Сума в копійках (або мінімальних одиницях валюти)
  ccy: number; // 980 - UAH, 840 - USD, 978 - EUR
  redirectUrl: string;
  webHookUrl: string;
  productName: string;
}) {
  const payload = {
    amount: orderData.amount,
    ccy: orderData.ccy,
    merchantPaymInfo: {
      reference: orderData.order_id,
      destination: orderData.productName,
      comment: `Замовлення ${orderData.order_id}`,
    },
    redirectUrl: orderData.redirectUrl,
    webHookUrl: orderData.webHookUrl,
    validity: 3600, // Час життя посилання (1 година)
    paymentType: 'debit',
  };

  try {
    const response = await fetch(MONO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Token': MONO_TOKEN,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Monobank API Error:', errorText);
      throw new Error(`Monobank Error: ${response.statusText}`);
    }

    const data = await response.json();
    // data.pageUrl — посилання, куди перенаправити клієнта
    // data.invoiceId — ID інвойсу в системі моно
    return data;
  } catch (error) {
    console.error('Create Invoice Error:', error);
    throw error;
  }
}