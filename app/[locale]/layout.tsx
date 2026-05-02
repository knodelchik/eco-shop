import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { Fraunces, Inter } from 'next/font/google';
import { CurrencyProvider } from '@/app/context/CurrencyContext';
import Header from '../Components/Header/Header';
import Footer from '../Components/Footer';
import AuthErrorListener from '../Components/AuthErrorListener';
import Script from 'next/script';
import '@/app/globals.css';
import type { Metadata } from 'next';

// === ШРИФТИ ===
const fraunces = Fraunces({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-fraunces',
  display: 'swap',
  weight: ['400', '500', '600'],
});

const inter = Inter({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const locales = ['en', 'uk'] as const;
type Locale = (typeof locales)[number];

// === 1. SEO ТА МЕТАДАНІ ===
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const titles: Record<Locale, string> = {
    uk: 'EcoShop — Магазин еко-товарів',
    en: 'EcoShop — Eco-friendly Goods Store',
  };
  const descriptions: Record<Locale, string> = {
    uk: 'Натуральні, біорозкладні та багаторазові товари для свідомого життя — еко-косметика, посуд, побутова хімія, одяг та продукти.',
    en: 'Natural, biodegradable and reusable goods for conscious living — eco-cosmetics, dishware, household chemicals, clothing and food.',
  };

  return {
    title: titles[locale as Locale] || titles.uk,
    description: descriptions[locale as Locale] || descriptions.uk,
    // Явное указание иконок для браузеров
    icons: {
      icon: '/favicon.ico',
      apple: '/apple-icon.png',
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// === 2. ГОЛОВНИЙ LAYOUT ===
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) notFound();

  const messages = await getMessages({ locale });

  // === 3. ДАНІ ДЛЯ GOOGLE (SCHEMA.ORG) ===
  // Це повідомляє Гуглу про ваші соцмережі та правильне лого
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'EcoShop',
    url: 'https://ecoshop.com',
    logo: 'https://ecoshop.com/icon.png', // Логотип для панелі знань
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+380501391539', // Ваш номер (взяв з посилання на телеграм)
      contactType: 'customer service',
    },
    // Ваші соцмережі (взяв з вашого коду ContactSection)
    sameAs: [
      'https://t.me/+380501391539',
      'https://www.youtube.com/@and-1717',
      'https://www.facebook.com/EcoShopK',
      'https://www.instagram.com/_ecoshop/',
    ],
    description: 'Eco-friendly goods store — natural, biodegradable and reusable products for conscious living',
  };

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${fraunces.variable} ${inter.variable}`}
    >
      <body
        className="min-h-screen bg-background text-foreground font-sans"
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <CurrencyProvider>
            <NextIntlClientProvider locale={locale} messages={messages}>
              {/* Слухач помилок авторизації */}
              <AuthErrorListener />

              <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-grow">{children}</main>
                <Toaster richColors position="top-left" />
                <Footer />
              </div>
            </NextIntlClientProvider>
          </CurrencyProvider>
        </ThemeProvider>

        {/* === 4. СКРИПТ ДЛЯ GOOGLE === */}
        <Script
          id="json-ld-org"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
