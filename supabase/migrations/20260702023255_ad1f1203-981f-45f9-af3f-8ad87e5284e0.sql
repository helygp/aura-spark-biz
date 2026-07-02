
-- ============= business_hours table =============
CREATE TABLE public.business_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  weekday INT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  open_time TIME NOT NULL DEFAULT '09:00',
  close_time TIME NOT NULL DEFAULT '19:00',
  is_open BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, weekday)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_hours TO authenticated;
GRANT SELECT ON public.business_hours TO anon;
GRANT ALL ON public.business_hours TO service_role;

ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view business hours"
  ON public.business_hours FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Members can view business hours"
  ON public.business_hours FOR SELECT
  TO authenticated
  USING (is_business_member(auth.uid(), business_id) OR is_business_owner(auth.uid(), business_id));

CREATE POLICY "Owners can manage business hours"
  ON public.business_hours FOR ALL
  TO authenticated
  USING (is_business_owner(auth.uid(), business_id))
  WITH CHECK (is_business_owner(auth.uid(), business_id));

CREATE TRIGGER update_business_hours_updated_at
  BEFORE UPDATE ON public.business_hours
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-populate default hours when a new business is created
CREATE OR REPLACE FUNCTION public.create_default_business_hours()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.business_hours (business_id, weekday, open_time, close_time, is_open) VALUES
    (NEW.id, 0, '09:00', '19:00', false), -- Domingo fechado
    (NEW.id, 1, '09:00', '19:00', true),  -- Segunda
    (NEW.id, 2, '09:00', '19:00', true),  -- Terça
    (NEW.id, 3, '09:00', '19:00', true),  -- Quarta
    (NEW.id, 4, '09:00', '19:00', true),  -- Quinta
    (NEW.id, 5, '09:00', '19:00', true),  -- Sexta
    (NEW.id, 6, '09:00', '19:00', true);  -- Sábado
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_business_created_add_hours
  AFTER INSERT ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.create_default_business_hours();

-- Backfill existing businesses so nothing breaks
INSERT INTO public.business_hours (business_id, weekday, open_time, close_time, is_open)
SELECT b.id, w.weekday, '09:00'::time, '19:00'::time,
  CASE WHEN w.weekday = 0 THEN false ELSE true END
FROM public.businesses b
CROSS JOIN (VALUES (0),(1),(2),(3),(4),(5),(6)) AS w(weekday)
ON CONFLICT (business_id, weekday) DO NOTHING;

-- ============= appointments.source =============
ALTER TABLE public.appointments
  ADD COLUMN source TEXT NOT NULL DEFAULT 'manual'
  CHECK (source IN ('manual','web','whatsapp'));
