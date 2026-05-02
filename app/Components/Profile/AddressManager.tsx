'use client';

import { useState, useEffect } from 'react';
import { addressService } from '@/app/[locale]/services/adressService';
import { toast } from 'sonner';
import { MapPin, Plus, Trash2, Check, Star } from 'lucide-react';
import { Address, AddressFormData } from '../../types/address';
import AddressForm from './AddressForm';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

interface AddressManagerProps {
  userId: string;
  userPhone?: string;
}

export default function AddressManager({
  userId,
  userPhone,
}: AddressManagerProps) {
  const t = useTranslations('Profile');

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  const loadAddresses = async () => {
    setLoading(true);
    const data = await addressService.getAddresses(userId);
    setAddresses(data);
    setLoading(false);
  };

  useEffect(() => {
    loadAddresses();
  }, [userId]);

  const handleSave = async (data: AddressFormData) => {
    // --- ПЕРЕВІРКА НА КРАЇНИ-АГРЕСОРИ ---
    const blockedCodes = ['RU', 'BY'];
    const blockedNames = [
      'Russia',
      'Belarus',
      'Russian Federation',
      'Росія',
      'Білорусь',
      'Россия',
      'Беларусь',
    ];

    if (
      (data.country_code && blockedCodes.includes(data.country_code)) ||
      blockedNames.some((name) =>
        data.country_name.toLowerCase().includes(name.toLowerCase())
      )
    ) {
      toast.error('Доставка в країни-агресори не здійснюється 🇺🇦');
      return;
    }
    // ------------------------------------

    const newAddress = await addressService.addAddress(userId, data);
    if (newAddress) {
      toast.success(t('AddressManager.toasts.addSuccess'));
      setIsAdding(false);
      loadAddresses();
    } else {
      toast.error(t('AddressManager.toasts.addError'));
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm(t('AddressManager.confirmDelete'))) {
      const success = await addressService.deleteAddress(userId, id);
      if (success) {
        setAddresses((prev) => prev.filter((a) => a.id !== id));
        toast.success(t('AddressManager.toasts.deleteSuccess'));
      } else {
        toast.error(t('AddressManager.toasts.deleteError'));
      }
    }
  };

  const handleSetDefault = async (id: number) => {
    const success = await addressService.setDefaultAddress(userId, id);
    if (success) {
      toast.success(t('AddressManager.toasts.setDefaultSuccess'));
      loadAddresses();
    }
  };

  return (
    <div className="bg-card rounded-2xl shadow-lg border border-border p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <MapPin className="w-6 h-6" />
          {t('AddressManager.title')}
        </h2>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white dark:bg-white dark:text-black text-sm font-medium rounded-lg hover:opacity-90 transition-colors cursor-pointer"
          >
            <Plus size={16} />
            {t('AddressManager.addButton')}
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isAdding ? (
          <AddressForm
            key="form"
            onSave={handleSave}
            onCancel={() => setIsAdding(false)}
            defaultPhone={userPhone}
          />
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-24 bg-muted rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : addresses.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center bg-muted/50 rounded-xl border-2 border-dashed border-border">
                <MapPin className="w-12 h-12 mx-auto mb-4 opacity-30 text-gray-500" />
                <p className="text-muted-foreground text-center">
                  {t('AddressManager.emptyStateTitle')}
                  <br />
                  {t('AddressManager.emptyStateDesc')}
                </p>
              </div>
            ) : (
              addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`relative p-5 rounded-xl border transition-all duration-200 group ${
                    addr.is_default
                      ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-900/10 dark:border-blue-500/50 shadow-sm'
                      : 'border-border bg-white dark:bg-neutral-800 hover:border-gray-300 dark:hover:border-neutral-600'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-foreground">
                          {addr.country_name}, {addr.city}
                        </span>
                        {addr.is_default && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full flex items-center gap-1">
                            <Check size={12} />{' '}
                            {t('AddressManager.defaultBadge')}
                          </span>
                        )}
                      </div>

                      <p className="text-gray-600 dark:text-gray-300">
                        {addr.address_line1}
                        {addr.address_line2 && `, ${addr.address_line2}`}
                      </p>

                      {addr.state_name && (
                        <p className="text-sm text-muted-foreground">
                          {addr.state_name}
                        </p>
                      )}

                      <div className="flex items-center gap-4 pt-2 text-sm text-muted-foreground">
                        <span className="font-mono bg-gray-100 dark:bg-neutral-700 px-2 py-0.5 rounded">
                          {addr.postal_code}
                        </span>
                        <span>{addr.phone}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!addr.is_default && (
                        <button
                          onClick={() => handleSetDefault(addr.id)}
                          className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                          title={t('AddressManager.setAsDefaultTooltip')}
                        >
                          <Star size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(addr.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                        title={t('AddressManager.deleteTooltip')}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
