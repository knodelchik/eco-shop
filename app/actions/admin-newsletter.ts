'use server';

import { sql } from '@/lib/neon-db';
import nodemailer from 'nodemailer';

const transporter = process.env.GMAIL_USER
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASSWORD },
    })
  : null;

export type Subscriber = {
  id: number;
  email: string;
  lang?: string;
  created_at: string;
};

export type EmailContent = {
  subject: string;
  htmlBody: string;
};

export async function getSubscribers(): Promise<Subscriber[]> {
  try {
    const rows = await sql`
      SELECT id, email, subscribed_at AS created_at
      FROM newsletter
      WHERE unsubscribed_at IS NULL
      ORDER BY subscribed_at DESC
    `;
    return (rows as Record<string, unknown>[]).map((r) => ({
      id: Number(r.id),
      email: String(r.email),
      created_at: String(r.created_at),
    }));
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    return [];
  }
}

export async function deleteSubscriber(id: number) {
  try {
    await sql`DELETE FROM newsletter WHERE id = ${id}`;
    return { success: true };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'unknown');
  }
}

export async function sendBulkEmail(
  contentEn: EmailContent,
  contentUk: EmailContent,
  target: 'all' | 'uk' | 'en'
) {
  if (!transporter) {
    return { success: false, message: 'GMAIL_USER не налаштовано у .env.local' };
  }

  const subscribers = await getSubscribers();
  if (!subscribers.length) {
    return { success: false, message: 'Немає підписників' };
  }

  // У спрощеній схемі ми не зберігаємо мову підписника окремо.
  // Якщо target = 'all' — шлемо EN; якщо 'uk' — UK; інакше EN.
  const emailData = target === 'uk' ? contentUk : contentEn;
  const finalSubject = emailData.subject || 'EcoShop News';
  const finalHtml = emailData.htmlBody || '<p>News from EcoShop</p>';
  const senderName = target === 'uk' ? 'EcoShop Україна' : 'EcoShop Global';

  let sentCount = 0;
  let errorCount = 0;

  await Promise.all(
    subscribers.map(async (sub) => {
      try {
        await transporter.sendMail({
          to: sub.email,
          from: `"${senderName}" <${process.env.GMAIL_USER}>`,
          subject: finalSubject,
          html: finalHtml,
        });
        sentCount++;
      } catch (err) {
        errorCount++;
        console.error(`Failed to send to ${sub.email}:`, err);
      }
    })
  );

  return {
    success: true,
    message: `Відправлено: ${sentCount}, Помилок: ${errorCount}`,
  };
}
