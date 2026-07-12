
CREATE TABLE public.owner_api_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.owner_api_tokens TO authenticated;
GRANT ALL ON public.owner_api_tokens TO service_role;

ALTER TABLE public.owner_api_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their own tokens"
ON public.owner_api_tokens
FOR ALL
TO authenticated
USING (public.is_business_owner(auth.uid(), business_id))
WITH CHECK (public.is_business_owner(auth.uid(), business_id));

CREATE INDEX owner_api_tokens_business_id_idx ON public.owner_api_tokens(business_id);

-- Trigger function to create a token on business insert
CREATE OR REPLACE FUNCTION public.create_owner_api_token()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.owner_api_tokens (business_id, token)
  VALUES (NEW.id, 'ows_' || encode(gen_random_bytes(16), 'hex'));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_business_created_create_token
AFTER INSERT ON public.businesses
FOR EACH ROW
EXECUTE FUNCTION public.create_owner_api_token();

-- Backfill tokens for existing businesses that don't have one
INSERT INTO public.owner_api_tokens (business_id, token)
SELECT b.id, 'ows_' || encode(gen_random_bytes(16), 'hex')
FROM public.businesses b
WHERE NOT EXISTS (
  SELECT 1 FROM public.owner_api_tokens t WHERE t.business_id = b.id
);
