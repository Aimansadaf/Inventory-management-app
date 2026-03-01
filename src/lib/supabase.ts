export { supabase } from '@/integrations/supabase/client';

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
