export interface Address {
  id: number;
  user_id: string;
  country_code: string;
  country_name: string;
  state_code?: string;
  state_name?: string;
  city: string;
  address_line1: string;
  address_line2?: string;
  postal_code: string;
  phone: string;
  is_default: boolean;
}

export interface AddressFormData {
  country_code: string;
  country_name: string;
  state_code: string;
  state_name: string;
  city: string;
  address_line1: string;
  address_line2: string;
  postal_code: string;
  phone: string;
  is_default: boolean;
}