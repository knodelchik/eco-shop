// app/lib/paypal.ts

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_ENVIRONMENT, NEXT_PUBLIC_PAYPAL_CLIENT_ID } = process.env;

// Логіка: Якщо явно написано 'production' -> Production API. В усіх інших випадках -> Sandbox API.
export const PAYPAL_API_BASE = PAYPAL_ENVIRONMENT === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

/**
 * Генерує Access Token для запитів до API
 */
export async function generateAccessToken() {
  // Пробуємо знайти Client ID у серверній змінній, якщо немає - беремо публічну
  const clientId = PAYPAL_CLIENT_ID || NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("MISSING_CREDS: Відсутні PAYPAL_CLIENT_ID або PAYPAL_CLIENT_SECRET у змінних середовища.");
  }

  // Кодуємо ключі у формат Basic Auth
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  console.log(`🔌 Connecting to PayPal (${PAYPAL_ENVIRONMENT === 'production' ? 'Live' : 'Sandbox'})...`);

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    body: "grant_type=client_credentials",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  const data = await response.json();

  // ПЕРЕВІРКА ПОМИЛКИ: Якщо PayPal відмовив в авторизації (напр. неправильні ключі)
  if (!response.ok) {
    console.error("❌ PayPal Token Error:", data);
    throw new Error(`PayPal Auth Failed: ${data.error_description || data.error || response.statusText}`);
  }

  return data.access_token;
}