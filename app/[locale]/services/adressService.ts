import { Address, AddressFormData } from '../../types/address';

/**
 * Address service — клієнтський. Усі виклики йдуть через `/api/addresses`.
 */
export const addressService = {
  async getAddresses(userId: string): Promise<Address[]> {
    try {
      const res = await fetch(`/api/addresses?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) return [];
      return (await res.json()) as Address[];
    } catch (e) {
      console.error('getAddresses failed:', e);
      return [];
    }
  },

  async addAddress(userId: string, address: AddressFormData): Promise<Address | null> {
    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...address }),
      });
      if (!res.ok) return null;
      return (await res.json()) as Address;
    } catch (e) {
      console.error('addAddress failed:', e);
      return null;
    }
  },

  async deleteAddress(userId: string, id: number): Promise<boolean> {
    try {
      const res = await fetch('/api/addresses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, addressId: id }),
      });
      return res.ok;
    } catch (e) {
      console.error('deleteAddress failed:', e);
      return false;
    }
  },

  async setDefaultAddress(userId: string, addressId: number): Promise<boolean> {
    try {
      const res = await fetch('/api/addresses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, addressId, setDefault: true }),
      });
      return res.ok;
    } catch (e) {
      console.error('setDefaultAddress failed:', e);
      return false;
    }
  },
};
