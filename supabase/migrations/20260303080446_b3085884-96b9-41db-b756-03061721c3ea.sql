
-- Add SKU column
ALTER TABLE public.products ADD COLUMN sku text;

-- Create unique index on sku
CREATE UNIQUE INDEX idx_products_sku ON public.products (sku);

-- Create a function to auto-generate SKU for new products
CREATE OR REPLACE FUNCTION public.generate_product_sku()
RETURNS TRIGGER AS $$
DECLARE
  max_num integer;
  new_sku text;
BEGIN
  -- Only generate if SKU is not provided
  IF NEW.sku IS NULL OR NEW.sku = '' THEN
    SELECT COALESCE(MAX(
      CASE 
        WHEN sku ~ '^CLT[0-9]+$' THEN CAST(SUBSTRING(sku FROM 4) AS integer)
        ELSE 0
      END
    ), 0) INTO max_num
    FROM public.products;
    
    new_sku := 'CLT' || LPAD((max_num + 1)::text, 3, '0');
    NEW.sku := new_sku;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger
CREATE TRIGGER trg_generate_sku
BEFORE INSERT ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.generate_product_sku();
