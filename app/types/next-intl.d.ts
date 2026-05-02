// src/types/next-intl.d.ts

// Імпортуємо фактичний тип ваших перекладів (з translations.ts)
// Припускаємо, що ваші переклади тепер у app/lib/translations.ts
import { translations } from '@/lib/translations';

// Вибираємо тип одного з об'єктів перекладу (наприклад, англійського 'en')
type Messages = typeof translations.en;

// Перевизначаємо тип модуля 'next-intl'
declare global {
  namespace NextIntl {
    // Встановлюємо, що наші повідомлення мають тип Messages
    type Messages = Messages;
  }
}
