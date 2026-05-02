import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD,
  },
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body;

    if (!email || !message) {
      return NextResponse.json(
        { error: 'Email and message are required' },
        { status: 400 }
      );
    }

    const emailHtml = `
      <div style="font-family: sans-serif;">
        <h2>Нове звернення з сайту EcoShop</h2>
        <p><strong>Ім'я:</strong> ${name}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        <p><strong>Тема:</strong> ${subject}</p>
        <hr />
        <h3>Повідомлення:</h3>
        <p style="background-color: #f4f4f4; padding: 15px; border-radius: 5px;">${message}</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"EcoShop Contact Form" <${process.env.GMAIL_USER}>`, // Від кого (твій бот/сайт)
      to: ADMIN_EMAIL, // Кому (тобі)
      replyTo: email, // Куди піде відповідь, якщо ти натиснеш "Відповісти"
      subject: `Нове повідомлення: ${subject || 'Без теми'}`,
      html: emailHtml,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Contact Form Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}