
-- campaigns
CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'automatic',
  status text NOT NULL DEFAULT 'active',
  message_template text,
  audience_filter jsonb NOT NULL DEFAULT '{}'::jsonb,
  sent_count integer NOT NULL DEFAULT 0,
  opened_count integer NOT NULL DEFAULT 0,
  clicked_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT ALL ON public.campaigns TO service_role;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view campaigns" ON public.campaigns FOR SELECT TO authenticated
  USING (public.is_business_member(auth.uid(), business_id) OR public.is_business_owner(auth.uid(), business_id));
CREATE POLICY "Owners manage campaigns" ON public.campaigns FOR ALL TO authenticated
  USING (public.is_business_owner(auth.uid(), business_id))
  WITH CHECK (public.is_business_owner(auth.uid(), business_id));
CREATE TRIGGER campaigns_updated_at BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- waitlist
CREATE TABLE public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  name text NOT NULL,
  phone text,
  preferred_day text,
  preferred_time text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waitlist TO authenticated;
GRANT ALL ON public.waitlist TO service_role;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view waitlist" ON public.waitlist FOR SELECT TO authenticated
  USING (public.is_business_member(auth.uid(), business_id) OR public.is_business_owner(auth.uid(), business_id));
CREATE POLICY "Owners manage waitlist" ON public.waitlist FOR ALL TO authenticated
  USING (public.is_business_owner(auth.uid(), business_id))
  WITH CHECK (public.is_business_owner(auth.uid(), business_id));

-- message_templates
CREATE TABLE public.message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Operacional',
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_templates TO authenticated;
GRANT ALL ON public.message_templates TO service_role;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view templates" ON public.message_templates FOR SELECT TO authenticated
  USING (public.is_business_member(auth.uid(), business_id) OR public.is_business_owner(auth.uid(), business_id));
CREATE POLICY "Owners manage templates" ON public.message_templates FOR ALL TO authenticated
  USING (public.is_business_owner(auth.uid(), business_id))
  WITH CHECK (public.is_business_owner(auth.uid(), business_id));
CREATE TRIGGER message_templates_updated_at BEFORE UPDATE ON public.message_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
