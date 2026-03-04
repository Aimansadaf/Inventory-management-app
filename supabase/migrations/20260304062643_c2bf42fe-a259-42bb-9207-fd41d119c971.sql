
-- Update products table RLS: require authentication for write operations
DROP POLICY IF EXISTS "Allow public insert access" ON public.products;
DROP POLICY IF EXISTS "Allow public update access" ON public.products;
DROP POLICY IF EXISTS "Allow public delete access" ON public.products;

-- Authenticated users can read products
-- Keep public read for now, but restrict write to authenticated
CREATE POLICY "Authenticated users can insert products"
ON public.products FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
ON public.products FOR UPDATE TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete products"
ON public.products FOR DELETE TO authenticated
USING (true);
