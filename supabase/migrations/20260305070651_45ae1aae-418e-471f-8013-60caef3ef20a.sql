
-- Create sales table
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  sku TEXT,
  category TEXT,
  original_price NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  final_price NUMERIC NOT NULL DEFAULT 0,
  sold_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Admin can do everything on sales
CREATE POLICY "Admins can read all sales" ON public.sales
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert sales" ON public.sales
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update sales" ON public.sales
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete sales" ON public.sales
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Staff can insert sales (for selling items)
CREATE POLICY "Staff can insert sales" ON public.sales
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'staff'));

-- Staff can read their own sales
CREATE POLICY "Staff can read own sales" ON public.sales
  FOR SELECT TO authenticated
  USING (sold_by = (SELECT email FROM public.profiles WHERE id = auth.uid()));
