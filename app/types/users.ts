export type User = {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    country?: string;
    zip_code?: string;
  };
  created_at?: string;
  updated_at?: string;
  email_confirmed_at?: string | null;
  role?: 'user' | 'admin' | null;
};

export type AuthFormData = {
  email: string;
  password: string;
  full_name?: string;
  lang?: string;
};
