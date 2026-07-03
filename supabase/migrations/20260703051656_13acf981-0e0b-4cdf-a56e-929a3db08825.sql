
CREATE TABLE public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  professional_id uuid REFERENCES public.professionals(id) ON DELETE SET NULL,
  subtotal numeric NOT NULL DEFAULT 0,
  commission_pct numeric NOT NULL DEFAULT 0,
  commission_amount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('card','cash','pix')),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO authenticated;
GRANT ALL ON public.sales TO service_role;

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business members can view sales"
ON public.sales FOR SELECT
USING (is_business_member(auth.uid(), business_id) OR is_business_owner(auth.uid(), business_id));

CREATE POLICY "Business owners can manage sales"
ON public.sales FOR ALL
USING (is_business_owner(auth.uid(), business_id));

CREATE INDEX idx_sales_business ON public.sales(business_id);
CREATE INDEX idx_sales_created_at ON public.sales(created_at);

CREATE TABLE public.sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('service','product')),
  item_id uuid NOT NULL,
  name text NOT NULL,
  price numeric NOT NULL,
  quantity integer NOT NULL DEFAULT 1
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_items TO authenticated;
GRANT ALL ON public.sale_items TO service_role;

ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business members can view sale_items"
ON public.sale_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.sales s
  WHERE s.id = sale_items.sale_id
    AND (is_business_member(auth.uid(), s.business_id) OR is_business_owner(auth.uid(), s.business_id))
));

CREATE POLICY "Business owners can manage sale_items"
ON public.sale_items FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.sales s
  WHERE s.id = sale_items.sale_id
    AND is_business_owner(auth.uid(), s.business_id)
));

CREATE INDEX idx_sale_items_sale ON public.sale_items(sale_id);
