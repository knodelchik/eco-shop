'use client';

import { useState, useEffect } from 'react';
import Select from 'react-select';
import { Country, State } from 'country-state-city';
import { useTranslations } from 'next-intl';
import { AddressFormData } from '../../types/address';
import { motion } from 'framer-motion';

// Стилі для react-select (темна/світла тема)
const customStyles = (isDark: boolean) => ({
  control: (base: any, state: any) => ({
    ...base,
    background: isDark ? '#171717' : '#ffffff',
    borderColor: isDark ? '#404040' : '#e5e7eb',
    color: isDark ? '#ffffff' : '#000000',
    padding: '4px',
    borderRadius: '0.5rem',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : 'none',
    '&:hover': {
      borderColor: isDark ? '#525252' : '#d1d5db',
    },
  }),
  menu: (base: any) => ({
    ...base,
    background: isDark ? '#171717' : '#ffffff',
    border: isDark ? '1px solid #404040' : '1px solid #e5e7eb',
  }),
  option: (base: any, state: any) => ({
    ...base,
    background: state.isFocused
      ? isDark
        ? '#262626'
        : '#f3f4f6'
      : 'transparent',
    color: isDark ? '#ffffff' : '#000000',
    cursor: 'pointer',
  }),
  singleValue: (base: any) => ({
    ...base,
    color: isDark ? '#ffffff' : '#000000',
  }),
  input: (base: any) => ({
    ...base,
    color: isDark ? '#ffffff' : '#000000',
  }),
});

interface AddressFormProps {
  onSave: (data: AddressFormData) => void;
  onCancel: () => void;
  defaultPhone?: string;
}

export default function AddressForm({
  onSave,
  onCancel,
  defaultPhone = '',
}: AddressFormProps) {
  const t = useTranslations('Profile');
  const isDark =
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark');

  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [selectedState, setSelectedState] = useState<any>(null);
  const [states, setStates] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    city: '',
    address_line1: '',
    address_line2: '',
    postal_code: '',
    phone: defaultPhone || '',
    is_default: false,
  });

  // --- БЛОКУВАННЯ КРАЇН У СПИСКУ ---
  const BLOCKED_COUNTRIES = ['RU', 'BY']; // Росія, Білорусь

  const countries = Country.getAllCountries()
    .filter((c) => !BLOCKED_COUNTRIES.includes(c.isoCode)) // Фільтруємо агресорів
    .map((c) => ({
      label: c.name,
      value: c.isoCode,
    }));

  useEffect(() => {
    if (selectedCountry) {
      const countryStates = State.getStatesOfCountry(selectedCountry.value).map(
        (s) => ({ label: s.name, value: s.isoCode })
      );
      setStates(countryStates);
      setSelectedState(null);
    } else {
      setStates([]);
    }
  }, [selectedCountry]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCountry) return;

    onSave({
      country_code: selectedCountry.value,
      country_name: selectedCountry.label,
      state_code: selectedState?.value || '',
      state_name: selectedState?.label || '',
      ...formData,
    });
  };

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      onSubmit={handleSubmit}
      className="space-y-4 p-6 bg-muted/50 rounded-xl border border-border mt-6"
    >
      <h3 className="font-bold text-lg text-foreground mb-4">
        {t('AddressForm.title')}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            {t('AddressForm.countryLabel')}
          </label>
          <Select
            options={countries}
            value={selectedCountry}
            onChange={setSelectedCountry}
            placeholder={t('AddressForm.selectCountryPlaceholder')}
            styles={customStyles(isDark)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            {t('AddressForm.stateLabel')}
          </label>
          <Select
            options={states}
            value={selectedState}
            onChange={setSelectedState}
            placeholder={
              states.length > 0
                ? t('AddressForm.selectRegionPlaceholder')
                : t('AddressForm.noRegionsPlaceholder')
            }
            isDisabled={states.length === 0}
            styles={customStyles(isDark)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            {t('AddressForm.cityLabel')}
          </label>
          <input
            type="text"
            required
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-neutral-600 rounded-lg bg-card text-foreground focus:ring-2 focus:ring-primary outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            {t('AddressForm.postalCodeLabel')}
          </label>
          <input
            type="text"
            required
            value={formData.postal_code}
            onChange={(e) =>
              setFormData({ ...formData, postal_code: e.target.value })
            }
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-neutral-600 rounded-lg bg-card text-foreground focus:ring-2 focus:ring-primary outline-none transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          {t('AddressForm.addressLine1Label')}
        </label>
        <input
          type="text"
          required
          placeholder={t('AddressForm.addressLine1Placeholder')}
          value={formData.address_line1}
          onChange={(e) =>
            setFormData({ ...formData, address_line1: e.target.value })
          }
          className="w-full px-4 py-2.5 border border-gray-300 dark:border-neutral-600 rounded-lg bg-card text-foreground focus:ring-2 focus:ring-primary outline-none transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          {t('AddressForm.addressLine2Label')}
        </label>
        <input
          type="text"
          placeholder={t('AddressForm.addressLine2Placeholder')}
          value={formData.address_line2}
          onChange={(e) =>
            setFormData({ ...formData, address_line2: e.target.value })
          }
          className="w-full px-4 py-2.5 border border-gray-300 dark:border-neutral-600 rounded-lg bg-card text-foreground focus:ring-2 focus:ring-primary outline-none transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          {t('AddressForm.phoneLabel')}
        </label>
        <input
          type="tel"
          required
          placeholder={t('AddressForm.phonePlaceholder')}
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-300 dark:border-neutral-600 rounded-lg bg-card text-foreground focus:ring-2 focus:ring-primary outline-none transition-all"
        />
        <p className="text-xs text-gray-500 mt-1 ml-1">
          {t('AddressForm.phoneHelperText')}
        </p>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <input
          type="checkbox"
          id="is_default"
          checked={formData.is_default}
          onChange={(e) =>
            setFormData({ ...formData, is_default: e.target.checked })
          }
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-primary cursor-pointer"
        />
        <label
          htmlFor="is_default"
          className="text-sm text-foreground cursor-pointer"
        >
          {t('AddressForm.setDefaultLabel')}
        </label>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity cursor-pointer"
        >
          {t('AddressForm.saveButton')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 border border-gray-300 dark:border-neutral-600 text-foreground rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
        >
          {t('AddressForm.cancelButton')}
        </button>
      </div>
    </motion.form>
  );
}
