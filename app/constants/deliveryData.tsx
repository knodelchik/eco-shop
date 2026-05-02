import React from 'react';
import { Globe, Skull } from 'lucide-react';

// Типи
export interface DeliveryOption {
  service: string;
  price: number | 'Free' | 'N/A';
  time: string;
  emoji: React.ReactNode;
  serviceKey?: string;
  timeKey?: string;
}

export interface DeliveryCost {
  [key: string]: DeliveryOption[];
}

// Дані (ті самі, що ви надали, але експортовані)
export const DELIVERY_DATA: DeliveryCost = {
  UA: [
    {
      service: 'Standard (UkrPoshta)',
      serviceKey: 'options.uaStandard.name',
      price: 'Free',
      time: '3-5 days',
      timeKey: 'options.uaStandard.time',
      emoji: '🇺🇦',
    },
    {
      service: 'Express (Nova Poshta)',
      serviceKey: 'options.uaExpress.name',
      price: 'Free',
      time: '1-2 days',
      timeKey: 'options.uaExpress.time',
      emoji: '🚀',
    },
  ],
  DE: [
    {
      service: 'Standard (DHL/DPD)',
      serviceKey: 'options.deStandard.name',
      price: 15,
      time: '7-14 days',
      timeKey: 'options.deStandard.time',
      emoji: '💶',
    },
    {
      service: 'Express (FedEx)',
      serviceKey: 'options.deExpress.name',
      price: 35,
      time: '3-5 days',
      timeKey: 'options.deExpress.time',
      emoji: '🚀',
    },
  ],
  FR: [
    {
      service: 'Standard (La Poste)',
      serviceKey: 'options.frStandard.name',
      price: 18,
      time: '8-15 days',
      timeKey: 'options.frStandard.time',
      emoji: '🇫🇷',
    },
    {
      service: 'Express (DHL)',
      serviceKey: 'options.frExpress.name',
      price: 40,
      time: '3-5 days',
      timeKey: 'options.frExpress.time',
      emoji: '🚀',
    },
  ],
  US: [
    {
      service: 'Standard (USPS)',
      serviceKey: 'options.uspsStandard.name',
      price: 20,
      time: '7-14 days',
      timeKey: 'options.uspsStandard.time',
      emoji: '💵',
    },
    {
      service: 'Express (UPS)',
      serviceKey: 'options.usExpress.name',
      price: 45,
      time: '3-5 days',
      timeKey: 'options.usExpress.time',
      emoji: '🚀',
    },
  ],
  CA: [
    {
      service: 'Standard (Canada Post)',
      serviceKey: 'options.caStandard.name',
      price: 25,
      time: '10-18 days',
      timeKey: 'options.caStandard.time',
      emoji: '🇨🇦',
    },
    {
      service: 'Express (FedEx)',
      serviceKey: 'options.caExpress.name',
      price: 50,
      time: '4-7 days',
      timeKey: 'options.caExpress.time',
      emoji: '🚀',
    },
  ],
  JP: [
    {
      service: 'International Standard',
      serviceKey: 'options.jpStandard.name',
      price: 30,
      time: '10-20 days',
      timeKey: 'options.jpStandard.time',
      emoji: '🇯🇵',
    },
    {
      service: 'International Express',
      serviceKey: 'options.jpExpress.name',
      price: 60,
      time: '5-8 days',
      timeKey: 'options.jpExpress.time',
      emoji: '✈️',
    },
  ],
  ROW: [
    {
      service: 'Global Standard',
      serviceKey: 'options.globalStandard.name',
      price: 40,
      time: '10-30 days',
      timeKey: 'options.globalStandard.time',
      emoji: <Globe className="w-5 h-5 text-gray-500" />,
    },
    {
      service: 'Global Express',
      serviceKey: 'options.globalExpress.name',
      price: 85,
      time: '5-15 days',
      timeKey: 'options.globalExpress.time',
      emoji: '✈️',
    },
  ],
  RU: [
    {
      service: 'Unavailable',
      serviceKey: 'options.ruUnavailable.name',
      price: 'N/A',
      time: 'N/A',
      timeKey: 'options.ruUnavailable.time',
      emoji: <Skull className="w-5 h-5" />,
    },
  ],
  BY: [
    {
      service: 'Unavailable',
      serviceKey: 'options.ruUnavailable.name',
      price: 'N/A',
      time: 'N/A',
      timeKey: 'options.ruUnavailable.time',
      emoji: <Skull className="w-5 h-5" />,
    },
  ],
};

// Хелпер для отримання вартості (повертає число або 0 для Free, або null для N/A)
export const getShippingPrice = (countryCode: string, type: 'Standard' | 'Express' = 'Standard'): number | null => {
  const options = DELIVERY_DATA[countryCode] || DELIVERY_DATA['ROW'];
  
  // Шукаємо опцію, яка містить тип сервісу (Standard або Express)
  const option = options.find(opt => opt.service.toLowerCase().includes(type.toLowerCase())) || options[0];

  if (!option) return 0;
  if (option.price === 'N/A') return null; // Доставка недоступна
  if (option.price === 'Free') return 0;
  return option.price as number;
};