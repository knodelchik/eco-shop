'use client';

import { Leaf, Package, MapPin, Truck } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function ValuesStrip() {
  const t = useTranslations('Common');
  const VALUES = [
    { icon: Leaf, title: t('biodegradableMaterials'), text: t('biodegradableDesc') },
    { icon: Package, title: t('noPlasticPackaging'), text: t('noPlasticDesc') },
    { icon: MapPin, title: t('ukrainianMakers'), text: t('ukrainianDesc') },
    { icon: Truck, title: t('carbonNeutralShipping'), text: t('carbonNeutralDesc') },
  ];

  return (
    <section className="bg-muted/40 border-y border-border">
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {VALUES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Icon className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
