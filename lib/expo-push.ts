/**
 * Expo Push API клієнт.
 *
 * Відсилає push-нотифікації через https://exp.host/--/api/v2/push/send.
 * Не вимагає auth — лише валідного `to` (ExponentPushToken[...]).
 *
 * Для production (>2k повідомлень/день) Expo рекомендує chunking по 100.
 * Тут робимо простий single-fetch — для курсової демо стартує замовлень
 * не буде стільки.
 */
import 'server-only';

export interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
}

const EXPO_API = 'https://exp.host/--/api/v2/push/send';

export async function sendExpoPush(messages: ExpoPushMessage[]): Promise<void> {
  if (messages.length === 0) return;

  // Фільтруємо лише валідні Expo-токени.
  const valid = messages.filter(
    (m) => typeof m.to === 'string' && /^ExponentPushToken\[/.test(m.to)
  );
  if (valid.length === 0) return;

  try {
    const res = await fetch(EXPO_API, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(valid.map((m) => ({ ...m, sound: m.sound ?? 'default' }))),
    });
    if (!res.ok) {
      console.error('Expo push HTTP error:', res.status, await res.text());
    }
  } catch (e) {
    console.error('Expo push fetch failed:', e);
  }
}
