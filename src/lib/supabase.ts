import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  discount: number;
  created_at: string;
};

export const CATEGORIES = ['T-Shirts', 'Hoodies', 'Jackets', 'Dresses', 'Accessories'] as const;

export function getFinalPrice(price: number, discount: number): number {
  return price - (price * discount / 100);
}
