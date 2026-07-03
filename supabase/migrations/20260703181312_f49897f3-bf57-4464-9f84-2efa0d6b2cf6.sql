CREATE TABLE public.wa_message_dedup (
  dedup_key TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.wa_message_dedup TO service_role;

ALTER TABLE public.wa_message_dedup ENABLE ROW LEVEL SECURITY;

-- No policies: apenas service_role (via edge function) pode acessar.
-- TODO: criar cron para deletar registros com created_at < now() - interval '1 day'.

CREATE INDEX idx_wa_message_dedup_created_at ON public.wa_message_dedup(created_at);