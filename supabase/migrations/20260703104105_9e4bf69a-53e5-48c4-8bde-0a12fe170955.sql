
-- 1) Drop public anon policy on business_hours
DROP POLICY IF EXISTS "Public can view business hours" ON public.business_hours;

-- 2) Re-scope policies from public role to authenticated on sensitive tables
-- clients
DROP POLICY IF EXISTS "Business members can view clients" ON public.clients;
DROP POLICY IF EXISTS "Business owners can manage clients" ON public.clients;
CREATE POLICY "Business members can view clients" ON public.clients
  FOR SELECT TO authenticated
  USING (public.is_business_member(auth.uid(), business_id));
CREATE POLICY "Business owners can manage clients" ON public.clients
  FOR ALL TO authenticated
  USING (public.is_business_owner(auth.uid(), business_id))
  WITH CHECK (public.is_business_owner(auth.uid(), business_id));

-- services
DROP POLICY IF EXISTS "Business members can view services" ON public.services;
DROP POLICY IF EXISTS "Business owners can manage services" ON public.services;
CREATE POLICY "Business members can view services" ON public.services
  FOR SELECT TO authenticated
  USING (public.is_business_member(auth.uid(), business_id));
CREATE POLICY "Business owners can manage services" ON public.services
  FOR ALL TO authenticated
  USING (public.is_business_owner(auth.uid(), business_id))
  WITH CHECK (public.is_business_owner(auth.uid(), business_id));

-- products
DROP POLICY IF EXISTS "Business members can view products" ON public.products;
DROP POLICY IF EXISTS "Business owners can manage products" ON public.products;
CREATE POLICY "Business members can view products" ON public.products
  FOR SELECT TO authenticated
  USING (public.is_business_member(auth.uid(), business_id));
CREATE POLICY "Business owners can manage products" ON public.products
  FOR ALL TO authenticated
  USING (public.is_business_owner(auth.uid(), business_id))
  WITH CHECK (public.is_business_owner(auth.uid(), business_id));

-- appointments
DROP POLICY IF EXISTS "Business members can view appointments" ON public.appointments;
DROP POLICY IF EXISTS "Business owners can manage appointments" ON public.appointments;
CREATE POLICY "Business members can view appointments" ON public.appointments
  FOR SELECT TO authenticated
  USING (public.is_business_member(auth.uid(), business_id));
CREATE POLICY "Business owners can manage appointments" ON public.appointments
  FOR ALL TO authenticated
  USING (public.is_business_owner(auth.uid(), business_id))
  WITH CHECK (public.is_business_owner(auth.uid(), business_id));

-- professionals
DROP POLICY IF EXISTS "Business members can view professionals" ON public.professionals;
DROP POLICY IF EXISTS "Business owners can manage professionals" ON public.professionals;
CREATE POLICY "Business members can view professionals" ON public.professionals
  FOR SELECT TO authenticated
  USING (public.is_business_member(auth.uid(), business_id));
CREATE POLICY "Business owners can manage professionals" ON public.professionals
  FOR ALL TO authenticated
  USING (public.is_business_owner(auth.uid(), business_id))
  WITH CHECK (public.is_business_owner(auth.uid(), business_id));

-- sales
DROP POLICY IF EXISTS "Business members can view sales" ON public.sales;
DROP POLICY IF EXISTS "Business owners can manage sales" ON public.sales;
CREATE POLICY "Business members can view sales" ON public.sales
  FOR SELECT TO authenticated
  USING (public.is_business_member(auth.uid(), business_id));
CREATE POLICY "Business owners can manage sales" ON public.sales
  FOR ALL TO authenticated
  USING (public.is_business_owner(auth.uid(), business_id))
  WITH CHECK (public.is_business_owner(auth.uid(), business_id));

-- sale_items
DROP POLICY IF EXISTS "Business members can view sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Business owners can manage sale_items" ON public.sale_items;
CREATE POLICY "Business members can view sale_items" ON public.sale_items
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.sales s WHERE s.id = sale_items.sale_id AND public.is_business_member(auth.uid(), s.business_id)));
CREATE POLICY "Business owners can manage sale_items" ON public.sale_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.sales s WHERE s.id = sale_items.sale_id AND public.is_business_owner(auth.uid(), s.business_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.sales s WHERE s.id = sale_items.sale_id AND public.is_business_owner(auth.uid(), s.business_id)));

-- 3) Revoke anon SELECT on all app tables (they should not be discoverable pre sign-in)
REVOKE SELECT ON public.appointments, public.business_hours, public.business_members, public.businesses,
                 public.clients, public.products, public.professionals, public.profiles,
                 public.sale_items, public.sales, public.services, public.user_roles
  FROM anon;

-- 4) Hide GraphQL schema from anon/authenticated (app uses PostgREST, not GraphQL)
REVOKE USAGE ON SCHEMA graphql FROM anon, authenticated;
REVOKE USAGE ON SCHEMA graphql_public FROM anon, authenticated;

-- 5) Revoke EXECUTE on SECURITY DEFINER helper functions from anon/authenticated
--    (they're used internally by RLS/triggers, not intended to be callable via RPC)
REVOKE EXECUTE ON FUNCTION public.is_business_owner(uuid, uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_business_member(uuid, uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.create_default_business_hours() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
