
CREATE TABLE public.professional_time_off (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT time_off_valid_range CHECK (end_time > start_time)
);

CREATE INDEX idx_time_off_biz_date ON public.professional_time_off (business_id, date, professional_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_time_off TO authenticated;
GRANT ALL ON public.professional_time_off TO service_role;

ALTER TABLE public.professional_time_off ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view time off"
  ON public.professional_time_off FOR SELECT TO authenticated
  USING (public.is_business_member(auth.uid(), business_id) OR public.is_business_owner(auth.uid(), business_id));

CREATE POLICY "Members can insert time off"
  ON public.professional_time_off FOR INSERT TO authenticated
  WITH CHECK (public.is_business_member(auth.uid(), business_id) OR public.is_business_owner(auth.uid(), business_id));

CREATE POLICY "Members can update time off"
  ON public.professional_time_off FOR UPDATE TO authenticated
  USING (public.is_business_member(auth.uid(), business_id) OR public.is_business_owner(auth.uid(), business_id));

CREATE POLICY "Members can delete time off"
  ON public.professional_time_off FOR DELETE TO authenticated
  USING (public.is_business_member(auth.uid(), business_id) OR public.is_business_owner(auth.uid(), business_id));
